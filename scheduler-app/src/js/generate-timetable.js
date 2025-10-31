document.addEventListener('DOMContentLoaded', () => {
    // 1. Authorization & Personalization
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

    // 2. Tab Switching Logic
    const tabs = document.querySelectorAll('.stepper-container .step');
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


    // 3. Dynamic Lecture Row Generation (for General Settings tab)
    const lecturesCountInput = document.getElementById('lectures-count');
    const lectureRowsContainer = document.getElementById('lecture-rows-container');

    const generateLectureRows = (count) => {
        if (!lectureRowsContainer) return; // Exit if not on the right page
        
        lectureRowsContainer.innerHTML = '';
        if (count > 0 && count <= 12) {
            for (let i = 1; i <= count; i++) {
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
                lectureRowsContainer.insertAdjacentHTML('beforeend', rowHTML);
            }
        }
        feather.replace();
    };

    if (lecturesCountInput) {
        lecturesCountInput.addEventListener('input', () => {
            const count = parseInt(lecturesCountInput.value, 10);
            generateLectureRows(count);
        });
        
        // Initial generation of rows
        generateLectureRows(parseInt(lecturesCountInput.value, 10));
    }
    
    // 4. Setup for Lessons Tab
    setupLessonAddButton();
    setupLessonDeleteListener();

    // 5. NEW: Setup for Faculty Choice Tab
    setupFacultyAddButton();
    setupFacultyDeleteListener();
});


// --- FUNCTIONS FOR LESSONS TAB ---
function setupLessonAddButton() {
    const addButton = document.querySelector('#lessons .btn-add-new');
    const container = document.querySelector('.lesson-list-container');
    if (!addButton || !container) return; 

    addButton.addEventListener('click', () => {
        const newRowHTML = `
        <div class="lesson-list-row">
            <div class="col-subject"><input type="text" class="new-subject-input" placeholder="Subject Name"></div>
            <div class="col-short-name"><input type="text" class="new-subject-input" placeholder="SN"></div>
            <span class="col-availability availability-tag"><i data-feather="check-circle"></i> All available</span>
            <div class="col-hrs-week">
                <input type="number" class="hrs-input" value="3">
            </div>
            <div class="col-action">
                <a href="#"><i data-feather="trash-2"></i></a>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', newRowHTML);
        feather.replace(); 
    });
}

function setupLessonDeleteListener() {
    const listContainer = document.querySelector('.lesson-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('click', (event) => {
        const deleteLink = event.target.closest('.col-action a');
        if (!deleteLink) return; 
        event.preventDefault(); 
        const row = deleteLink.closest('.lesson-list-row');
        if (row) {
            let subjectName = "this new subject";
            const subjectSpan = row.querySelector('.col-subject');
            if (subjectSpan) {
                const input = subjectSpan.querySelector('input');
                subjectName = input ? (input.value || "this new subject") : subjectSpan.textContent;
            }
            if (confirm(`Are you sure you want to delete "${subjectName}"?`)) {
                row.remove();
            }
        }
    });
}


// --- NEW: FUNCTIONS FOR FACULTY CHOICE TAB ---
function setupFacultyAddButton() {
    const addButton = document.querySelector('#faculty-choice .btn-add-new');
    const container = document.querySelector('.faculty-choice-list-container');
    if (!addButton || !container) return;

    addButton.addEventListener('click', () => {
        const newRowHTML = `
        <div class="faculty-choice-list-row">
            <div class="col-prof-name"><input type="text" class="new-subject-input" placeholder="Professor Name"></div>
            <div class="col-short-name"><input type="text" class="new-subject-input" placeholder="SN"></div>
            <div class="col-se"><input type="text" class="subject-choice-input" placeholder="Subject"></div>
            <div class="col-te"><input type="text" class="subject-choice-input" placeholder="Subject"></div>
            <div class="col-be"><input type="text" class="subject-choice-input" placeholder="Subject"></div>
            <div class="col-action"><a href="#"><i data-feather="trash-2"></i></a></div>
        </div>`;
        container.insertAdjacentHTML('beforeend', newRowHTML);
        feather.replace();
    });
}

function setupFacultyDeleteListener() {
    const listContainer = document.querySelector('.faculty-choice-list-container');
    if (!listContainer) return;

    listContainer.addEventListener('click', (event) => {
        const deleteLink = event.target.closest('.col-action a');
        if (!deleteLink) return;
        event.preventDefault();
        const row = deleteLink.closest('.faculty-choice-list-row');
        if (row) {
            let profName = "this new professor";
            const nameSpan = row.querySelector('.col-prof-name');
            if(nameSpan) {
                const input = nameSpan.querySelector('input');
                profName = input ? (input.value || "this new professor") : nameSpan.textContent;
            }
            if (confirm(`Are you sure you want to delete "${profName}"?`)) {
                row.remove();
            }
        }
    });
}