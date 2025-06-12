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
        if (inventory.length === 0) {
            inventoryGrid.innerHTML = '<p>Your inventory is empty. Try opening some packs in the Gacha Realm!</p>';
            return;
        }

        inventoryGrid.innerHTML = '';
        inventory.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'inventory-item-card';
            
            const imageSrc = item.image || 'https://placehold.co/100x100/2E3A4D/FFF?text=Item';
            const imageStyle = imageSrc && imageSrc.includes('thenounproject') ? 'filter: invert(1);' : '';
            
            const pokeApiUrl = item.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item.id}.png` : '';
            const fallbackScript = item.id ? `this.onerror=null; this.src='${pokeApiUrl}';` : '';

            // Add a "Use" button
            itemCard.innerHTML = `
                <img src="${imageSrc}" alt="${item.itemName}" class="item-image" style="${imageStyle}" onerror="${fallbackScript}">
                <div class="item-name">${item.itemName}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <button class="use-item-btn" data-item-id="${item.itemId}" data-item-name="${item.itemName}">Use</button>
            `;
            inventoryGrid.appendChild(itemCard);
        });
    }

    // Add a single event listener for all "Use" buttons
    inventoryGrid.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('use-item-btn')) {
            return;
        }

        const button = e.target;
        const itemId = button.dataset.itemId;
        const itemName = button.dataset.itemName;

        if (confirm(`Are you sure you want to use one ${itemName}? This will send the item to you in-game.`)) {
            button.disabled = true;
            button.textContent = 'Using...';

            try {
                const response = await fetch(`${API_BASE_URL}/api/inventory/use`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ itemId })
                });

                const data = await response.json();

                if (data.success) {
                    alert(data.message);
                    // Re-render the inventory with the updated data from the server
                    renderInventory(data.newInventory);
                } else {
                    throw new Error(data.error);
                }

            } catch (error) {
                alert(`Error: ${error.message}`);
                button.disabled = false;
                button.textContent = 'Use';
            }
        }
    });

    fetchInventory();
});
