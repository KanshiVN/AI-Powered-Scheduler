document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authorization & Personalization
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'hod') {
        alert('Access Denied. You are not authorized to view this page.');
        window.location.href = 'index.html';
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
            window.location.href = 'index.html';
        });
    }

    // 2. Load saved data from backend
    await loadSavedDataForGenerator();

    // 3. Tab Switching Logic
    const tabs = document.querySelectorAll('.stepper-container .step');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(tab.dataset.tab);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // If review tab is clicked, load review content
                if (tab.dataset.tab === 'review-generate') {
                    await loadReviewContent();
                }
            }
        });
    });


    // 4. Dynamic Lecture Row Generation (for General Settings tab)
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
    
    // 5. Setup class selector change listener for lessons tab
    const classSelector = document.getElementById('select-class-lesson');
    if (classSelector) {
        classSelector.addEventListener('change', () => {
            loadSubjectsForClass();
        });
    }
    
    // 6. Setup for Lessons Tab
    setupLessonAddButton();
    setupLessonDeleteListener();

    // 7. Setup for Faculty Choice Tab
    setupFacultyAddButton();
    setupFacultyDeleteListener();
    
    // 8. Setup Save Configuration Buttons
    setupSaveButtons();
    
    // 9. Setup Review Tab
    setupReviewTab();
    
    // 10. Setup Generate Timetable Button (only in review tab)
    setupGenerateTimetableButton();
});

// --- LOAD SAVED DATA FOR GENERATOR ---
let savedData = { classes: [], subjects: [], faculties: [], rooms: [] };

async function loadSavedDataForGenerator() {
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
            savedData = {
                classes: result.data.classes || [],
                subjects: result.data.subjects || [],
                faculties: result.data.faculties || [],
                rooms: result.data.rooms || []
            };
            
            // Update class selector
            updateClassSelector(savedData.classes);
            
            // Load faculty choice table
            loadFacultyChoiceTable(savedData.faculties, savedData.classes);
            
            // Load subjects for default class if available
            // Note: loadSubjectsForClass will handle empty state gracefully
            loadSubjectsForClass();
        }
    } catch (error) {
        console.error("Error loading saved data:", error);
    }
}

// --- UPDATE CLASS SELECTOR ---
function updateClassSelector(classes) {
    const classSelector = document.getElementById('select-class-lesson');
    if (!classSelector) return;

    // Keep the first option (Select Class)
    const firstOption = classSelector.querySelector('option[value=""]');
    classSelector.innerHTML = '';
    if (firstOption) {
        classSelector.appendChild(firstOption);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Class';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        classSelector.appendChild(defaultOption);
    }
    
    // Add classes as options
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className.toLowerCase().replace(/\s+/g, '-');
        option.textContent = className;
        classSelector.appendChild(option);
    });
}

