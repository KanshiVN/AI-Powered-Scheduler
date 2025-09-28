document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization Check for 'faculty' role
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'faculty') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'login.html';
        return; 
    }

    // 2. Personalization
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('user-name').textContent = username;
        const welcomeMessage = document.getElementById('welcome-message');
        welcomeMessage.textContent = `Welcome, ${username}. Here's an overview of your Responsibilities.`;
    }

    // 3. Logout Functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = 'login.html';
        });
    }
});