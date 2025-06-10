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
    let userInventory = {};

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

            userInventory = user.inventory.reduce((acc, item) => {
                acc[item.itemId] = item.quantity;
                return acc;
            }, {});
            
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
            const hasItem = userInventory[banner.requiredItemId] > 0;
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
            const quantity = userInventory[itemId] || 0;
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            const ticketImage = `https://placehold.co/64x64/777777/FFFFFF?text=TICKET`;
            itemEl.innerHTML = `<img src="${ticketImage}" alt="${itemId}"><span>x${quantity}</span>`;
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
            
            userInventory = data.newInventory.reduce((acc, item) => {
                acc[item.itemId] = item.quantity;
                return acc;
            }, {});
            
            rewardDisplay.innerHTML = `<h3>${data.reward.name}</h3><p>Rarity: ${data.reward.rarity}</p>`;
            resultsModal.style.display = 'flex';
            
            renderInventory();
            renderBanners();
        } catch (error) {
            alert(`Error: ${error.message}`);
            e.target.disabled = false;
            e.target.textContent = 'Open Pack';
        }
    }

    function startOpeningAnimation(reelItems) {
        return new Promise(resolve => {
            if (!reelItems || reelItems.length === 0) {
                console.error("Animation failed: Reel items not provided by server.");
                return resolve();
            }

            reel.innerHTML = '';
            reelItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = `reel-item ${item.rarity}`;
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/100x100/111/FFF?text=Error';">
                    <p>${item.name}</p>
                `;
                reel.appendChild(itemEl);
            });

            const winningIndex = 70; 
            const itemWidth = 150; 
            const itemMargin = 10; 
            const totalItemWidth = itemWidth + itemMargin;
            const containerWidth = reel.parentElement.offsetWidth;
            const randomJitter = (Math.random() - 0.5) * (itemWidth * 0.6);
            const targetPosition = (totalItemWidth * winningIndex) - (containerWidth / 2) + (totalItemWidth / 2) + randomJitter;
            
            animationOverlay.style.display = 'flex';
            reel.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                reel.classList.add('spinning');
                reel.style.transform = `translateX(-${targetPosition}px)`;
            }, 100);

            setTimeout(() => {
                reel.classList.remove('spinning');
                animationOverlay.style.display = 'none';
                resolve();
            }, 7100); 
        });
    }

    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', () => {
            resultsModal.style.display = 'none';
        });
    }

    // --- Utility Functions ---
    function hideLoadingScreen(showContent = false) {
        const loadingScreen = document.getElementById('loadingScreen');
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
