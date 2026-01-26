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

    // Load available classes and populate dropdown
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
        } else if (classes.length > 0) {
            // Auto-select first class
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

        const slots = ["L1", "L2", "L3", "L4", "L5", "L6"];

        Object.keys(dayMap).forEach(day => {
            const dayClass = dayMap[day];
            const cells = document.querySelectorAll(`.lecture-slot.${dayClass}`);

            slots.forEach((slot, index) => {
                const entry = classTimetable?.[day]?.[slot];

                if (cells[index]) {
                    cells[index].innerHTML = entry
                        ? `<strong>${entry.subject || '-'}</strong><br><small>${entry.faculty || 'TBD'}</small>`
                        : "-";
                }
            });
        });

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
