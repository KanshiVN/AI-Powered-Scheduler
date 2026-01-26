document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authorization Check
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'hod') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'index.html';
        return; 
    }

    // 2. Personalization
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('user-name').textContent = username;
    }

    // 3. Logout Functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = 'index.html';
        });
    }

    // 4. Load users on page load
    await loadUsers();

    // 5. Setup form submission
    const createUserForm = document.getElementById('create-user-form');
    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createUser();
        });
    }

    // 6. Setup refresh button
    const refreshBtn = document.getElementById('refresh-users-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadUsers();
        });
    }
});

// --- LOAD USERS ---
async function loadUsers() {
    const usersListBody = document.getElementById('users-list-body');
    
    try {
        usersListBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Loading users...</div>';
        
        const response = await fetch(
            "http://localhost:5000/api/hod/users",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            const error = await response.json();
            usersListBody.innerHTML = `<div style="text-align: center; padding: 2rem; color: #e74c3c;">Error: ${error.message || 'Failed to load users'}</div>`;
            return;
        }

        const result = await response.json();
        
        if (!result.success || !result.users || result.users.length === 0) {
            usersListBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No users found. Create your first user above.</div>';
            return;
        }

        // Display users
        usersListBody.innerHTML = result.users.map(user => {
            const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
            const currentUserId = parseInt(localStorage.getItem('userId') || '0');
            const isCurrentUser = user.id === currentUserId;
            
            return `
                <div class="user-list-row" data-user-id="${user.id}">
                    <span class="col-id">${user.id}</span>
                    <span class="col-username">${user.username}</span>
                    <span class="col-role">
                        <span class="role-badge role-${user.role}">${user.role}</span>
                    </span>
                    <span class="col-email">${user.email || 'N/A'}</span>
                    <span class="col-created">${createdDate}</span>
                    <span class="col-action">
                        ${isCurrentUser 
                            ? '<span style="color: #999; font-size: 0.9rem;">Current User</span>' 
                            : `<button class="btn-delete" onclick="deleteUser(${user.id}, '${user.username}')" title="Delete user">
                                <i data-feather="trash-2"></i>
                            </button>`
                        }
                    </span>
                </div>
            `;
        }).join('');

        // Re-initialize feather icons
        feather.replace();

    } catch (error) {
        console.error("Error loading users:", error);
        usersListBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: #e74c3c;">Failed to load users. Please check your connection.</div>';
    }
}

// --- CREATE USER ---
async function createUser() {
    const form = document.getElementById('create-user-form');
    const formData = new FormData(form);
    
    const userData = {
        username: formData.get('username'),
        password: formData.get('password'),
        role: formData.get('role'),
        email: formData.get('email') || null
    };

    // Validation
    if (!userData.username || !userData.password || !userData.role) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/hod/users/create",
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(userData)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || 'Failed to create user');
            return;
        }

        alert('User created successfully!');
        
        // Reset form
        form.reset();
        
        // Reload users list
        await loadUsers();

    } catch (error) {
        console.error("Error creating user:", error);
        alert('Failed to create user. Please check your connection.');
    }
}

// --- DELETE USER ---
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/hod/users/${userId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || 'Failed to delete user');
            return;
        }

        alert('User deleted successfully!');
        
        // Reload users list
        await loadUsers();

    } catch (error) {
        console.error("Error deleting user:", error);
        alert('Failed to delete user. Please check your connection.');
    }
}