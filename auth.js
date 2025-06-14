// auth.js - Final Version with Daily Check-In

const handleSignupPrompt = () => {
    const overlay = document.getElementById('signup-prompt-overlay');
    const closeBtn = document.getElementById('close-prompt-btn');
    
    if (!overlay || !closeBtn) {
        return; 
    }

    setTimeout(() => {
        overlay.classList.add('visible');
    }, 100);

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
                        <a id="check-in-btn">Check-In</a>
                        ${discordLinkHtml}
                        <a id="logout-btn">Logout</a>
                    </div>
                `;
                
                document.getElementById('logout-btn').addEventListener('click', handleLogout);
                document.getElementById('check-in-btn').addEventListener('click', handleDailyCheckIn);
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

    // --- START: New Daily Check-In Logic ---
    const handleDailyCheckIn = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/user/claim-daily`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                showRewardSuccessModal(data.reward);
            } else {
                if(data.cooldown) {
                    showRewardCooldownModal(data.nextAvailable);
                } else {
                     alert(data.error);
                }
            }
        } catch (error) {
            console.error('Error claiming daily reward:', error);
            alert('An unexpected error occurred. Please try again later.');
        }
    };

    const showRewardSuccessModal = (reward) => {
        const overlay = document.getElementById('daily-reward-success-overlay');
        // *** FIX: Check if the modal elements exist before trying to use them ***
        if (overlay) {
            const img = document.getElementById('daily-reward-image');
            const text = document.getElementById('daily-reward-text');
            
            if (img) img.src = reward.image;
            if (text) text.textContent = `You received 1x ${reward.itemName}!`;
            overlay.style.display = 'flex';
        } else {
            // Fallback for pages without the modal HTML
            alert(`Daily Reward Claimed!\nYou received 1x ${reward.itemName}!`);
            window.location.reload(); // Still reload to update inventory if needed
        }
    };
    
    let countdownInterval;
    const showRewardCooldownModal = (nextAvailable) => {
        const overlay = document.getElementById('daily-reward-cooldown-overlay');
        // *** FIX: Check if the modal elements exist before trying to use them ***
        if (overlay) {
            const timerText = document.getElementById('daily-reward-timer');
            
            const updateTimer = () => {
                const now = new Date();
                const next = new Date(nextAvailable);
                const diff = next - now;

                if (diff <= 0) {
                    clearInterval(countdownInterval);
                    if(timerText) timerText.textContent = "You can claim your reward now!";
                    return;
                }

                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                if(timerText) timerText.textContent = `Time remaining: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            };
            
            clearInterval(countdownInterval); // Clear any existing timer
            updateTimer();
            countdownInterval = setInterval(updateTimer, 1000);
            
            overlay.style.display = 'flex';
        } else {
            // Fallback for pages without the modal HTML
             alert("You have already claimed your daily reward. Please check back later.");
        }
    };

    const setupRewardModals = () => {
        const successOverlay = document.getElementById('daily-reward-success-overlay');
        const cooldownOverlay = document.getElementById('daily-reward-cooldown-overlay');
        const successCloseBtn = document.getElementById('close-reward-success-btn');
        const cooldownCloseBtn = document.getElementById('close-reward-cooldown-btn');

        if(successOverlay && successCloseBtn) {
             successCloseBtn.addEventListener('click', () => {
                successOverlay.style.display = 'none';
                if(window.location.pathname.includes('/gacha/')) {
                   window.location.reload(); // Refresh to update inventory display on gacha page
                }
             });
        }
       
        if(cooldownOverlay && cooldownCloseBtn) {
            cooldownCloseBtn.addEventListener('click', () => {
                clearInterval(countdownInterval);
                cooldownOverlay.style.display = 'none';
            });
        }
    };
    // --- END: New Daily Check-In Logic ---


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
    handleSignupPrompt();
    updateAccountWidget();
    setupRewardModals(); // Set up close buttons for new modals
});
