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
    let packLootTables = {}; // Cache for pack contents

    // --- Main Initialization ---
    async function initializeGachaPage() {
        if (!token || token === 'undefined') {
            displayGateMessage('You must be logged in to access the Gacha Realm.', '/login.html', 'Login Now');
            return;
        }

        try {
            const userResponse = await fetch(`${API_BASE_URL}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!userResponse.ok) throw new Error('Your session is invalid. Please log in again.');
            const { user } = await userResponse.json();

            if (!user.discordId) {
                displayGateMessage('You must link your Discord account to use the Gacha Realm.', `${API_BASE_URL}/api/auth/discord?token=${token}`, 'Link Discord Now');
                return;
            }
            
            const bannersResponse = await fetch(`${API_BASE_URL}/api/gacha/banners`);
            const { banners } = await bannersResponse.json();
            availableBanners = banners;

            // Pre-fetch all pack contents for animations
            for (const banner of availableBanners) {
                const contentsResponse = await fetch(`${API_BASE_URL}/api/gacha/pack-contents/${banner.id}`);
                const { contents } = await contentsResponse.json();
                packLootTables[banner.id] = contents;
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
    function renderBanners() { /* ... same as before ... */ }
    function renderInventory() { /* ... same as before ... */ }

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
            
            // Start the animation with the reward we received from the server
            await startOpeningAnimation(bannerId, data.reward);
            
            // Update UI after animation finishes
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

    function startOpeningAnimation(bannerId, winningItem) {
        return new Promise(resolve => {
            const lootTable = packLootTables[bannerId];
            if (!lootTable) {
                resolve();
                return;
            }

            // 1. Build the reel
            let reelItems = [];
            const reelLength = 50; // Number of items to show in the animation
            for (let i = 0; i < reelLength; i++) {
                const randomItem = lootTable[Math.floor(Math.random() * lootTable.length)];
                reelItems.push(randomItem);
            }

            // 2. Place the winning item near the end for suspense
            const winningIndex = reelLength - 5; 
            reelItems[winningIndex] = winningItem;

            // 3. Populate the reel HTML
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

            // 4. Calculate the animation destination
            const itemWidth = 150; // Width of .reel-item
            const itemMargin = 10;  // Margin (5px on each side)
            const totalItemWidth = itemWidth + itemMargin;
            const containerWidth = reel.parentElement.offsetWidth;
            
            // The magic number: position the winning item in the center
            const randomOffset = (Math.random() - 0.5) * itemWidth * 0.8;
            const targetPosition = (totalItemWidth * winningIndex) - (containerWidth / 2) + (totalItemWidth / 2) + randomOffset;
            
            // 5. Run the animation
            animationOverlay.style.display = 'flex';
            reel.style.transform = 'translateX(0)'; // Reset position
            
            setTimeout(() => {
                reel.classList.add('spinning');
                reel.style.transform = `translateX(-${targetPosition}px)`;
            }, 100); // Short delay to ensure transition is applied

            // 6. Resolve the promise when animation is over
            setTimeout(() => {
                reel.classList.remove('spinning');
                animationOverlay.style.display = 'none';
                resolve();
            }, 7100); // Must be slightly longer than the animation duration (7s)
        });
    }

    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', () => {
            resultsModal.style.display = 'none';
        });
    }

    // --- Utility Functions and Startup ---
    // ... (Your existing hideLoadingScreen and displayGateMessage functions) ...
    initializeGachaPage();
});
