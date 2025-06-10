// auth.js - Final Version

document.addEventListener('DOMContentLoaded', () => {

    const updateAccountWidget = () => {
        const token = localStorage.getItem('token');
        const accountWidget = document.getElementById('account-widget');
        
        if (!accountWidget) { 
            return; 
        }

        // This check now safely handles cases where an invalid token might be stored
        if (token && token !== 'undefined') {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const username = payload.user.username;
                const linkDiscordUrl = `${getApiBaseUrl()}/api/auth/discord?token=${token}`;
                
                accountWidget.innerHTML = `
                    <button class="account-button">
                        <span>${username}</span> &#9662;
                    </button>
                    <div class="account-dropdown">
                        <a href="/cards/">My Cards</a>
                        <a href="/inventory/">Inventory</a>
                        <a href="/redeem/">Redeem</a>
                        <a href="${linkDiscordUrl}">Link Discord</a>
                        <a id="logout-btn">Logout</a>
                    </div>
                `;
                document.getElementById('logout-btn').addEventListener('click', handleLogout);
            } catch (e) {
                // If the token is invalid for any reason, log the error and log the user out
                console.error("Invalid token found, logging out.", e);
                handleLogout();
            }
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

    const getApiBaseUrl = () => {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : 'https://cobblebingo-backend-production.up.railway.app';
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/'; 
    };

    const handleAuthForm = async (event, endpoint) => {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value;
        const password = form.password.value;
        
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'An unknown error occurred during authentication.');
            }

            if (endpoint === 'login') {
                localStorage.setItem('token', data.token);
                window.location.href = '/';
            } else {
                alert('Signup successful! Please log in.');
                window.location.href = '/login.html';
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleAuthForm(e, 'login'));
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => handleAuthForm(e, 'signup'));
    }

    const accountWidget = document.getElementById('account-widget');
    if (accountWidget) {
        accountWidget.addEventListener('click', (event) => {
            const button = event.target.closest('.account-button');
            if (button) {
                accountWidget.classList.toggle('active');
            }
        });

        document.addEventListener('click', (event) => {
            if (!accountWidget.contains(event.target) && accountWidget.classList.contains('active')) {
                accountWidget.classList.remove('active');
            }
        });
    }

    updateAccountWidget();
});
