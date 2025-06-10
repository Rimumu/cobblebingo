document.addEventListener('DOMContentLoaded', () => {

    // --- LOADING SCREEN LOGIC ---
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById("loadingScreen");
        document.body.classList.remove("loading");
        document.body.classList.add("loaded"); // New class to fade in content
        
        if (loadingScreen) {
            loadingScreen.classList.add("fade-out");
            setTimeout(() => {
                loadingScreen.style.display = "none";
            }, 800);
        }
    }

    // Initialize after a delay to show off the cool loading screen
    setTimeout(hideLoadingScreen, 2000);


    // --- MOCK DATA (Temporary) ---
    // In the future, this data will come from your server
    const availableBanners = [
        {
            id: 'starter_pack',
            name: 'Kanto Starter Pack',
            description: 'A special pack containing Pokémon from the Kanto region. A great start for any trainer!',
            image: 'https://placehold.co/800x450/2E3A4D/EFFFFA?text=Kanto+Starters',
            requiredItemId: 'kanto_pack_ticket'
        },
        {
            id: 'legendary_pack',
            name: 'Legendary Beasts',
            description: 'A rare pack with a chance to contain a legendary Pokémon from the Johto region.',
            image: 'https://placehold.co/800x450/D4AF37/000000?text=Legendary+Beasts',
            requiredItemId: 'legendary_pack_ticket'
        }
    ];

    // This simulates the inventory we will get from the server
    const userInventory = {
        kanto_pack_ticket: 3,
        legendary_pack_ticket: 1
    };


    // --- RENDER PAGE ELEMENTS ---
    const bannerContainer = document.getElementById('banner-container');
    const inventoryDisplay = document.getElementById('inventory-display');

    function renderBanners() {
        if (!bannerContainer) return;
        bannerContainer.innerHTML = ''; // Clear existing banners

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
                    <button class="open-pack-btn" data-banner-id="${banner.id}" ${!hasItem ? 'disabled' : ''}>
                        Open Pack
                    </button>
                </div>
            `;
            bannerContainer.appendChild(bannerEl);
        });

        addBannerEventListeners();
    }
    
    function renderInventory() {
        if (!inventoryDisplay) return;
        inventoryDisplay.innerHTML = ''; // Clear existing inventory

        for (const [itemId, quantity] of Object.entries(userInventory)) {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            // Using placeholder images for tickets
            const ticketImage = `https://placehold.co/64x64/777777/FFFFFF?text=TICKET`;
            itemEl.innerHTML = `
                <img src="${ticketImage}" alt="${itemId}">
                <span>x${quantity}</span>
            `;
            inventoryDisplay.appendChild(itemEl);
        }
    }


    // --- EVENT LISTENERS ---
    function addBannerEventListeners() {
        document.querySelectorAll('.open-pack-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const bannerId = e.target.getAttribute('data-banner-id');
                const selectedBanner = availableBanners.find(b => b.id === bannerId);

                if (userInventory[selectedBanner.requiredItemId] > 0) {
                    alert(`Opening a ${selectedBanner.name}!`);
                    // In the future, this will call the server to open the pack
                    // For now, we'll just decrement the count
                    userInventory[selectedBanner.requiredItemId]--;
                    renderInventory();
                    renderBanners(); // Re-render to update button states
                } else {
                    alert('You do not have the required pack to open this banner.');
                }
            });
        });
    }

    // --- INITIALIZE THE PAGE ---
    renderBanners();
    renderInventory();
});
