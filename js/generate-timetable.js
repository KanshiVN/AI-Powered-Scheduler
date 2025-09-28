document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization & Personalization (Standard for all protected pages)
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

    // 2. Dynamic Lecture Row Generation
    const lecturesCountInput = document.getElementById('lectures-count');
    const lectureRowsContainer = document.getElementById('lecture-rows-container');

    const generateLectureRows = (count) => {
        // Clear any existing rows
        lectureRowsContainer.innerHTML = '';

        if (count > 0 && count <= 12) {
            for (let i = 1; i <= count; i++) {
                // Create the HTML for a single row using a template literal
                const rowHTML = `
                    <div class="lecture-row">
                        <span class="lecture-row-label">Lecture ${i}</span>
                        <div class="time-inputs">
                            <div class="time-input-wrapper">
                                <i data-feather="clock"></i>
                                <input type="time">
                            </div>
                            <button class="btn-add-break">
                                <i data-feather="plus"></i> Add Break
                            </button>
                            <div class="time-input-wrapper">
                                <i data-feather="clock"></i>
                                <input type="time">
                            </div>
                        </div>
                    </div>
                `;
                // Append the new row to the container
                lectureRowsContainer.insertAdjacentHTML('beforeend', rowHTML);
            }
        }
        // After adding new HTML, we need to re-run feather.replace()
        // to render the new icons.
        feather.replace();
    };

    // Add an event listener to the input field
    lecturesCountInput.addEventListener('input', () => {
        const count = parseInt(lecturesCountInput.value, 10);
        generateLectureRows(count);
    });

    // Initial generation of rows based on the default value
    generateLectureRows(parseInt(lecturesCountInput.value, 10));
});