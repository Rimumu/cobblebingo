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
                loadRewardItems();
                loadExistingCodes();
                setupCustomSelect(); // Initialize the custom dropdown
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
    
    // --- NEW: Function to control the custom dropdown ---
    function setupCustomSelect() {
        const customSelect = document.querySelector('.custom-select');
        if (!customSelect) return;

        const trigger = customSelect.querySelector('.custom-select__trigger');
        const optionsContainer = customSelect.querySelector('.custom-options');
        const originalSelect = document.getElementById('reward-item-id');
        const triggerText = trigger.querySelector('span');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('open');
        });

        window.addEventListener('click', () => {
            if (customSelect.classList.contains('open')) {
                customSelect.classList.remove('open');
            }
        });
        
        // This function will be called when options are loaded
        window.populateCustomOptions = (items) => {
            optionsContainer.innerHTML = '';
            items.forEach(item => {
                const optionEl = document.createElement('span');
                optionEl.className = 'custom-option';
                optionEl.textContent = item.itemName;
                optionEl.setAttribute('data-value', item.itemId);
                
                optionEl.addEventListener('click', () => {
                    const selectedValue = optionEl.getAttribute('data-value');
                    originalSelect.value = selectedValue;
                    triggerText.textContent = optionEl.textContent;
                    
                    // Update 'selected' class
                    optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                    optionEl.classList.add('selected');
                    
                    customSelect.classList.remove('open');
                });
                
                optionsContainer.appendChild(optionEl);
            });
        };
    }

    async function loadRewardItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/reward-items`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            const originalSelect = document.getElementById('reward-item-id');
            originalSelect.innerHTML = '<option value="" disabled selected>Select a Reward Item...</option>';
            data.items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.itemId;
                option.textContent = item.itemName;
                originalSelect.appendChild(option);
            });
            
            // Populate our new custom dropdown
            if(window.populateCustomOptions) {
                window.populateCustomOptions(data.items);
            }
            
        } catch (error) {
            console.error("Failed to load reward items:", error);
        }
    }
    
    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            code: document.getElementById('new-code').value.toUpperCase().trim(),
            itemId: document.getElementById('reward-item-id').value,
            quantity: parseInt(document.getElementById('reward-quantity').value, 10),
            useType: document.getElementById('use-type').value
        };

        if (!formData.itemId) {
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
                document.querySelector('.custom-select__trigger span').textContent = 'Select a Reward Item...';
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
