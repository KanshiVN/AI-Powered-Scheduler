document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization Check for 'exam_control' role
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'exam_control') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'index.html';
        return; 
    }

    // 2. Personalization (using generic text from the design)
    const username = localStorage.getItem('username');
    if (username) {
        // You can choose to personalize the name if you want, e.g.,
        // document.getElementById('user-name').textContent = username;
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