document.addEventListener("DOMContentLoaded", async () => {

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "index.html";
        });
    }

    // 1. Load Timetable Config First
    await loadTimetableConfig();

    // 2. Load available classes and populate dropdown
    await loadAvailableClasses();

    // Setup class selector change listener
    const classSelector = document.getElementById("select-class");
    if (classSelector) {
        classSelector.addEventListener("change", async (e) => {
            const selectedClass = e.target.value;
            if (selectedClass) {
                await loadTimetableForClass(selectedClass);
            } else {
                clearTimetable();
            }
        });
    }
});

// Global config
let timeSettings = [];
let lectureCount = 0;

// --- LOAD TIMETABLE CONFIG ---
async function loadTimetableConfig() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/common/timetable/config"
        );

        if (response.ok) {
            const result = await response.json();
            // Default if missing
            timeSettings = result.config.time_settings || [];

            // If no settings, maybe fallback to defaults or previous hardcoded logic?
            // For now, we assume settings exist or we show empty.
            // Let's at least calculate lecture count
            lectureCount = timeSettings.filter(t => t.type === 'lecture').length;

            // Build the grid structure immediately
            buildTimetableGrid();
        }
    } catch (err) {
        console.error("Failed to load config", err);
        // Fallback: 6 lectures, default times?
        // For now, let's just leave it empty or minimal to avoid hardcoded mismatch
    }
}

// --- BUILD TIMETABLE GRID DYNAMICALLY ---
function buildTimetableGrid() {
    const gridContainer = document.querySelector('.timetable-grid');
    if (!gridContainer) return;

    // 1. Define Grid Columns CSS
    // Day column (0.5fr) + dynamic columns
    let columnsCSS = "0.5fr";
    timeSettings.forEach(slot => {
        if (slot.type === 'break') {
            columnsCSS += " 0.2fr";
        } else {
            columnsCSS += " 1fr";
        }
    });

    // Apply style directly
    gridContainer.style.gridTemplateColumns = columnsCSS;

    // 2. Build Content
    let html = '';

    // -- Header Row --
    html += `<div class="grid-cell grid-header"></div>`; // Empty corner cell

    timeSettings.forEach(slot => {
        if (slot.type === 'break') {
            html += `<div class="grid-cell break-cell"><i data-feather="scissors"></i></div>`;
        } else {
            // "09:00" to "10:00" -> "9:00 - 10:00" formatted?
            // Keep it simple or formatted. Input is "HH:MM".
            html += `<div class="grid-cell grid-header">${slot.start_time} - ${slot.end_time}</div>`;
        }
    });

    // -- Body Rows (Mon-Fri) --
    const days = [
        { name: "Monday", short: "MON", id: "mon" },
        { name: "Tuesday", short: "TUE", id: "tue" },
        { name: "Wednesday", short: "WED", id: "wed" },
        { name: "Thursday", short: "THR", id: "thr" },
        { name: "Friday", short: "FRI", id: "fri" }
    ];

    days.forEach(day => {
        // Day Header
        html += `<div class="grid-cell day-header">${day.short}</div>`;

        // Slots
        timeSettings.forEach(slot => {
            if (slot.type === 'break') {
                html += `<div class="grid-cell break-cell"></div>`;
            } else {
                // Lecture slot
                // We add the class '${day.id}' so we can find all slots for that day easily
                html += `<div class="grid-cell lecture-slot ${day.id}"></div>`;
            }
        });
    });

    gridContainer.innerHTML = html;
    feather.replace();
}


// --- LOAD AVAILABLE CLASSES ---
async function loadAvailableClasses() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/common/timetable/classes"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.warn("No timetable available");
            const classSelector = document.getElementById("select-class");
            if (classSelector) {
                classSelector.innerHTML = '<option value="">No timetable available</option>';
            }
            return;
        }

        const classes = result.classes || [];
        const classSelector = document.getElementById("select-class");

        if (!classSelector) return;

        // Clear existing options except the first one
        classSelector.innerHTML = '<option value="">Select Class</option>';

        // Add available classes
        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelector.appendChild(option);
        });

        // If there's only one class, auto-select it
        if (classes.length === 1) {
            classSelector.value = classes[0];
            await loadTimetableForClass(classes[0]);
        }
    } catch (err) {
        console.error("Failed to load available classes", err);
        const classSelector = document.getElementById("select-class");
        if (classSelector) {
            classSelector.innerHTML = '<option value="">Error loading classes</option>';
        }
    }
}

// --- LOAD TIMETABLE FOR SELECTED CLASS ---
async function loadTimetableForClass(className) {
    try {
        const response = await fetch(
            "http://localhost:5000/api/common/timetable"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.warn("No timetable available");
            clearTimetable();
            return;
        }

        const fullTimetable = result.timetable;

        if (!fullTimetable || !fullTimetable[className]) {
            console.warn(`No timetable found for class: ${className}`);
            clearTimetable();
            return;
        }

        const classTimetable = fullTimetable[className];

        const dayMap = {
            Monday: "mon",
            Tuesday: "tue",
            Wednesday: "wed",
            Thursday: "thr",
            Friday: "fri"
        };

        // Generate Slots Accessors: ["L1", "L2", "L3"...]
        // based on dynamic lectureCount
        // If lectureCount is 0 (config failed?), assume 6
        const count = lectureCount > 0 ? lectureCount : 6;
        const slots = Array.from({ length: count }, (_, i) => `L${i + 1}`);

        Object.keys(dayMap).forEach(day => {
            const dayClass = dayMap[day];

            // These selector finds ALL lecture slots for the day (skipping breaks, 
            // because breaks don't have .lecture-slot class)
            const cells = document.querySelectorAll(`.lecture-slot.${dayClass}`);

            slots.forEach((slot, index) => {
                const entry = classTimetable?.[day]?.[slot];

                // Check bounds
                if (cells[index]) {
                    cells[index].innerHTML = entry
                        ? `<strong>${entry.subject || '-'}</strong><br><small>${entry.faculty || 'TBD'}</small>`
                        : "-";

                    // Optional: color coding based on subject or random?
                    // Currently relying on CSS defaults (.lecture-slot.mon etc)
                }
            });
        });

        feather.replace();

    } catch (err) {
        console.error("Timetable fetch failed", err);
        clearTimetable();
    }
}

// --- CLEAR TIMETABLE DISPLAY ---
function clearTimetable() {
    const cells = document.querySelectorAll('.lecture-slot');
    cells.forEach(cell => {
        cell.innerHTML = "-";
    });
}

