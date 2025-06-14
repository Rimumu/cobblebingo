document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cobblebingo-backend-production.up.railway.app';
    const token = localStorage.getItem('token');
    const redeemForm = document.getElementById('redeem-form');
    const redeemBtn = document.getElementById('redeem-btn');
    const redeemCodeInput = document.getElementById('redeem-code');
    const messageDiv = document.getElementById('redeem-message');

    if (!token) {
        document.getElementById('redeem-container').innerHTML = '<p>You must be <a href="/login.html">logged in</a> to redeem codes.</p>';
        return;
    }

    redeemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = redeemCodeInput.value;
        if (!code) return;

        redeemBtn.disabled = true;
        redeemBtn.textContent = 'Redeeming...';
        messageDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE_URL}/api/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });
            const data = await response.json();
            
            if (data.success) {
                showMessage(data.message, 'success');
                redeemCodeInput.value = '';
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            redeemBtn.disabled = false;
            redeemBtn.textContent = 'Redeem Code';
        }
    });

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = type;
        messageDiv.style.display = 'block';
    }
});
