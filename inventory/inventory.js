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
            
            const imageSrc = item.image || 'https://placehold.co/100x100/2E3A4D/FFF?text=Item';

            // For the black icons, add a filter to make them white.
            const imageStyle = imageSrc && imageSrc.includes('thenounproject') ? 'filter: invert(1);' : '';
            
            const pokeApiUrl = item.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png` : '';
            const fallbackScript = item.id ? `this.onerror=null; this.src='${pokeApiUrl}';` : '';

            itemCard.innerHTML = `
                <img src="${imageSrc}" alt="${item.itemName}" class="item-image" style="${imageStyle}" onerror="${fallbackScript}">
                <div class="item-name">${item.itemName}</div>
                <div class="item-quantity">x${item.quantity}</div>
            `;
            inventoryGrid.appendChild(itemCard);
        });
    }

    fetchInventory();
});
