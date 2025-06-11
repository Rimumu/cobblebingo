document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const mainContent = document.getElementById('mainContent');
    const accessGate = document.getElementById('access-gate-container');
    const loadingScreen = document.getElementById('loadingScreen');
    const animationOverlay = document.getElementById('animation-overlay');
    const reel = document.getElementById('reel');
    const resultsModal = document.getElementById('results-modal-overlay');
    const rewardDisplay = document.getElementById('reward-display');
    const closeResultsBtn = document.getElementById('close-results-btn');

    // --- API Configuration ---
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');

    // --- Global State ---
    let availableBanners = [];
    let userInventory = new Map(); // Use a Map to store the full item object

    // --- Main Initialization ---
    async function initializeGachaPage() {
        if (!token || token === 'undefined') {
            displayGateMessage('You must be logged in to access the Gacha Realm.', '/login.html', 'Login Now');
            return;
        }
        try {
            const [userResponse, bannersResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/api/gacha/banners`)
            ]);

            if (!userResponse.ok) throw new Error('Your session is invalid. Please log in again.');
            const { user } = await userResponse.json();
            const { banners } = await bannersResponse.json();
            availableBanners = banners;

            if (!user.discordId) {
                displayGateMessage('You must link your Discord account to use the Gacha Realm.', `${API_BASE_URL}/api/auth/discord?token=${token}`, 'Link Discord Now');
                return;
            }

            // Store the full item object in the Map, keyed by itemId
            userInventory = new Map(user.inventory.map(item => [item.itemId, item]));
            
            hideLoadingScreen(true);
            mainContent.style.display = 'block';
            accessGate.style.display = 'none';

            renderBanners();
            renderInventory();

        } catch (error) {
            console.error("Initialization Error:", error);
            displayGateMessage(error.message, '/login.html', 'Login Now');
        }
    }

    // --- UI Rendering ---
    function renderBanners() {
        const bannerContainer = document.getElementById('banner-container');
        if (!bannerContainer) return;
        bannerContainer.innerHTML = '';

        availableBanners.forEach(banner => {
            // Check for the item in our new Map
            const hasItem = userInventory.has(banner.requiredItemId) && userInventory.get(banner.requiredItemId).quantity > 0;
            const bannerEl = document.createElement('div');
            bannerEl.className = 'banner-card';
            bannerEl.innerHTML = `
                <img src="${banner.image}" alt="${banner.name}" class="banner-image">
                <div class="banner-overlay"></div>
                <div class="banner-content">
                    <h2>${banner.name}</h2>
                    <p>${banner.description}</p>
                    <button class="open-pack-btn" data-banner-id="${banner.id}" ${!hasItem ? 'disabled' : ''}>Open Pack</button>
                </div>`;
            bannerContainer.appendChild(bannerEl);
        });
        addBannerEventListeners();
    }
    
    function renderInventory() {
        const inventoryDisplay = document.getElementById('inventory-display');
        if (!inventoryDisplay) return;
        inventoryDisplay.innerHTML = '';
        
        const requiredItems = new Set(availableBanners.map(b => b.requiredItemId));

        for(const itemId of requiredItems) {
            const item = userInventory.get(itemId);
            const quantity = item ? item.quantity : 0;
            // Use the image from the item data, with a fallback
            const imageSrc = item ? item.image : 'https://placehold.co/64x64/777777/FFFFFF?text=ITEM';
            const altText = item ? item.itemName : itemId;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            
            // Apply a CSS filter to the correct images to make them visible
            const imageStyle = imageSrc && imageSrc.includes('thenounproject') 
                ? 'filter: invert(1) drop-shadow(0 2px 3px rgba(0,0,0,0.5));' 
                : 'filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));';

            itemEl.innerHTML = `<img src="${imageSrc}" alt="${altText}" style="width: 48px; height: 48px; object-fit: contain; ${imageStyle}"><span>x${quantity}</span>`;
            inventoryDisplay.appendChild(itemEl);
        }
    }

    // --- Event Handling & Animation ---
    function addBannerEventListeners() {
        document.querySelectorAll('.open-pack-btn').forEach(button => {
            button.addEventListener('click', handleOpenPack);
        });
    }

    async function handleOpenPack(e) {
        const bannerId = e.target.getAttribute('data-banner-id');
        e.target.disabled = true;
        e.target.textContent = 'Opening...';
        try {
            const response = await fetch(`${API_BASE_URL}/api/gacha/open-pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bannerId })
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            
            await startOpeningAnimation(data.animationReel);
            
            // Repopulate inventory map with updated data from server
            userInventory = new Map(data.newInventory.map(item => [item.itemId, item]));
            
            const reward = data.reward;
            const pokeApiUrl = reward.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${reward.id}.png` : '';
            const fallbackScript = reward.id ? `this.onerror=null; this.src='${pokeApiUrl}';` : '';

            rewardDisplay.innerHTML = `
                <img id="reward-image" src="${reward.image}" alt="${reward.name}" onerror="${fallbackScript}">
                <h3>${reward.name}</h3>
                <p>Rarity: ${reward.rarity}</p>
            `;
            resultsModal.style.display = 'flex';
            
            renderInventory();
            renderBanners();
        } catch (error) {
            alert(`Error: ${error.message}`);
            e.target.disabled = false;
            e.target.textContent = 'Open Pack';
        }
    }

    // --- FINAL, 100% SYNCHRONIZED CSS-BASED ANIMATION ---
    function startOpeningAnimation(reelItems) {
        return new Promise(resolve => {
            if (!reelItems || reelItems.length === 0) {
                console.error("Animation failed: Reel items not provided by server.");
                return resolve();
            }

            // 1. Duplicate content to create a visually infinite reel.
            const animationContent = [...reelItems, ...reelItems];
            reel.innerHTML = '';
            animationContent.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = `reel-item ${item.rarity}`;
                
                const pokeApiUrl = item.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png` : '';
                const fallbackScript = item.id ? `this.onerror=null; this.src='${pokeApiUrl}';` : '';

                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" onerror="${fallbackScript}">
                    <p>${item.name}</p>
                `;
                reel.appendChild(itemEl);
            });

            // 2. Make the animation overlay visible FIRST.
            animationOverlay.style.display = 'flex';
            reel.style.transition = 'none';
            reel.style.transform = `translateX(0px)`;
            
            // 3. CRITICAL FIX: Use requestAnimationFrame to wait for the browser
            // to render the elements before we measure them. This guarantees
            // the width calculation is accurate.
            requestAnimationFrame(() => {
                // 4. Now that elements are visible, calculate the exact stopping point.
                const winningIndex = 70; // The fixed winning position from the server.
                const itemWidth = 150;
                const itemMargin = 10;
                const totalItemWidth = itemWidth + itemMargin;
                const containerWidth = reel.parentElement.offsetWidth;
                
                // This calculation is now 100% deterministic and accurate.
                const targetPosition = (totalItemWidth * winningIndex) - (containerWidth / 2) + (totalItemWidth / 2);

                // 5. Apply the smooth animation.
                reel.style.transition = 'transform 7s cubic-bezier(0.1, 0.4, 0.2, 1)';
                reel.style.transform = `translateX(-${targetPosition}px)`;
            
                // 6. End the process after the animation finishes.
                setTimeout(() => {
                    animationOverlay.style.display = 'none';
                    resolve();
                }, 7100); // Must be slightly longer than the CSS transition.
            });
        });
    }

    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', () => {
            resultsModal.style.display = 'none';
        });
    }

    // --- Utility Functions ---
    function hideLoadingScreen(showContent = false) {
        if (loadingScreen) {
            loadingScreen.classList.add("fade-out");
            setTimeout(() => loadingScreen.style.display = "none", 800);
        }
        document.body.classList.remove("loading");
        if (showContent) document.body.classList.add("loaded");
    }

    function displayGateMessage(message, linkUrl, linkText) {
        const gateMessage = document.getElementById('gate-message');
        const gateActions = document.getElementById('gate-actions');
        if (gateMessage && gateActions) {
            gateMessage.textContent = message;
            gateActions.innerHTML = `<a href="${linkUrl}" class="gate-button">${linkText}</a>`;
            accessGate.style.display = 'flex';
        }
        hideLoadingScreen(false);
    }
    
    initializeGachaPage();
});
