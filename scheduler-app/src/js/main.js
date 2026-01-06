document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menu-toggle-btn');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
});

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

