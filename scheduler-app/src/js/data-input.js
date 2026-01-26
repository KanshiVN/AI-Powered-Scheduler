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

    // 4. Load saved data from backend
    await loadSavedData();

    // 5. Tab Switching Logic
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

    // 6. Setup for Classes Tab
    setupClassAddButton();
    setupClassDeleteListener();

    // 7. Setup for Subject Tab
    setupSubjectAddButton();
    setupSubjectDeleteListener();

    // 8. Setup for Rooms Tab
    setupRoomAddButton();
    setupRoomDeleteListener();
    
    // 9. Setup for Faculties Tab
    setupFacultyAddButton();
    setupFacultyDeleteListener();
});


// --- LOAD SAVED DATA FROM BACKEND ---
async function loadSavedData() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/hod/get-data",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            console.error("Failed to load data");
            return;
        }

        const result = await response.json();
        if (result.success && result.data) {
            // Load classes
            loadClasses(result.data.classes || []);
            
            // Load subjects
            loadSubjects(result.data.subjects || []);
            
            // Load faculties
            loadFaculties(result.data.faculties || []);
            
            // Load rooms
            loadRooms(result.data.rooms || []);
            
            // Update class selector dropdowns
            updateClassSelectors(result.data.classes || []);
        }
    } catch (error) {
        console.error("Error loading saved data:", error);
    }
}

// --- LOAD CLASSES ---
function loadClasses(classes) {
    const container = document.querySelector('#classes .list-body');
    if (!container) return;

    // Clear existing classes (except header)
    const header = container.querySelector('.list-row.header');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    }

    // Add classes dynamically
    classes.forEach(className => {
        const rowHTML = `
            <div class="list-row">
                <span class="list-col-main">${className}</span>
                <div class="action-icons">
                    <a href="#" class="edit-class"><i data-feather="edit-2"></i></a>
                    <a href="#" class="delete-class"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });
    
    feather.replace();
}

// --- LOAD SUBJECTS ---
function loadSubjects(subjects) {
    const container = document.querySelector('.subject-list-container');
    if (!container) return;

    // Clear existing subjects (except header)
    const header = container.querySelector('.subject-list-row.header');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    }

    // Add subjects dynamically
    subjects.forEach(subject => {
        const rowHTML = `
            <div class="subject-list-row">
                <input type="text" class="col-subject" value="${subject.name || ''}" placeholder="Subject Name">
                <input type="text" class="col-short-name" value="${subject.short || ''}" placeholder="Short Name (e.g., ML)">
                <div class="col-availability">
                    <span class="availability-tag"><i data-feather="check-circle"></i> All available</span>
                </div>
                <div class="col-action">
                    <a href="#"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });
    
    feather.replace();
}

// --- LOAD FACULTIES ---
function loadFaculties(faculties) {
    const container = document.querySelector('.faculty-list-container');
    if (!container) return;

    // Clear existing faculties (except header)
    const header = container.querySelector('.faculty-list-row.header');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    }

    // Add faculties dynamically
    faculties.forEach(faculty => {
        const rowHTML = `
            <div class="faculty-list-row">
                <input type="text" class="col-prof-name" value="${faculty.name || ''}" placeholder="Professor Name">
                <input type="text" class="col-short-name" value="${faculty.short || ''}" placeholder="SN">
                <div class="col-position select-wrapper">
                    <select>
                        <option value="" ${!faculty.position ? 'selected' : ''}>Select Position</option>
                        <option value="prof" ${faculty.position === 'prof' ? 'selected' : ''}>Professor</option>
                        <option value="asst-prof" ${faculty.position === 'asst-prof' ? 'selected' : ''}>Asst. Professor</option>
                    </select>
                </div>
                <div class="col-action">
                    <a href="#"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });
    
    feather.replace();
}

// --- LOAD ROOMS ---
function loadRooms(rooms) {
    const container = document.querySelector('.room-list-container');
    if (!container) return;

    // Clear existing rooms (except header)
    const header = container.querySelector('.room-list-row.header');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    }

    // Add rooms dynamically
    rooms.forEach(room => {
        const roomType = room.type || 'classroom';
        const rowHTML = `
            <div class="room-list-row">
                <input type="text" class="col-room-num" value="${room.room || ''}" placeholder="Room No.">
                <div class="col-type select-wrapper">
                    <select>
                        <option value="classroom" ${roomType === 'classroom' ? 'selected' : ''}>Classroom</option>
                        <option value="lab" ${roomType === 'lab' ? 'selected' : ''}>Lab</option>
                    </select>
                </div>
                <div class="col-availability">
                    <span class="availability-tag"><i data-feather="check-circle"></i> All available</span>
                </div>
                <div class="col-action">
                    <a href="#"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });
    
    feather.replace();
}