// --- LOAD SUBJECTS FOR SELECTED CLASS ---
function loadSubjectsForClass() {
    const classSelector = document.getElementById('select-class-lesson');
    const container = document.querySelector('.lesson-list-container');
    
    if (!classSelector || !container) return;
    
    const selectedClass = classSelector.value;
    
    // Clear existing subjects (except header)
    const header = container.querySelector('.lesson-list-row.header');
    if (!header) return; // Safety check
    
    container.innerHTML = '';
    container.appendChild(header);
    
    if (!selectedClass) {
        return; // Just show header if no class selected
    }
    
    // Add subjects dynamically
    savedData.subjects.forEach(subject => {
        const rowHTML = `
            <div class="lesson-list-row">
                <div class="col-subject"><input type="text" class="new-subject-input" value="${subject.name || ''}" placeholder="Subject Name"></div>
                <div class="col-short-name"><input type="text" class="new-subject-input" value="${subject.short || ''}" placeholder="SN"></div>
                <span class="col-availability availability-tag"><i data-feather="check-circle"></i> All available</span>
                <div class="col-hrs-week">
                    <input type="number" class="hrs-input" value="3" min="1" max="10">
                </div>
                <div class="col-action">
                    <a href="#"><i data-feather="trash-2"></i></a>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });
    
    feather.replace();
}

// --- LOAD FACULTY CHOICE TABLE ---
function loadFacultyChoiceTable(faculties, classes) {
    const container = document.querySelector('.faculty-choice-list-container');
    if (!container) return;
    
    // Clear existing content (except header)
    const header = container.querySelector('.faculty-choice-list-row.header');
    container.innerHTML = '';
    
    // Build header with dynamic class columns
    let headerHTML = `
        <div class="faculty-choice-list-row header">
            <span class="col-prof-name">Professor name</span>
            <span class="col-short-name">Short name</span>`;
    
    classes.forEach(className => {
        const classKey = className.toLowerCase().replace(/\s+/g, '-');
        headerHTML += `<span class="col-${classKey}">${className}</span>`;
    });
    
    headerHTML += `<span class="col-action">Action</span></div>`;
    container.insertAdjacentHTML('beforeend', headerHTML);
    
    // Add faculty rows with dynamic class columns
    faculties.forEach(faculty => {
        let rowHTML = `
            <div class="faculty-choice-list-row">
                <span class="col-prof-name">${faculty.name || ''}</span>
                <span class="col-short-name">${faculty.short || ''}</span>`;
        
        classes.forEach(className => {
            const classKey = className.toLowerCase().replace(/\s+/g, '-');
            rowHTML += `<div class="col-${classKey}"><input type="text" class="subject-choice-input" placeholder="Subject"></div>`;
        });
        
        rowHTML += `
                <div class="col-action"><a href="#"><i data-feather="trash-2"></i></a></div>
            </div>`;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });
    
    feather.replace();
}


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
        // Build dynamic class columns based on saved classes
        let classColumnsHTML = '';
        savedData.classes.forEach(className => {
            const classKey = className.toLowerCase().replace(/\s+/g, '-');
            classColumnsHTML += `<div class="col-${classKey}"><input type="text" class="subject-choice-input" placeholder="Subject"></div>`;
        });
        
        const newRowHTML = `
        <div class="faculty-choice-list-row">
            <div class="col-prof-name"><input type="text" class="new-subject-input" placeholder="Professor Name"></div>
            <div class="col-short-name"><input type="text" class="new-subject-input" placeholder="SN"></div>
            ${classColumnsHTML}
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

// --- SETUP SAVE BUTTONS ---
function setupSaveButtons() {
    // Save General Settings
    const saveGeneralBtn = document.getElementById("save-general-settings-btn");
    if (saveGeneralBtn) {
        saveGeneralBtn.addEventListener("click", async () => {
            await saveGeneralSettings();
        });
    }
    
    // Save Lessons
    const saveLessonsBtn = document.getElementById("save-lessons-btn");
    if (saveLessonsBtn) {
        saveLessonsBtn.addEventListener("click", async () => {
            await saveLessons();
        });
    }
    
    // Save Faculty Choices
    const saveFacultyBtn = document.getElementById("save-faculty-choice-btn");
    if (saveFacultyBtn) {
        saveFacultyBtn.addEventListener("click", async () => {
            await saveFacultyChoices();
        });
    }
}

// --- SAVE GENERAL SETTINGS ---
async function saveGeneralSettings() {
    const lecturesPerDay = document.getElementById("lectures-count")?.value || 6;
    
    try {
        const currentConfig = await getTimetableConfig();
        currentConfig.lectures_per_day = parseInt(lecturesPerDay, 10);
        
        const response = await fetch(
            "http://localhost:5000/api/hod/save-timetable-config",
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(currentConfig)
            }
        );
        
        const result = await response.json();
        if (result.success) {
            alert("General settings saved successfully!");
        } else {
            alert("Failed to save settings");
        }
    } catch (error) {
        console.error("Error saving general settings:", error);
        alert("Failed to save settings");
    }
}

// --- SAVE LESSONS ---
async function saveLessons() {
    const classSelector = document.getElementById("select-class-lesson");
    const selectedClass = classSelector?.value;
    
    if (!selectedClass) {
        alert("Please select a class first");
        return;
    }
    
    const lessons = [];
    document.querySelectorAll('.lesson-list-row:not(.header)').forEach(row => {
        const subjectInput = row.querySelector('.col-subject input');
        const shortInput = row.querySelector('.col-short-name input');
        const hoursInput = row.querySelector('.col-hrs-week input');
        
        const subject = subjectInput?.value.trim();
        const short = shortInput?.value.trim();
        const hours = parseInt(hoursInput?.value || 0, 10);
        
        if (subject && hours > 0) {
            lessons.push({ subject, short, hours });
        }
    });
    
    try {
        const currentConfig = await getTimetableConfig();
        if (!currentConfig.lesson_hours) {
            currentConfig.lesson_hours = {};
        }
        currentConfig.lesson_hours[selectedClass] = lessons;
        
        const response = await fetch(
            "http://localhost:5000/api/hod/save-timetable-config",
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(currentConfig)
            }
        );
        
        const result = await response.json();
        if (result.success) {
            alert(`Lessons for ${selectedClass} saved successfully!`);
        } else {
            alert("Failed to save lessons");
        }
    } catch (error) {
        console.error("Error saving lessons:", error);
        alert("Failed to save lessons");
    }
}

// --- SAVE FACULTY CHOICES ---
async function saveFacultyChoices() {
    const facultyChoices = {};
    
    document.querySelectorAll('.faculty-choice-list-row:not(.header)').forEach(row => {
        const nameInput = row.querySelector('.col-prof-name input');
        const nameSpan = row.querySelector('.col-prof-name span');
        const facultyName = nameInput?.value.trim() || nameSpan?.textContent.trim();
        
        if (!facultyName) return;
        
        facultyChoices[facultyName] = {};
        
        // Get choices for each class column
        savedData.classes.forEach(className => {
            const classKey = className.toLowerCase().replace(/\s+/g, '-');
            const choiceInput = row.querySelector(`.col-${classKey} input`);
            const choice = choiceInput?.value.trim();
            if (choice) {
                if (!facultyChoices[facultyName][className]) {
                    facultyChoices[facultyName][className] = [];
                }
                facultyChoices[facultyName][className].push(choice);
            }
        });
    });
    
    try {
        const currentConfig = await getTimetableConfig();
        currentConfig.faculty_choices = facultyChoices;
        
        const response = await fetch(
            "http://localhost:5000/api/hod/save-timetable-config",
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(currentConfig)
            }
        );
        
        const result = await response.json();
        if (result.success) {
            alert("Faculty choices saved successfully!");
        } else {
            alert("Failed to save faculty choices");
        }
    } catch (error) {
        console.error("Error saving faculty choices:", error);
        alert("Failed to save faculty choices");
    }
}

