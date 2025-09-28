document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const quickLoginButtons = document.querySelectorAll('.quick-login-buttons .btn');

    // Handle the main login form submission
// In /js/login.js

// ... (keep the rest of the file the same)

// Handle the main login form submission
if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); 

        const role = document.getElementById('role').value;
        const username = document.getElementById('username').value;
        
        if (!role || !username) {
            alert('Please fill in all fields.');
            return;
        }

        console.log(`Logging in with Role: ${role}, Username: ${username}`);
        localStorage.setItem('userRole', role);
        localStorage.setItem('username', username);

        alert('Login successful! Redirecting...');

        // === ROLE-BASED REDIRECTION LOGIC ===
        // In /js/login.js
// ... (inside your submit event listener)

// === ROLE-BASED REDIRECTION LOGIC ===
        if (role === 'hod') {
            window.location.href = 'index.html'; // HOD dashboard
        } else if (role === 'faculty') {
            window.location.href = 'faculty-dashboard.html'; // Faculty dashboard
        } else if (role === 'exam_control') {
            window.location.href = 'exam-control-dashboard.html'; // Exam Control dashboard
        } else {
            // Fallback for other roles
            alert('A dashboard for this role is not yet available.');
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });
}

// ... (keep the quick login button logic the same, or update it similarly)
    // Handle quick login button clicks
    quickLoginButtons.forEach(button => {
        button.addEventListener('click', () => {
            const role = button.dataset.role;
            const username = button.textContent; // Use button text as username

            console.log(`Quick logging in with Role: ${role}, Username: ${username}`);

            localStorage.setItem('userRole', role);
            localStorage.setItem('username', username);

            alert(`Quick login as ${username} successful! Redirecting...`);
            window.location.href = 'index.html'; // CHANGE 'index.html' TO YOUR MAIN TIMETABLE PAGE
        });
    });
});