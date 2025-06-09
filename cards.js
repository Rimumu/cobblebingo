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
        const newName = prompt("Enter a new name for the session:");
        if (!newName) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/rename`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ newName })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Update UI
            document.querySelector(`#session-${sessionId} .session-name`).textContent = newName;
            alert('Session renamed!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const deleteSession = async (sessionId) => {
        if (!confirm("Are you sure you want to delete this session? This cannot be undone.")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Update UI
            document.getElementById(`session-${sessionId}`).remove();
            alert('Session deleted!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    fetchUserCards();
});
