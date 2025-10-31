document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization, Personalization, and Logout (Standard for all protected pages)
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'hod') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'login.html';
        return;
    }

    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('user-name').textContent = username;
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = 'login.html';
        });
    }

    // You can add logic here in the future to handle the tab-switching
    // between "Exam Timetable" and "Supervision duties".
});