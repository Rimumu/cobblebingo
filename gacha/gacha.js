document.addEventListener('DOMContentLoaded', () => {

    const mainContent = document.getElementById('mainContent');
    const accessGate = document.getElementById('access-gate-container');
    const gateTitle = document.getElementById('gate-title');
    const gateMessage = document.getElementById('gate-message');
    const gateActions = document.getElementById('gate-actions');
    const loadingScreen = document.getElementById('loadingScreen');

    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://cobblebingo-backend-production.up.railway.app';

    // --- Main function to check access and initialize the page ---
    async function initializeGachaPage() {
        const token = localStorage.getItem('token');

        // 1. Check if user is logged in
        if (!token || token === 'undefined') {
            gateMessage.textContent = 'You must be logged in to access the Gacha Realm.';
            gateActions.innerHTML = `<a href="/login.html" class="gate-button">Login Now</a>`;
            accessGate.style.display = 'flex';
            hideLoadingScreen(false); // Hide loading screen without showing content
            return;
        }

        // 2. Fetch user data to check for Discord link
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Your session is invalid. Please log in again.');
            }

            const { user } = await response.json();

            // 3. Check if Discord is linked
            if (!user.discordId) {
                gateMessage.textContent = 'You must link your Discord account to use the Gacha Realm.';
                gateActions.innerHTML = `<a href="${API_BASE_URL}/api/auth/discord?token=${token}" class="gate-button">Link Discord Now</a>`;
                accessGate.style.display = 'flex';
                hideLoadingScreen(false);
                return;
            }

            // 4. Access Granted! Initialize the page.
            hideLoadingScreen(true); // Hide loading screen and show content
            mainContent.style.display = 'block';
            accessGate.style.display = 'none';
            setupGachaBanners(user);

        } catch (error) {
            console.error("Access Check Error:", error);
            gateMessage.textContent = error.message;
            gateActions.innerHTML = `<a href="/login.html" class="gate-button">Login Now</a>`;
            accessGate.style.display = 'flex';
            hideLoadingScreen(false);
        }
    }

    // --- Page Setup Functions ---
    function setupGachaBanners(user) {
        // MOCK DATA (will be replaced with user.inventory)
        const availableBanners = [
            { id: 'starter_pack', name: 'Kanto Starter Pack', description: 'A special pack containing Pokémon from the Kanto region.', image: 'https://placehold.co/800x450/2E3A4D/EFFFFA?text=Kanto+Starters', requiredItemId: 'kanto_pack_ticket' },
            { id: 'legendary_pack', name: 'Legendary Beasts', description: 'A rare pack with a chance to contain a legendary Pokémon.', image: 'https://placehold.co/800x450/D4AF37/000000?text=Legendary+Beasts', requiredItemId: 'legendary_pack_ticket' }
        ];
        const userInventory = { kanto_pack_ticket: 3, legendary_pack_ticket: 1 }; // Placeholder

        renderBanners(availableBanners, userInventory);
        renderInventory(userInventory);
    }
    
    function renderBanners(banners, inventory) {
        const bannerContainer = document.getElementById('banner-container');
        if (!bannerContainer) return;
        bannerContainer.innerHTML = '';

        banners.forEach(banner => {
            const hasItem = inventory[banner.requiredItemId] && inventory[banner.requiredItemId] > 0;
            const bannerEl = document.createElement('div');
            bannerEl.className = 'banner-card';
            bannerEl.innerHTML = `
                <img src="${banner.image}" alt="${banner.name}" class="banner-image">
                <div class="banner-overlay"></div>
                <div class="banner-content">
                    <h2>${banner.name}</h2>
                    <p>${banner.description}</p>
                    <button class="open-pack-btn" data-banner-id="${banner.id}" ${!hasItem ? 'disabled' : ''}>
                        Open Pack
                    </button>
                </div>
            `;
            bannerContainer.appendChild(bannerEl);
        });

        addBannerEventListeners(banners, inventory); // Pass data to the listener
    }
    
    function renderInventory(inventory) {
        const inventoryDisplay = document.getElementById('inventory-display');
        if (!inventoryDisplay) return;
        inventoryDisplay.innerHTML = '';

        for (const [itemId, quantity] of Object.entries(inventory)) {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            const ticketImage = `https://placehold.co/64x64/777777/FFFFFF?text=TICKET`;
            itemEl.innerHTML = `<img src="${ticketImage}" alt="${itemId}"><span>x${quantity}</span>`;
            inventoryDisplay.appendChild(itemEl);
        }
    }

    // --- Event Listeners ---
    function addBannerEventListeners(banners, inventory) {
        document.querySelectorAll('.open-pack-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const bannerId = e.target.getAttribute('data-banner-id');
                const selectedBanner = banners.find(b => b.id === bannerId);

                if (inventory[selectedBanner.requiredItemId] > 0) {
                    alert(`Opening a ${selectedBanner.name}!`);
                    inventory[selectedBanner.requiredItemId]--;
                    renderInventory(inventory);
                    renderBanners(banners, inventory);
                }
            });
        });
    }

    // --- Utility Functions ---
    function hideLoadingScreen(showContent = false) {
        if (loadingScreen) {
            loadingScreen.classList.add("fade-out");
            setTimeout(() => loadingScreen.style.display = "none", 800);
        }
        document.body.classList.remove("loading");
        if (showContent) {
            document.body.classList.add("loaded");
        }
    }

    // --- START THE PROCESS ---
    initializeGachaPage();
});
