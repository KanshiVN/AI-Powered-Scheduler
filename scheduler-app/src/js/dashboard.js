document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization Check
    const userRole = localStorage.getItem('userRole');
    
    // If userRole is not 'hod' or doesn't exist, redirect to login page
    if (userRole !== 'hod') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'index.html';
        return; // Stop further execution
    }

    // 2. Personalization
    const username = localStorage.getItem('username');
    if (username) {
        // Update the name in the sidebar
        document.getElementById('user-name').textContent = username;
        // Update the welcome message
        const welcomeMessage = document.getElementById('welcome-message');
        welcomeMessage.textContent = `Welcome, ${username}. Here's an overview of your Responsibilities.`;
    }

    // 3. Logout Functionality
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();

            localStorage.clear(); // 👈 clear everything safely

            window.location.href = "index.html";
        });
    }

});