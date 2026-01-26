document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const role = document.getElementById('role').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!role || !username || !password) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role,
                    username,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || 'Login failed');
                return;
            }

            // Store JWT token and user info
            if (result.token) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userRole', result.role);
                localStorage.setItem('username', result.username);
                localStorage.setItem('userId', result.user_id);
            } else {
                // Fallback for old system (shouldn't happen with new auth)
                localStorage.setItem('userRole', result.role);
                localStorage.setItem('username', result.username);
            }

            // Role-based redirection
            if (result.role === 'hod') {
                window.location.href = 'dashboard-hod.html';
            } else if (result.role === 'faculty') {
                window.location.href = 'faculty-dashboard.html';
            } else if (result.role === 'exam_control') {
                window.location.href = 'exam-control-dashboard.html';
            } else {
                alert('No dashboard available for this role.');
                localStorage.clear();
            }

        } catch (error) {
            console.error(error);
            alert('Backend server not reachable');
        }
    });
});
