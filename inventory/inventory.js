document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');
    const inventoryGrid = document.getElementById('inventory-grid');

    if (!token) {
        inventoryGrid.innerHTML = '<p>You must be <a href="/login.html">logged in</a> to view your inventory.</p>';
        return;
    }

    async function fetchInventory() {
        try {
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
        if (inventory.length === 0) {
            inventoryGrid.innerHTML = '<p>Your inventory is empty. Try opening some packs in the Gacha Realm!</p>';
            return;
        }

        inventoryGrid.innerHTML = '';
        inventory.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'inventory-item-card';
            
            // Using placeholder images for now
            const imageSrc = item.itemId.includes('ticket') 
                ? 'https://placehold.co/100x100/777/FFF?text=Ticket'
                : 'https://placehold.co/100x100/2E3A4D/FFF?text=Item';

            itemCard.innerHTML = `
                <img src="${imageSrc}" alt="${item.itemName}" class="item-image">
                <div class="item-name">${item.itemName}</div>
                <div class="item-quantity">x${item.quantity}</div>
            `;
            inventoryGrid.appendChild(itemCard);
        });
    }

    fetchInventory();
});
