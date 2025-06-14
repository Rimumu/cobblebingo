// cards.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://cobblebingo-backend-production.up.railway.app';
    
    const cardsList = document.getElementById('cards-list');
    const token = localStorage.getItem('token');

    if (!token) {
        cardsList.innerHTML = '<p>You must be logged in to view your cards. <a href="/login.html">Login now</a>.</p>';
        return;
    }

    // --- Custom Modal Functions ---

    function showCardNotice(title, message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('card-notice-overlay');
            if (!overlay) { alert(message); return resolve(); }

            overlay.querySelector('#card-notice-title').textContent = title;
            overlay.querySelector('#card-notice-message').textContent = message;
            const closeBtn = overlay.querySelector('#close-card-notice-btn');

            overlay.style.display = 'flex';
            setTimeout(() => overlay.classList.add('visible'), 10);

            const closeHandler = () => {
                overlay.classList.remove('visible');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    resolve();
                }, 300);
            };
            closeBtn.addEventListener('click', closeHandler, { once: true });
        });
    }

    function promptForNewName(currentName) {
        return new Promise((resolve, reject) => {
            const overlay = document.getElementById('rename-card-overlay');
            if (!overlay) {
                const name = prompt("Enter a new name for the session:", currentName);
                if (name && name.trim()) { resolve(name.trim()); } else { reject(); }
                return;
            }

            const input = overlay.querySelector('#rename-card-input');
            const confirmBtn = overlay.querySelector('#confirm-rename-card-btn');
            const cancelBtn = overlay.querySelector('#cancel-rename-card-btn');

            input.value = currentName;
            overlay.style.display = 'flex';
            setTimeout(() => {
                overlay.classList.add('visible');
                input.focus();
                input.select();
            }, 10);

            const removeListeners = () => {
                confirmBtn.removeEventListener('click', confirmHandler);
                cancelBtn.removeEventListener('click', cancelHandler);
                document.removeEventListener('keydown', keydownHandler);
            };

            const cleanup = () => {
                overlay.classList.remove('visible');
                setTimeout(() => overlay.style.display = 'none', 300);
            };

            const confirmHandler = () => {
                const newName = input.value.trim();
                if (newName) {
                    removeListeners();
                    cleanup();
                    resolve(newName);
                }
            };

            const cancelHandler = () => {
                removeListeners();
                cleanup();
                reject();
            };
            
            const keydownHandler = (e) => {
                if (e.key === 'Enter') { e.preventDefault(); confirmHandler(); }
                else if (e.key === 'Escape') { cancelHandler(); }
            };

            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            document.addEventListener('keydown', keydownHandler);
        });
    }

    function showConfirm(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('delete-confirm-overlay');
            if(!overlay) { return resolve(confirm(message)); }

            overlay.querySelector('#delete-confirm-message').textContent = message;
            const confirmBtn = overlay.querySelector('#confirm-delete-btn');
            const cancelBtn = overlay.querySelector('#cancel-delete-btn');
            
            overlay.style.display = 'flex';
            setTimeout(() => overlay.classList.add('visible'), 10);

            const close = (result) => {
                overlay.classList.remove('visible');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    resolve(result);
                }, 300)
            };

            confirmBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
        });
    }


    // --- Core Logic ---

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    const fetchUserCards = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/cards`, { headers: getAuthHeaders() });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            renderCards(data.cards);
        } catch (error) {
            cardsList.innerHTML = `<p>Error loading cards: ${error.message}</p>`;
        }
    };

    const renderCards = (cards) => {
        if (cards.length === 0) {
            cardsList.innerHTML = '<p>You have no saved bingo cards. Go play and save a session!</p>';
            return;
        }

        cardsList.innerHTML = ''; // Clear loading message
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            cardElement.id = `session-${card.sessionId}`;
            cardElement.innerHTML = `
                <div class="card-info">
                    <h3 class="session-name">${card.sessionName}</h3>
                    <p>Card Code: ${card.cardCode} | Last Played: ${new Date(card.lastAccessed).toLocaleDateString()}</p>
                </div>
                <div class="card-actions">
                    <button class="load-btn">Load</button>
                    <button class="rename-btn">Rename</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            cardsList.appendChild(cardElement);

            // Attach event listeners
            cardElement.querySelector('.load-btn').addEventListener('click', () => {
                window.location.href = `/bingo/?code=${card.cardCode}&session=${card.sessionId}`;
            });
            cardElement.querySelector('.rename-btn').addEventListener('click', () => renameSession(card.sessionId));
            cardElement.querySelector('.delete-btn').addEventListener('click', () => deleteSession(card.sessionId));
        });
    };
    
    const renameSession = async (sessionId) => {
        const sessionCard = document.querySelector(`#session-${sessionId}`);
        const currentName = sessionCard.querySelector('.session-name').textContent;
        try {
            const newName = await promptForNewName(currentName);
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/rename`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ newName })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            sessionCard.querySelector('.session-name').textContent = newName;
            await showCardNotice('Success!', 'Session renamed successfully!');
        } catch (error) {
            if (error && error.message) {
                await showCardNotice('Error', `Could not rename session: ${error.message}`);
            }
            console.log("Rename cancelled or failed.");
        }
    };

    const deleteSession = async (sessionId) => {
        const confirmed = await showConfirm("Are you sure you want to delete this session? This cannot be undone.");
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            document.getElementById(`session-${sessionId}`).remove();
            await showCardNotice('Success!', 'Session deleted!');
        } catch (error) {
            await showCardNotice('Error', `Could not delete session: ${error.message}`);
        }
    };

    fetchUserCards();
});
