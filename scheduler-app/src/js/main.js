document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menu-toggle-btn');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
});

// ==================== AUTHENTICATION HELPERS ====================

/**
 * Get authentication headers for API requests
 * Returns headers object with Authorization Bearer token
 */
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

/**
 * Logout user and clear session
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// --- NEW HANDLERS FOR PREFERENCES ---

// 1. Fetch all subjects for the dropdowns
ipcMain.handle('get-subjects', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT subject_id, subject_name FROM subjects", [], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
});