// --- GET TIMETABLE CONFIG ---
async function getTimetableConfig() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/hod/get-timetable-config",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );
        
        if (response.ok) {
            const result = await response.json();
            return result.config || {
                lectures_per_day: 6,
                lesson_hours: {},
                faculty_choices: {}
            };
        }
    } catch (error) {
        console.error("Error getting config:", error);
    }
    
    return {
        lectures_per_day: 6,
        lesson_hours: {},
        faculty_choices: {}
    };
}

// --- SETUP REVIEW TAB ---
function setupReviewTab() {
    // Review content will be loaded when tab is clicked (handled in tab switching logic)
    // This function is kept for future enhancements
}

// --- LOAD REVIEW CONTENT ---
async function loadReviewContent() {
    const reviewContent = document.getElementById("review-content");
    const generateBtn = document.getElementById("generateTimetableBtn");
    
    if (!reviewContent) return;
    
    try {
        const config = await getTimetableConfig();
        const allData = savedData;
        
        let html = '<div class="review-sections">';
        
        // General Settings Review
        html += `
            <div class="review-section">
                <h4><i data-feather="settings"></i> General Settings</h4>
                <p><strong>Lectures per day:</strong> ${config.lectures_per_day || 6}</p>
            </div>
        `;
        
        // Lessons Review
        html += `
            <div class="review-section">
                <h4><i data-feather="book"></i> Lessons Configuration</h4>
        `;
        
        if (Object.keys(config.lesson_hours || {}).length > 0) {
            Object.entries(config.lesson_hours).forEach(([className, lessons]) => {
                html += `<div style="margin: 1rem 0;"><strong>${className}:</strong><ul>`;
                lessons.forEach(lesson => {
                    html += `<li>${lesson.subject} (${lesson.short || 'N/A'}) - ${lesson.hours} hrs/week</li>`;
                });
                html += '</ul></div>';
            });
        } else {
            html += '<p style="color: #999;">No lessons configured yet</p>';
        }
        html += '</div>';
        
        // Faculty Choices Review
        html += `
            <div class="review-section">
                <h4><i data-feather="users"></i> Faculty Subject Choices</h4>
        `;
        
        if (Object.keys(config.faculty_choices || {}).length > 0) {
            Object.entries(config.faculty_choices).forEach(([facultyName, choices]) => {
                html += `<div style="margin: 1rem 0;"><strong>${facultyName}:</strong><ul>`;
                Object.entries(choices).forEach(([className, subjects]) => {
                    html += `<li>${className}: ${subjects.join(', ') || 'None'}</li>`;
                });
                html += '</ul></div>';
            });
        } else {
            html += '<p style="color: #999;">No faculty choices configured yet</p>';
        }
        html += '</div>';
        
        // Basic Data Review
        html += `
            <div class="review-section">
                <h4><i data-feather="database"></i> Basic Data</h4>
                <p><strong>Classes:</strong> ${allData.classes.length}</p>
                <p><strong>Subjects:</strong> ${allData.subjects.length}</p>
                <p><strong>Faculties:</strong> ${allData.faculties.length}</p>
                <p><strong>Rooms:</strong> ${allData.rooms.length}</p>
            </div>
        `;
        
        html += '</div>';
        reviewContent.innerHTML = html;
        
        // Show generate button if configuration is complete
        const hasLessons = Object.keys(config.lesson_hours || {}).length > 0;
        if (hasLessons && allData.classes.length > 0) {
            generateBtn.style.display = 'block';
        } else {
            generateBtn.style.display = 'none';
            reviewContent.innerHTML += '<p style="text-align: center; color: #f44336; margin-top: 2rem;">⚠️ Please complete all configuration steps before generating.</p>';
        }
        
        feather.replace();
    } catch (error) {
        console.error("Error loading review:", error);
        reviewContent.innerHTML = '<p style="color: #f44336;">Error loading review content</p>';
    }
}

// --- SETUP GENERATE TIMETABLE BUTTON ---
function setupGenerateTimetableButton() {
    const generateBtn = document.getElementById("generateTimetableBtn");
    
    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to generate the timetable? This will create a new timetable based on your configuration.")) {
                return;
            }
            
            try {
                const response = await fetch(
                    "http://localhost:5000/api/hod/generate-timetable",
                    {
                        method: "POST",
                        headers: getAuthHeaders()
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    alert("Failed to generate timetable");
                    return;
                }

                alert("Timetable generated successfully!");
                window.location.href = "view-timetable.html";

            } catch (error) {
                console.error(error);
                alert("Scheduler service not reachable");
            }
        });
    }
}


// --- TIMETABLE GENERATION LOGIC ---
