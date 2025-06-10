document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');
    const adminContent = document.getElementById('admin-content');
    const accessDenied = document.getElementById('access-denied');
    const generateForm = document.getElementById('generate-code-form');
    
    async function verifyAdminAccess() {
        if (!token) {
            showAccessDenied();
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (data.success && data.user.isAdmin) {
                adminContent.style.display = 'block';
                // If user is admin, load the reward items and existing codes
                loadRewardItems();
                loadExistingCodes();
            } else {
                showAccessDenied();
            }
        } catch (error) {
            showAccessDenied();
        }
    }

    function showAccessDenied() {
        adminContent.style.display = 'none';
        accessDenied.style.display = 'block';
    }

    // NEW function to populate the dropdown
    async function loadRewardItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/reward-items`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            const rewardDropdown = document.getElementById('reward-item-id');
            data.items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.itemId;
                option.textContent = item.itemName;
                // Store the name directly on the option element for easy access
                option.dataset.itemName = item.itemName; 
                rewardDropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Failed to load reward items:", error);
            // Optionally show an error message to the admin
        }
    }
    
    // UPDATED form submission logic
    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rewardDropdown = document.getElementById('reward-item-id');
        const selectedOption = rewardDropdown.options[rewardDropdown.selectedIndex];

        const formData = {
            code: document.getElementById('new-code').value.toUpperCase().trim(),
            reward: {
                itemId: selectedOption.value,
                itemName: selectedOption.dataset.itemName, // Get name from the selected option
                quantity: parseInt(document.getElementById('reward-quantity').value, 10)
            },
            useType: document.getElementById('use-type').value
        };

        if (!formData.reward.itemId) {
            alert("Please select a reward item.");
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/generate-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            document.getElementById('generate-result').textContent = data.success ? `Success! Code: ${data.code.code}` : `Error: ${data.error}`;
            if (data.success) {
                generateForm.reset();
                rewardDropdown.selectedIndex = 0; // Reset dropdown to placeholder
                loadExistingCodes();
            }
        } catch (error) {
            document.getElementById('generate-result').textContent = `Error: ${error.message}`;
        }
    });

    async function loadExistingCodes() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/codes`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            const codesList = document.getElementById('codes-list');
            codesList.innerHTML = '';
            data.codes.forEach(code => {
                const codeEl = document.createElement('div');
                codeEl.className = 'code-item';
                codeEl.textContent = `Code: ${code.code} | Reward: ${code.reward.quantity}x ${code.reward.itemName} | Type: ${code.useType} | Redeemed: ${code.usersWhoRedeemed.length} times`;
                codesList.appendChild(codeEl);
            });
        } catch (error) {
            console.error("Could not load codes:", error);
        }
    }

    verifyAdminAccess();
});
