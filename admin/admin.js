document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');
    const adminContent = document.getElementById('admin-content');
    const accessDenied = document.getElementById('access-denied');
    
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

    const generateForm = document.getElementById('generate-code-form');
    generateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            code: document.getElementById('new-code').value,
            reward: {
                itemId: document.getElementById('reward-item-id').value,
                itemName: document.getElementById('reward-item-name').value,
                quantity: parseInt(document.getElementById('reward-quantity').value, 10)
            },
            useType: document.getElementById('use-type').value
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/generate-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            document.getElementById('generate-result').textContent = data.success ? `Success! Code: ${data.code.code}` : `Error: ${data.error}`;
            if (data.success) loadExistingCodes();
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
                codeEl.textContent = `Code: ${code.code} | Reward: ${code.reward.quantity}x ${code.reward.itemName} | Type: ${code.useType}`;
                codesList.appendChild(codeEl);
            });
        } catch (error) {
            console.error("Could not load codes:", error);
        }
    }

    verifyAdminAccess();
});
