// auth.js - Final Version with Link/Unlink Logic

const handleSignupPrompt = () => {
    const overlay = document.getElementById('signup-prompt-overlay');
    const closeBtn = document.getElementById('close-prompt-btn');
    
    // This check ensures the code only runs on the signup page
    if (!overlay || !closeBtn) {
        return; 
    }

    // Show the prompt shortly after the page loads for a smooth animation
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 100);

    // Add listener to the button to hide the prompt
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('visible');
    });
};

document.addEventListener('DOMContentLoaded', () => {

    const updateAccountWidget = async () => {
        const token = localStorage.getItem('token');
        const accountWidget = document.getElementById('account-widget');
        
        if (!accountWidget) { 
            return; 
        }

        if (token && token !== 'undefined') {
            try {
                const userResponse = await fetch(`${getApiBaseUrl()}/api/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!userResponse.ok) throw new Error('Failed to fetch user data.');
                
                const { user } = await userResponse.json();

                let discordLinkHtml = '';
                if (user.discordId) {
                    discordLinkHtml = `
                        <div class="discord-info">
                            Linked as: <strong>${user.discordUsername}</strong>
                        </div>
                        <a id="unlink-discord-btn">Unlink Discord</a>
                    `;
                } else {
                    const linkDiscordUrl = `${getApiBaseUrl()}/api/auth/discord?token=${token}`;
                    discordLinkHtml = `<a href="${linkDiscordUrl}">Link Discord</a>`;
                }

                accountWidget.innerHTML = `
                    <button class="account-button">
                        <span>${user.username}</span> &#9662;
                    </button>
                    <div class="account-dropdown">
                        <a href="/">Home</a>
                        <a href="/cards/">My Cards</a>
                        <a href="/inventory/">Inventory</a>
                        <a href="/redeem/">Redeem</a>
                        ${discordLinkHtml}
                        <a id="logout-btn">Logout</a>
                    </div>
                `;
                
                document.getElementById('logout-btn').addEventListener('click', handleLogout);
                const unlinkBtn = document.getElementById('unlink-discord-btn');
                if (unlinkBtn) {
                    unlinkBtn.addEventListener('click', handleUnlinkDiscord);
                }

            } catch (e) {
                console.error("Error updating account widget:", e);
                handleLogout();
            }
        } else {
            // User is logged out
            accountWidget.innerHTML = `
                <button class="account-button">Account &#9662;</button>
                <div class="account-dropdown">
                    <a href="/">Home</a>
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
    
    // --- NEW FUNCTION TO HANDLE UNLINKING ---
    const handleUnlinkDiscord = async () => {
        if (!confirm("Are you sure you want to unlink your Discord account?")) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/auth/discord/unlink`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            
            alert("Discord account unlinked successfully.");
            updateAccountWidget(); // Refresh the dropdown to show the "Link" button again
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
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
            if (!data.success) throw new Error(data.error || 'Authentication failed.');
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

    // --- Attach Event Listeners ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => handleAuthForm(e, 'login'));
    const signupForm = document.getElementById('signup-form');
    if (signupForm) signupForm.addEventListener('submit', (e) => handleAuthForm(e, 'signup'));
    const accountWidget = document.getElementById('account-widget');
    if (accountWidget) {
        accountWidget.addEventListener('click', (event) => {
            const button = event.target.closest('.account-button');
            if (button) accountWidget.classList.toggle('active');
        });
        document.addEventListener('click', (event) => {
            if (!accountWidget.contains(event.target) && accountWidget.classList.contains('active')) {
                accountWidget.classList.remove('active');
            }
        });
    }

    // Initial UI Setup
    handleSignupPrompt(); // Call the new function
    updateAccountWidget();
});
