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
                setupCustomSelects(); // Initialize all custom dropdowns
                setupQuantitySelector(); // Initialize the quantity input
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
    
    // --- Function to control ALL custom dropdowns ---
    function setupCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(customSelect => {
            const trigger = customSelect.querySelector('.custom-select__trigger');
            const optionsContainer = customSelect.querySelector('.custom-options');
            const originalSelectId = customSelect.closest('.custom-select-wrapper').id.replace('-wrapper', '');
            const originalSelect = document.getElementById(originalSelectId.replace('-item','-item-id').replace('use-type','use-type'));
            const triggerText = trigger.querySelector('span');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other open selects
                document.querySelectorAll('.custom-select.open').forEach(openSelect => {
                    if (openSelect !== customSelect) {
                        openSelect.classList.remove('open');
                    }
                });
                customSelect.classList.toggle('open');
            });
            
            optionsContainer.addEventListener('click', (e) => {
                 if (e.target.classList.contains('custom-option')) {
                    const optionEl = e.target;
                    const selectedValue = optionEl.getAttribute('data-value');
                    originalSelect.value = selectedValue;
                    triggerText.textContent = optionEl.textContent;

                    optionsContainer.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
                    optionEl.classList.add('selected');

                    customSelect.classList.remove('open');
                }
            });
        });
        
        window.addEventListener('click', () => {
            document.querySelectorAll('.custom-select.open').forEach(openSelect => {
                openSelect.classList.remove('open');
            });
        });
    }

    // --- NEW: Function to control the quantity input ---
    function setupQuantitySelector() {
        const selector = document.querySelector('.quantity-selector');
        if (!selector) return;

        const input = selector.querySelector('input');
        const decrementBtn = selector.querySelector('[data-action="decrement"]');
        const incrementBtn = selector.querySelector('[data-action="increment"]');
        const min = parseInt(input.min, 10);

        decrementBtn.addEventListener('click', () => {
            let currentValue = parseInt(input.value, 10);
            if (currentValue > min) {
                input.value = currentValue - 1;
            }
        });

        incrementBtn.addEventListener('click', () => {
            let currentValue = parseInt(input.value, 10);
            input.value = currentValue + 1;
        });
    }


    async function loadRewardItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/reward-items`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            const originalSelect = document.getElementById('reward-item-id');
            const customOptionsContainer = document.querySelector('#reward-item-wrapper .custom-options');
            
            originalSelect.innerHTML = '<option value="" disabled selected>Select a Reward Item...</option>';
            customOptionsContainer.innerHTML = ''; // Clear existing custom options

            data.items.forEach(item => {
                // Populate original hidden select
                const option = document.createElement('option');
                option.value = item.itemId;
                option.textContent = item.itemName;
                originalSelect.appendChild(option);

                // Populate new custom dropdown
                const customOption = document.createElement('span');
                customOption.className = 'custom-option';
                customOption.textContent = item.itemName;
                customOption.setAttribute('data-value', item.itemId);
                customOptionsContainer.appendChild(customOption);
            });
            
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
                // Reset custom displays to their placeholder/default text
                document.querySelector('#reward-item-wrapper .custom-select__trigger span').textContent = 'Select a Reward Item...';
                document.querySelector('#use-type-wrapper .custom-select__trigger span').textContent = 'One-Time Use';
                document.getElementById('reward-quantity').value = 1;
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
