// auth.js - Complete and Corrected Version

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. UI Update Logic ---
    const updateAccountWidget = () => {
        const token = localStorage.getItem('token');
        const accountWidget = document.getElementById('account-widget');
        
        // This check is crucial. If the div doesn't exist, stop.
        if (!accountWidget) { 
            console.error("#account-widget element not found in HTML. Button cannot be displayed.");
            return; 
        }

        if (token) {
            // User is logged in
            try {
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
                        <a href="${API_BASE_URL}/api/auth/discord">Link Discord</a> <a id="logout-btn">Logout</a>
                    </div>
                `;
                // Attach logout listener only after the button is created
                document.getElementById('logout-btn').addEventListener('click', handleLogout);
            } catch (e) {
                console.error("Invalid token found. Clearing token.", e);
                handleLogout(); // Clear bad token and refresh UI
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

    // --- 2. Event Handlers ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        // Redirect to ensure the whole app state resets
        window.location.href = '/'; 
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

    // --- 3. Attach Auth Form Event Listeners ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleAuthForm(e, 'login'));
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => handleAuthForm(e, 'signup'));
    }

    // --- 4. Attach Dropdown Click Listeners ---
    const accountWidget = document.getElementById('account-widget');
    if (accountWidget) {
        accountWidget.addEventListener('click', (event) => {
            // This ensures we only toggle when the button area is clicked,
            // not when a link inside the dropdown is clicked.
            const button = event.target.closest('.account-button');
            if (button) {
                accountWidget.classList.toggle('active');
            }
        });

        // Add a listener to the whole page to close the menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!accountWidget.contains(event.target) && accountWidget.classList.contains('active')) {
                accountWidget.classList.remove('active');
            }
        });
    }

    // --- 5. Initial UI Setup ---
    updateAccountWidget();

}); // <-- This is the final closing brace for the 'DOMContentLoaded' event listener. The error was likely related to this.
