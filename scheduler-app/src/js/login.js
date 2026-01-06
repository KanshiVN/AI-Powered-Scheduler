document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

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

            // === ROLE-BASED REDIRECTION LOGIC (This part is correct) ===
            if (role === 'hod') {
                window.location.href = 'dashboard-hod.html'; // HOD dashboard
            } else if (role === 'faculty') {
                window.location.href = 'faculty-dashboard.html'; // Faculty dashboard
            } else if (role === 'exam_control') {
                window.location.href = 'exam-control-dashboard.html'; // Exam Control dashboard
            } else {
                // Fallback for other roles
                alert('A dashboard for this role is not yet available.');
                localStorage.clear();
                window.location.href = 'index.html'; // Back to login page
            }
        });
    }

});