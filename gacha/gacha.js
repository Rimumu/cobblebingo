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
    const packIntroOverlay = document.getElementById('pack-opening-intro-overlay');
    const packContainer = packIntroOverlay.querySelector('.opening-pack-container');
    const packArt = packIntroOverlay.querySelector('.opening-pack-art');
    const packNameDisplay = document.getElementById('opening-pack-name');


    // --- API Configuration ---
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');

    // --- Global State ---
    let availableBanners = [];
    let userInventory = new Map();
    let pendingPackOpen = null;

    // --- Image Preloading Function ---
    function preloadImages(urls) {
        const promises = [];
        if (!urls || urls.length === 0) {
            return Promise.resolve();
        }
        urls.forEach(url => {
            const p = new Promise((resolve) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve; // Always resolve even on error
                img.src = url;
            });
            promises.push(p);
        });
        return Promise.all(promises);
    }

    // --- Main Initialization ---
    async function initializeGachaPage() {
        const startTime = Date.now();
        const minimumLoadTime = 2500; // A minimum time for the animation to feel substantial

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
            
            const imageUrls = banners.map(b => b.image);
            await preloadImages(imageUrls);

            // Enforce minimum loading time
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minimumLoadTime - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingTime));

            userInventory = new Map(user.inventory.map(item => [item.itemId, item]));
            
            mainContent.style.display = 'block';
            accessGate.style.display = 'none';

            renderBanners();
            renderInventory();
            addConfirmationListeners();

            hideLoadingScreen(); 

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
        pendingPackOpen = { bannerId, button, packName };
        confirmationModal.style.display = 'flex';
    }

    async function proceedWithPackOpening() {
        if (!pendingPackOpen) return;
        
        const { bannerId, button, packName } = pendingPackOpen;
        
        button.disabled = true;
        button.textContent = 'Opening...';

        packNameDisplay.textContent = packName;
        packArt.className = 'opening-pack-art';
        packArt.classList.add(`pack-theme-${bannerId}`);
        packIntroOverlay.style.display = 'flex';
        packContainer.classList.add('animate');
        packNameDisplay.classList.add('animate');

        await new Promise(resolve => setTimeout(resolve, 2500));
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/gacha/open-pack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bannerId })
            });
            
            packIntroOverlay.style.display = 'none';
            packContainer.classList.remove('animate');
            packNameDisplay.classList.remove('animate');

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
            packIntroOverlay.style.display = 'none';
            packContainer.classList.remove('animate');
            packNameDisplay.classList.remove('animate');
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

    function hideLoadingScreen() {
        loadingScreen.classList.add("fade-out");
        document.body.classList.add("loaded"); 
        
        setTimeout(() => {
            loadingScreen.style.display = "none";
        }, 800);
        
        document.body.classList.remove("loading");
    }

    function displayGateMessage(message, linkUrl, linkText) {
        const gateMessage = document.getElementById('gate-message');
        const gateActions = document.getElementById('gate-actions');
        if (gateMessage && gateActions) {
            gateMessage.textContent = message;
            gateActions.innerHTML = `<a href="${linkUrl}" class="gate-button">${linkText}</a>`;
            accessGate.style.display = 'flex';
        }
        hideLoadingScreen();
    }
    
    initializeGachaPage();
});