// --- UPDATE CLASS SELECTORS ---
function updateClassSelectors(classes) {
    // Update subject tab class selector
    const subjectClassSelector = document.getElementById('select-class-subject');
    if (subjectClassSelector) {
        // Keep the first option (Select Class)
        const firstOption = subjectClassSelector.querySelector('option[value=""]');
        subjectClassSelector.innerHTML = '';
        if (firstOption) {
            subjectClassSelector.appendChild(firstOption);
        }
        
        // Add classes as options
        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className.toLowerCase().replace(/\s+/g, '-');
            option.textContent = className;
            subjectClassSelector.appendChild(option);
        });
    }
}

// --- FUNCTIONS FOR CLASSES TAB ---
function setupClassAddButton() {
    const addButton = document.querySelector('#classes .btn-add-new');
    const container = document.querySelector('#classes .list-body');
    if (!addButton || !container) return;

    addButton.addEventListener('click', () => {
        const className = prompt('Enter class name (e.g., BE A, TE B):');
        if (className && className.trim()) {
            const rowHTML = `
                <div class="list-row">
                    <span class="list-col-main">${className.trim()}</span>
                    <div class="action-icons">
                        <a href="#" class="edit-class"><i data-feather="edit-2"></i></a>
                        <a href="#" class="delete-class"><i data-feather="trash-2"></i></a>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', rowHTML);
            feather.replace();
            
            // Update class selectors
            const classes = [];
            container.querySelectorAll('.list-row:not(.header)').forEach(row => {
                const name = row.querySelector('.list-col-main')?.textContent.trim();
                if (name) classes.push(name);
            });
            updateClassSelectors(classes);
        }
    });
}

function setupClassDeleteListener() {
    const container = document.querySelector('#classes .list-body');
    if (!container) return;

    container.addEventListener('click', (event) => {
        const deleteLink = event.target.closest('.delete-class');
        const editLink = event.target.closest('.edit-class');
        
        if (deleteLink) {
            event.preventDefault();
            const row = deleteLink.closest('.list-row');
            if (row) {
                const className = row.querySelector('.list-col-main')?.textContent.trim();
                if (confirm(`Are you sure you want to delete class "${className}"?`)) {
                    row.remove();
                    
                    // Update class selectors
                    const classes = [];
                    container.querySelectorAll('.list-row:not(.header)').forEach(r => {
                        const name = r.querySelector('.list-col-main')?.textContent.trim();
                        if (name) classes.push(name);
                    });
                    updateClassSelectors(classes);
                }
            }
        } else if (editLink) {
            event.preventDefault();
            const row = editLink.closest('.list-row');
            if (row) {
                const classNameSpan = row.querySelector('.list-col-main');
                const currentName = classNameSpan?.textContent.trim();
                const newName = prompt('Enter new class name:', currentName);
                if (newName && newName.trim() && newName !== currentName) {
                    classNameSpan.textContent = newName.trim();
                    
                    // Update class selectors
                    const classes = [];
                    container.querySelectorAll('.list-row:not(.header)').forEach(r => {
                        const name = r.querySelector('.list-col-main')?.textContent.trim();
                        if (name) classes.push(name);
                    });
                    updateClassSelectors(classes);
                }
            }
        }
    });
}

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

// --- SAVE DATA BUTTON LOGIC ---

const saveDataBtn = document.getElementById('save-data-btn');

if (saveDataBtn) {
    saveDataBtn.addEventListener('click', async () => {

        // Collecting class
        const classes = [];
        document.querySelectorAll('#classes .list-row:not(.header)').forEach(row => {
            const className = row.querySelector('.list-col-main')?.textContent.trim();
            if (className) classes.push(className);
        });


        // 1. Collect Subjects
       const subjects = [];
        document.querySelectorAll('.subject-list-row:not(.header)').forEach(row => {
            const name = row.querySelector('.col-subject')?.value.trim();
            const short = row.querySelector('.col-short-name')?.value.trim();
            if (name) {
                subjects.push({ name, short });
            }
        });


        // 2. Collect Faculties
        const faculties = [];
        document.querySelectorAll('.faculty-list-row:not(.header)').forEach(row => {
            const name = row.querySelector('.col-prof-name')?.value.trim();
            const short = row.querySelector('.col-short-name')?.value.trim();
            const position = row.querySelector('.col-position select')?.value;
            if (name) {
                faculties.push({ name, short, position: position || '' });
            }
        });


        // 3. Collect Rooms
        const rooms = [];
        document.querySelectorAll('.room-list-row:not(.header)').forEach(row => {
            const room = row.querySelector('.col-room-num')?.value.trim();
            const type = row.querySelector('select')?.value;
            if (room) {
                rooms.push({ room, type });
            }
        });


        const payload = {
            classes,
            subjects,   
            faculties,
            rooms
        };


        
       try {
        const response = await fetch(
            "http://localhost:5000/api/hod/save-data",
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert("Failed to save data");
            return;
        }

        alert("Data saved successfully");
        
        // Reload data to reflect changes
        await loadSavedData();

    } catch (error) {
        console.error("Save data error:", error);
        alert("Backend not reachable");
    }

    });
}
