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
    const confirmationModal = document.getElementById('confirmation-modal-overlay');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-open-btn');
    const cancelBtn = document.getElementById('cancel-open-btn');
    
    // --- NEW: Pack Intro Animation Elements ---
    const packIntroOverlay = document.getElementById('pack-opening-intro-overlay');
    const packArt = packIntroOverlay.querySelector('.opening-pack-art');

    // --- API Configuration ---
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');

    // --- Global State ---
    let availableBanners = [];
    let userInventory = new Map();
    let pendingPackOpen = null;

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

            userInventory = new Map(user.inventory.map(item => [item.itemId, item]));
            
            hideLoadingScreen(true);
            mainContent.style.display = 'block';
            accessGate.style.display = 'none';

            renderBanners();
            renderInventory();
            addConfirmationListeners();

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
            const hasItem = userInventory.has(banner.requiredItemId) && userInventory.get(banner.requiredItemId).quantity > 0;
            const bannerEl = document.createElement('div');
            bannerEl.className = 'banner-card';
            bannerEl.innerHTML = `
                <img src="${banner.image}" alt="${banner.name}" class="banner-image">
                <div class="banner-overlay"></div>
                <div class="banner-content">
                    <h2 class="banner-name">${banner.name}</h2>
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
            const imageSrc = item ? item.image : 'https://placehold.co/64x64/777777/FFFFFF?text=ITEM';
            const altText = item ? item.itemName : itemId;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            
            const imageStyle = imageSrc && imageSrc.includes('thenounproject') 
                ? 'filter: invert(1) drop-shadow(0 2px 3px rgba(0,0,0,0.5));' 
                : 'filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));';

            itemEl.innerHTML = `<img src="${imageSrc}" alt="${altText}" style="width: 48px; height: 48px; object-fit: contain; ${imageStyle}"><span>x${quantity}</span>`;
            inventoryDisplay.appendChild(itemEl);
        }
    }

    // --- Event Handling & Logic ---
    function addBannerEventListeners() {
        document.querySelectorAll('.open-pack-btn').forEach(button => {
            button.addEventListener('click', handleOpenPackClick);
        });
    }
    
    function handleOpenPackClick(e) {
        const button = e.target;
        const bannerId = button.getAttribute('data-banner-id');
        const packName = button.closest('.banner-content').querySelector('.banner-name').textContent;

        confirmationMessage.textContent = `Are you sure you want to open ${packName}?`;
        pendingPackOpen = { bannerId, button };
        confirmationModal.style.display = 'flex';
    }

    async function proceedWithPackOpening() {
        if (!pendingPackOpen) return;
        
        const { bannerId, button } = pendingPackOpen;
        
        button.disabled = true;
        button.textContent = 'Opening...';

        // --- NEW: Trigger intro animation ---
        packIntroOverlay.style.display = 'flex';
        packArt.classList.add('animate');

        // Wait for the animation to finish (2.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/gacha/open-pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bannerId })
            });

            // Hide intro animation as soon as API call is done
            packArt.classList.remove('animate');
            packIntroOverlay.style.display = 'none';

            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            
            await startOpeningAnimation(data.animationReel);
            
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
            // Reset UI in case of failure
            packArt.classList.remove('animate');
            packIntroOverlay.style.display = 'none';
            button.disabled = false;
            button.textContent = 'Open Pack';
        } finally {
            pendingPackOpen = null;
        }
    }

    function addConfirmationListeners() {
        cancelBtn.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
            pendingPackOpen = null;
        });

        confirmBtn.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
            proceedWithPackOpening();
        });
    }

    function startOpeningAnimation(reelItems) {
        return new Promise(resolve => {
            if (!reelItems || reelItems.length === 0) {
                console.error("Animation failed: Reel items not provided by server.");
                return resolve();
            }

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

            animationOverlay.style.display = 'flex';
            reel.style.transition = 'none';
            reel.style.transform = `translateX(0px)`;
            
            requestAnimationFrame(() => {
                const winningIndex = 70;
                const itemWidth = 150;
                const itemMargin = 10;
                const totalItemWidth = itemWidth + itemMargin;
                const containerWidth = reel.parentElement.offsetWidth;
                const targetPosition = (totalItemWidth * winningIndex) - (containerWidth / 2) + (totalItemWidth / 2);

                reel.style.transition = 'transform 7s cubic-bezier(0.1, 0.4, 0.2, 1)';
                reel.style.transform = `translateX(-${targetPosition}px)`;
            
                setTimeout(() => {
                    animationOverlay.style.display = 'none';
                    resolve();
                }, 7100);
            });
        });
    }

    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', () => {
            resultsModal.style.display = 'none';
        });
    }

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
