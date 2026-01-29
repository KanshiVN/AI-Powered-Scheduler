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

    // 7b. When class changes in Subject tab, load that class's subjects only
    const subjectClassSelector = document.getElementById('select-class-subject');
    if (subjectClassSelector) {
        subjectClassSelector.addEventListener('change', () => {
            const v = subjectClassSelector.value;
            loadSubjects(cachedSubjectsByClass[v] || []);
        });
    }

    // 8. Setup for Rooms Tab
    setupRoomAddButton();
    setupRoomDeleteListener();

    // 9. Setup for Faculties Tab
    setupFacultyAddButton();
    setupFacultyDeleteListener();
});


// --- LOAD SAVED DATA FROM BACKEND ---
// Store batches: {className: batchCount}
let cachedBatches = {};

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
            cachedSubjectsByClass = result.data.subjects_by_class || {};

            // Load batches data
            const batchesByClass = result.data.batches || {};
            cachedBatches = {};
            for (const className in batchesByClass) {
                cachedBatches[className] = batchesByClass[className].length;
            }

            loadClasses(result.data.classes || []);
            loadFaculties(result.data.faculties || []);
            loadRooms(result.data.rooms || []);
            updateClassSelectors(result.data.classes || []);

            // Load subjects for the currently selected class (or empty if none)
            const sel = document.getElementById('select-class-subject');
            const selectedClass = sel?.value || '';
            if (selectedClass) {
                loadSubjects(cachedSubjectsByClass[selectedClass] || []);
            }
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

    // Add classes dynamically with batch information
    classes.forEach(className => {
        const batchCount = cachedBatches[className] || 0;
        // Use full class name for batches: SEA → SEA1, SEA2
        const batchNames = Array.from({ length: batchCount }, (_, i) => `${className}${i + 1}`).join(', ');

        const rowHTML = `
            <div class="list-row">
                <div class="list-col-main">
                    <span class="class-name">${className}</span>
                    ${batchCount > 0 ? `<span class="batch-info" style="font-size: 0.85em; color: #666; margin-left: 8px;">Batches: ${batchNames}</span>` : ''}
                </div>
                <div class="action-icons">
                    <a href="#" class="edit-class" title="Edit Class"><i data-feather="edit-2"></i></a>
                    <a href="#" class="delete-class" title="Delete Class"><i data-feather="trash-2"></i></a>
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

    subjects.forEach(subject => {
        const n = String(subject.name || '').replace(/"/g, '&quot;');
        const s = String(subject.short || '').replace(/"/g, '&quot;');
        const type = subject.type || 'lecture';
        const duration = subject.duration_slots || 1;

        const rowHTML = `
            <div class="subject-list-row">
                <input type="text" class="col-subject subject-name-input" value="${n}" placeholder="Subject Name">
                <input type="text" class="col-short-name" value="${s}" placeholder="Short Name (e.g., ML)">
                <div class="col-type select-wrapper">
                    <select class="subject-type-select">
                        <option value="lecture" ${type === 'lecture' ? 'selected' : ''}>Lecture</option>
                        <option value="lab" ${type === 'lab' ? 'selected' : ''}>Lab</option>
                        <option value="project" ${type === 'project' ? 'selected' : ''}>Project</option>
                    </select>
                </div>
                <input type="number" class="col-duration duration-input" value="${duration}" min="1" max="4" placeholder="1">
                <div class="col-availability">
                    <span class="availability-tag"><i data-feather="check-circle"></i> All available</span>
                </div>
                <div class="col-action">
                    <a href="#"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });

    // Add auto-detection event listeners to all subject name inputs
    container.querySelectorAll('.subject-name-input').forEach(input => {
        input.addEventListener('input', handleSubjectNameChange);
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

// Per-class subjects cache (class name -> [{name, short, type, duration_slots}])
let cachedSubjectsByClass = {};

// Auto-detect subject type from name
function detectSubjectType(subjectName) {
    if (!subjectName) return { type: 'lecture', duration_slots: 1 };

    const nameLower = subjectName.toLowerCase();

    // Lab keywords
    const labKeywords = ['lab', 'laboratory', 'practical', 'workshop', 'hands-on'];
    if (labKeywords.some(keyword => nameLower.includes(keyword))) {
        return { type: 'lab', duration_slots: 2 };
    }

    // Project keywords
    const projectKeywords = ['project', 'mini project', 'major project', 'capstone'];
    if (projectKeywords.some(keyword => nameLower.includes(keyword))) {
        return { type: 'project', duration_slots: 2 };
    }

    // Default: lecture
    return { type: 'lecture', duration_slots: 1 };
}

// Handle subject name change for auto-detection
function handleSubjectNameChange(event) {
    const input = event.target;
    const row = input.closest('.subject-list-row');
    if (!row) return;

    const subjectName = input.value;
    const detected = detectSubjectType(subjectName);

    // Update type dropdown
    const typeSelect = row.querySelector('.subject-type-select');
    if (typeSelect) {
        typeSelect.value = detected.type;
    }

    // Update duration input
    const durationInput = row.querySelector('.duration-input');
    if (durationInput) {
        durationInput.value = detected.duration_slots;
    }
}

// --- UPDATE CLASS SELECTORS ---
function updateClassSelectors(classes) {
    // Update subject tab class selector - use raw class name as value (e.g. "BE A")
    const subjectClassSelector = document.getElementById('select-class-subject');
    if (subjectClassSelector) {
        const firstOpt = subjectClassSelector.querySelector('option[value=""]');
        subjectClassSelector.innerHTML = '';
        if (firstOpt) subjectClassSelector.appendChild(firstOpt);
        else {
            const def = document.createElement('option');
            def.value = ''; def.textContent = 'Select Class'; def.disabled = true; def.selected = true;
            subjectClassSelector.appendChild(def);
        }
        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
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
        const className = prompt('Enter class name (e.g., FEA, SEA, BEA):');
        if (!className || !className.trim()) return;

        const batchCountStr = prompt('Enter number of batches for this class (0 for no batches):', '0');
        const batchCount = parseInt(batchCountStr) || 0;

        const classNameTrimmed = className.trim();
        cachedBatches[classNameTrimmed] = batchCount;

        // Use full class name: SEA → SEA1, SEA2, SEA3
        const batchNames = Array.from({ length: batchCount }, (_, i) => `${classNameTrimmed}${i + 1}`).join(', ');

        const rowHTML = `
            <div class="list-row">
                <div class="list-col-main">
                    <span class="class-name">${classNameTrimmed}</span>
                    ${batchCount > 0 ? `<span class="batch-info" style="font-size: 0.85em; color: #666; margin-left: 8px;">Batches: ${batchNames}</span>` : ''}
                </div>
                <div class="action-icons">
                    <a href="#" class="edit-class" title="Edit Class"><i data-feather="edit-2"></i></a>
                    <a href="#" class="delete-class" title="Delete Class"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
        feather.replace();

        // Update class selectors
        const classes = [];
        container.querySelectorAll('.list-row:not(.header)').forEach(row => {
            const name = row.querySelector('.class-name')?.textContent.trim();
            if (name) classes.push(name);
        });
        updateClassSelectors(classes);
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
                const className = row.querySelector('.class-name')?.textContent.trim();
                if (confirm(`Are you sure you want to delete class "${className}"?`)) {
                    delete cachedBatches[className];
                    row.remove();

                    // Update class selectors
                    const classes = [];
                    container.querySelectorAll('.list-row:not(.header)').forEach(r => {
                        const name = r.querySelector('.class-name')?.textContent.trim();
                        if (name) classes.push(name);
                    });
                    updateClassSelectors(classes);
                }
            }
        } else if (editLink) {
            event.preventDefault();
            const row = editLink.closest('.list-row');
            if (row) {
                const classNameSpan = row.querySelector('.class-name');
                const currentName = classNameSpan?.textContent.trim();
                const newName = prompt('Enter new class name:', currentName);
                if (!newName || !newName.trim() || newName === currentName) return;

                const newNameTrimmed = newName.trim();
                const batchCountStr = prompt('Enter number of batches for this class:', cachedBatches[currentName] || 0);
                const batchCount = parseInt(batchCountStr) || 0;

                // Update batches cache
                delete cachedBatches[currentName];
                cachedBatches[newNameTrimmed] = batchCount;

                // Update display - use full class name
                const batchNames = Array.from({ length: batchCount }, (_, i) => `${newNameTrimmed}${i + 1}`).join(', ');

                const mainCol = row.querySelector('.list-col-main');
                mainCol.innerHTML = `
                    <span class="class-name">${newNameTrimmed}</span>
                    ${batchCount > 0 ? `<span class="batch-info" style="font-size: 0.85em; color: #666; margin-left: 8px;">Batches: ${batchNames}</span>` : ''}
                `;

                // Update class selectors
                const classes = [];
                container.querySelectorAll('.list-row:not(.header)').forEach(r => {
                    const name = r.querySelector('.class-name')?.textContent.trim();
                    if (name) classes.push(name);
                });
                updateClassSelectors(classes);
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
            <input type="text" class="col-subject subject-name-input" placeholder="Subject Name">
            <input type="text" class="col-short-name" placeholder="Short Name (e.g., ML)">
            <div class="col-type select-wrapper">
                <select class="subject-type-select">
                    <option value="lecture" selected>Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="project">Project</option>
                </select>
            </div>
            <input type="number" class="col-duration duration-input" value="1" min="1" max="4" placeholder="1">
            <div class="col-availability">
                <span class="availability-tag"><i data-feather="check-circle"></i> All available</span>
            </div>
            <div class="col-action">
                <a href="#"><i data-feather="trash-2"></i></a>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', newRowHTML);

        // Add auto-detection to the new row
        const newRow = container.lastElementChild;
        const nameInput = newRow.querySelector('.subject-name-input');
        if (nameInput) {
            nameInput.addEventListener('input', handleSubjectNameChange);
        }

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

        // Collecting classes and batches
        const classes = [];
        const batches = {};
        document.querySelectorAll('#classes .list-row:not(.header)').forEach(row => {
            const className = row.querySelector('.class-name')?.textContent.trim();
            if (className) {
                classes.push(className);
                batches[className] = cachedBatches[className] || 0;
            }
        });


        // 1. Collect Faculties
        const faculties = [];
        document.querySelectorAll('.faculty-list-row:not(.header)').forEach(row => {
            const name = row.querySelector('.col-prof-name')?.value.trim();
            const short = row.querySelector('.col-short-name')?.value.trim();
            const position = row.querySelector('.col-position select')?.value;
            if (name) {
                faculties.push({ name, short, position: position || '' });
            }
        });


        // 2. Collect Rooms
        const rooms = [];
        document.querySelectorAll('.room-list-row:not(.header)').forEach(row => {
            const room = row.querySelector('.col-room-num')?.value.trim();
            const type = row.querySelector('select')?.value;
            if (room) {
                rooms.push({ room, type });
            }
        });


        try {
            const savePayload = { classes, batches, faculties, rooms };
            const response = await fetch("http://localhost:5000/api/hod/save-data", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(savePayload)
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                alert("Failed to save data");
                return;
            }

            // Save subjects for the selected class only (if a class is selected in Subject tab)
            const subjectClassSel = document.getElementById('select-class-subject');
            const selectedClass = subjectClassSel?.value?.trim();
            if (selectedClass) {
                const subjects = [];
                document.querySelectorAll('.subject-list-row:not(.header)').forEach(row => {
                    const name = row.querySelector('.col-subject')?.value?.trim();
                    const short = row.querySelector('.col-short-name')?.value?.trim();
                    const type = row.querySelector('.subject-type-select')?.value || 'lecture';
                    const duration_slots = parseInt(row.querySelector('.duration-input')?.value) || 1;

                    if (name) {
                        subjects.push({ name, short, type, duration_slots });
                    }
                });
                const subResp = await fetch("http://localhost:5000/api/hod/save-subjects-for-class", {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ class_name: selectedClass, subjects })
                });
                const subRes = await subResp.json();
                if (!subResp.ok || !subRes.success) {
                    alert("Data saved, but subjects for this class could not be saved.");
                } else {
                    // Update cache with saved subjects
                    cachedSubjectsByClass[selectedClass] = subjects;
                }
            }

            alert("Data saved successfully");

            // Save the currently selected class before reloading
            const currentSelectedClass = subjectClassSel?.value;

            // Reload all data
            await loadSavedData();

            // Restore the class selection and reload its subjects
            if (currentSelectedClass && subjectClassSel) {
                subjectClassSel.value = currentSelectedClass;
                loadSubjects(cachedSubjectsByClass[currentSelectedClass] || []);
            }
        } catch (error) {
            console.error("Save data error:", error);
            alert("Backend not reachable");
        }
    });
}
