// auth.js
document.addEventListener('DOMContentLoaded', () => {
    // --- UI Update Logic ---
    const updateAccountWidget = () => {
        const token = localStorage.getItem('token');
        const accountWidget = document.getElementById('account-widget');
        if (!accountWidget) return;

        if (token) {
            // User is logged in
            // Decode token to get username (simple decode, no verification needed here)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const username = payload.user.username;

            accountWidget.innerHTML = `
                <button class="account-button">
                    <span>${username}</span> &#9662;
                </button>
                <div class="account-dropdown">
                    <a href="/cards/">My Cards</a>
                    <a href="/inventory/">Inventory</a>
                    <a href="/redeem/">Redeem</a>
                    <a id="logout-btn">Logout</a>
                </div>
            `;
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
        } else {
            // User is logged out
            accountWidget.innerHTML = `
                <button class="account-button">Account &#9662;</button>
                <div class="account-dropdown">
                    <a href="/signup.html">Signup</a>
                    <a href="/login.html">Login</a>
                </div>
            `;
        }
    };

    // --- Event Handlers ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/'; // Redirect to home page
    };

    const handleAuthForm = async (event, endpoint) => {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const password = form.password.value;
        const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : 'https://cobblebingo-backend-production.up.railway.app';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'An unknown error occurred.');
            }

            if (endpoint === 'login') {
                localStorage.setItem('token', data.token);
                window.location.href = '/'; // Redirect to home
            } else {
                alert('Signup successful! Please log in.');
                window.location.href = '/login.html';
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    // --- Attach Listeners ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleAuthForm(e, 'login'));
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => handleAuthForm(e, 'signup'));
    }

    // --- Initial UI Setup ---
    updateAccountWidget();
});
