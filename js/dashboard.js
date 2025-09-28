document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization Check
    const userRole = localStorage.getItem('userRole');
    
    // If userRole is not 'hod' or doesn't exist, redirect to login page
    if (userRole !== 'hod') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'login.html';
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
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            
            // Clear user data from storage
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            
            // Redirect to login page
            alert('You have been logged out.');
            window.location.href = 'login.html';
        });
    }
});