document.addEventListener('DOMContentLoaded', () => {
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

    // 4. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(tab.dataset.tab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // 5. Setup for Subject Tab
    setupSubjectAddButton();
    setupSubjectDeleteListener();

    // 6. Setup for Rooms Tab
    setupRoomAddButton();
    setupRoomDeleteListener();
    
    // 7. NEW: Setup for Faculties Tab
    setupFacultyAddButton();
    setupFacultyDeleteListener();
});


// --- FUNCTIONS FOR SUBJECT TAB ---
function setupSubjectAddButton() {
    const addButton = document.querySelector('#subject .btn-add-new');
    const container = document.querySelector('.subject-list-container');
    if (!addButton || !container) return; 

    addButton.addEventListener('click', () => {
        const newRowHTML = `
        <div class="subject-list-row">
            <input type="text" class="col-subject" placeholder="Subject Name">
            <input type="text" class="col-short-name" placeholder="Short Name (e.g., ML)">
            <div class="col-availability">
                <span class="availability-tag"><i data-feather="check-circle"></i> All available</span>
            </div>
            <div class="col-action">
                <a href="#"><i data-feather="trash-2"></i></a>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', newRowHTML);
        feather.replace();
    });
}
function setupSubjectDeleteListener() {
    const listContainer = document.querySelector('.subject-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('click', (event) => {
        const deleteLink = event.target.closest('.col-action a');
        if (!deleteLink) return;
        event.preventDefault(); 
        const row = deleteLink.closest('.subject-list-row');
        if (row) {
            const subjectNameInput = row.querySelector('.col-subject');
            const subjectName = subjectNameInput.value || "this new subject";
            if (confirm(`Are you sure you want to delete "${subjectName}"?`)) {
                row.remove();
            }
        }
    });
}


// --- FUNCTIONS FOR ROOMS TAB ---
function setupRoomAddButton() {
    const addButton = document.querySelector('#rooms .btn-add-new');
    const container = document.querySelector('.room-list-container');
    if (!addButton || !container) return; 

    addButton.addEventListener('click', () => {
        const newRowHTML = `
        <div class="room-list-row">
            <input type="text" class="col-room-num" placeholder="Room No.">
            <div class="col-type select-wrapper">
                <select>
                    <option value="classroom" selected>Classroom</option>
                    <option value="lab">Lab</option>
                </select>
            </div>
            <div class="col-availability">
                <span class="availability-tag"><i data-feather="check-circle"></i> All available</span>
            </div>
            <div class="col-action">
                <a href="#"><i data-feather="trash-2"></i></a>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', newRowHTML);
        feather.replace(); 
    });
}
function setupRoomDeleteListener() {
    const listContainer = document.querySelector('.room-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('click', (event) => {
        const deleteLink = event.target.closest('.col-action a');
        if (!deleteLink) return;
        event.preventDefault(); 
        const row = deleteLink.closest('.room-list-row');
        if (row) {
            const roomNumInput = row.querySelector('.col-room-num');
            const roomNum = roomNumInput.value || "this new room";
            if (confirm(`Are you sure you want to delete room "${roomNum}"?`)) {
                row.remove();
            }
        }
    });
}


// --- NEW: FUNCTIONS FOR FACULTIES TAB ---
function setupFacultyAddButton() {
    const addButton = document.querySelector('#faculties .btn-add-new');
    const container = document.querySelector('.faculty-list-container');
    if (!addButton || !container) return; 

    addButton.addEventListener('click', () => {
        const newRowHTML = `
        <div class="faculty-list-row">
            <input type="text" class="col-prof-name" placeholder="Professor Name">
            <input type="text" class="col-short-name" placeholder="SN">
            <div class="col-position select-wrapper">
                <select>
                    <option value="" selected>Select Position</option>
                    <option value="prof">Professor</option>
                    <option value="asst-prof">Asst. Professor</option>
                </select>
            </div>
            <div class="col-action">
                <a href="#"><i data-feather="trash-2"></i></a>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', newRowHTML);
        feather.replace();
    });
}
function setupFacultyDeleteListener() {
    const listContainer = document.querySelector('.faculty-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('click', (event) => {
        const deleteLink = event.target.closest('.col-action a');
        if (!deleteLink) return;
        event.preventDefault(); 
        const row = deleteLink.closest('.faculty-list-row');
        if (row) {
            const profNameInput = row.querySelector('.col-prof-name');
            const profName = profNameInput.value || "this new professor";
            if (confirm(`Are you sure you want to delete "${profName}"?`)) {
                row.remove();
            }
        }
    });
}