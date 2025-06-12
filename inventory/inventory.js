document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');
    const inventoryGrid = document.getElementById('inventory-grid');
    
    // --- DOM elements for confirmation modal ---
    const confirmationOverlay = document.getElementById('item-confirmation-overlay');
    const confirmationMessage = document.getElementById('item-confirmation-message');
    const confirmBtn = document.getElementById('confirm-use-btn');
    const cancelBtn = document.getElementById('cancel-use-btn');

    // --- START: New DOM elements for notice modal ---
    const noticeOverlay = document.getElementById('item-notice-overlay');
    const noticeTitle = document.getElementById('notice-title');
    const noticeMessage = document.getElementById('notice-message');
    const closeNoticeBtn = document.getElementById('close-notice-btn');
    // --- END: New DOM elements ---

    if (!token) {
        inventoryGrid.innerHTML = '<p>You must be <a href="/login.html">logged in</a> to view your inventory.</p>';
        return;
    }

    // --- Function to show custom confirmation ---
    function showConfirmation(itemName) {
        return new Promise(resolve => {
            confirmationMessage.textContent = `Are you sure you want to use one ${itemName}? This will send the item to you in-game.`;
            confirmationOverlay.style.display = 'flex';

            const onConfirm = () => {
                confirmationOverlay.style.display = 'none';
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                confirmationOverlay.style.display = 'none';
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            };

            confirmBtn.addEventListener('click', onConfirm, { once: true });
            cancelBtn.addEventListener('click', onCancel, { once: true });
        });
    }

    // --- START: New function to show notice/warning modal ---
    function showNotice(title, message) {
        return new Promise(resolve => {
            noticeTitle.textContent = title;
            noticeMessage.textContent = message;
            noticeOverlay.style.display = 'flex';

            const onClose = () => {
                noticeOverlay.style.display = 'none';
                resolve();
            };

            closeNoticeBtn.addEventListener('click', onClose, { once: true });
        });
    }
    // --- END: New function ---

    async function fetchInventory() {
        try {
            inventoryGrid.innerHTML = '<p>Loading your items...</p>';
            const response = await fetch(`${API_BASE_URL}/api/user/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            renderInventory(data.user.inventory);
        } catch (error) {
            inventoryGrid.innerHTML = `<p>Error loading inventory: ${error.message}</p>`;
        }
    }

    function renderInventory(inventory) {
        if (!inventory || inventory.length === 0) {
            inventoryGrid.innerHTML = '<p>Your inventory is empty. Try opening some packs in the Gacha Realm!</p>';
            return;
        }

        inventoryGrid.innerHTML = '';
        inventory.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'inventory-item-card';
            itemCard.dataset.itemId = item.itemId; 
            
            const imageSrc = item.image || 'https://placehold.co/100x100/2E3A4D/FFF?text=Item';
            const imageStyle = imageSrc && imageSrc.includes('thenounproject') ? 'filter: invert(1);' : '';
            
            const pokeApiUrl = item.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png` : '';
            const fallbackScript = item.id ? `this.onerror=null; this.src='${pokeApiUrl}';` : '';

            itemCard.innerHTML = `
                <img src="${imageSrc}" alt="${item.itemName}" class="item-image" style="${imageStyle}" onerror="${fallbackScript}">
                <div class="item-name">${item.itemName}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <div class="item-popup-overlay">
                    <button class="use-item-btn" data-item-name="${item.itemName}">Use</button>
                </div>
            `;
            inventoryGrid.appendChild(itemCard);
        });
    }

    inventoryGrid.addEventListener('click', async (e) => {
        const itemCard = e.target.closest('.inventory-item-card');
        if (!itemCard) return;

        if (e.target.classList.contains('use-item-btn')) {
            e.stopPropagation(); 
            const button = e.target;
            const itemId = itemCard.dataset.itemId;
            const itemName = button.dataset.itemName;
            
            const userConfirmed = await showConfirmation(itemName);
            if (userConfirmed) {
                button.disabled = true;
                button.textContent = 'Using...';

                try {
                    const response = await fetch(`${API_BASE_URL}/api/inventory/use`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ itemId })
                    });
                    const data = await response.json();

                    if (data.success) {
                        await showNotice('Success!', data.message);
                        renderInventory(data.newInventory);
                    } else {
                        // --- MODIFIED: Replaced alert() with new notice modal ---
                        if (data.errorCode === 'PLAYER_OFFLINE') {
                            await showNotice('Player Offline', 'Please log in to the server to receive your item in-game!');
                        } else {
                            throw new Error(data.error);
                        }
                        button.disabled = false;
                        button.textContent = 'Use';
                    }
                } catch (error) {
                    await showNotice('Error', error.message);
                    button.disabled = false;
                    button.textContent = 'Use';
                }
            }
        } else {
            const currentlyActive = document.querySelector('.inventory-item-card.active');
            if (currentlyActive && currentlyActive !== itemCard) {
                currentlyActive.classList.remove('active');
            }
            itemCard.classList.toggle('active');
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.inventory-item-card') && !e.target.closest('.confirmation-overlay') && !e.target.closest('.notice-overlay')) {
            const currentlyActive = document.querySelector('.inventory-item-card.active');
            if (currentlyActive) {
                currentlyActive.classList.remove('active');
            }
        }
    });

    fetchInventory();
});
