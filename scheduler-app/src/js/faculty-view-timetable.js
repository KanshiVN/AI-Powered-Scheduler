document.addEventListener("DOMContentLoaded", async () => {

    // 1. Authorization check (faculty only)
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "faculty") {
        alert("Access Denied");
        window.location.href = "index.html";
        return;
    }

    // 2. Personalization
    const username = localStorage.getItem("username");
    if (username) {
        document.getElementById("user-name").textContent = username;
    }

    // Tabs: Class View / Personal Schedule
    const steps = document.querySelectorAll('.stepper-container .step');
    const classView = document.querySelector('.viewer-content.class-view');
    const personalView = document.querySelector('.viewer-content.personal-view');
    const classSelect = document.getElementById('select-class-view');

    let fullTimetableCache = null;

    if (steps.length === 2 && classView && personalView) {
        steps[0].classList.add('active');
        classView.style.display = '';
        personalView.style.display = 'none';

        steps[0].addEventListener('click', () => {
            steps[0].classList.add('active');
            steps[1].classList.remove('active');
            classView.style.display = '';
            personalView.style.display = 'none';
        });

        steps[1].addEventListener('click', () => {
            steps[1].classList.add('active');
            steps[0].classList.remove('active');
            personalView.style.display = '';
            classView.style.display = 'none';
        });
    }

    // 3. Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "index.html";
        });
    }

    // 4. Load Timetable Config First
    await loadTimetableConfig();

    // 5. Fetch global class timetable and populate class selector for Class View
    try {
        const commonResp = await fetch("http://localhost:5000/api/common/timetable");
        const commonResult = await commonResp.json();
        if (commonResp.ok && commonResult.success && commonResult.timetable) {
            fullTimetableCache = commonResult.timetable;
            populateClassSelect(fullTimetableCache, classSelect);
            // Render first class by default if available
            const firstClass = Object.keys(fullTimetableCache)[0];
            if (firstClass) {
                if (classSelect) classSelect.value = firstClass;
                renderClassView(fullTimetableCache, firstClass);
            }
        }
    } catch (err) {
        console.warn("Could not load class timetable", err);
    }

    // 6. Fetch timetable filtered for the logged-in faculty (Personal Schedule)
    try {
        const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
        if (username) {
            headers["X-Username"] = username;
        }

        const response = await fetch(
            "http://localhost:5000/api/faculty/timetable",
            {
                method: "GET",
                headers
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.warn(result.message || "No timetable available for this faculty");
            return;
        }

        const facultyTimetable = result.timetable || {};
        renderPersonalView(facultyTimetable);

    } catch (error) {
        console.error("Failed to load faculty timetable", error);
    }

    // Class select change -> render selected class
    if (classSelect) {
        classSelect.addEventListener('change', () => {
            const cls = classSelect.value;
            renderClassView(fullTimetableCache, cls);
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
            timeSettings = result.config.time_settings || [];
            lectureCount = timeSettings.filter(t => t.type === 'lecture').length;

            // Build both grid structures
            buildTimetableGrid('class-view-grid', 'class-view');
            buildTimetableGrid('personal-view-grid', 'personal');
        }
    } catch (err) {
        console.error("Failed to load config", err);
    }
}

// --- BUILD TIMETABLE GRID DYNAMICALLY ---
function buildTimetableGrid(gridId, viewType) {
    const gridContainer = document.getElementById(gridId);
    if (!gridContainer) return;

    // 1. Define Grid Columns CSS
    let columnsCSS = "0.5fr";
    timeSettings.forEach(slot => {
        if (slot.type === 'break') {
            columnsCSS += " 0.2fr";
        } else {
            columnsCSS += " 1fr";
        }
    });

    gridContainer.style.gridTemplateColumns = columnsCSS;

    // 2. Build Content
    let html = '';

    // -- Header Row --
    html += `<div class="grid-cell grid-header"></div>`;

    timeSettings.forEach(slot => {
        if (slot.type === 'break') {
            html += `<div class="grid-cell break-cell"><i data-feather="scissors"></i></div>`;
        } else {
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
        html += `<div class="grid-cell day-header">${day.short}</div>`;

        timeSettings.forEach(slot => {
            if (slot.type === 'break') {
                html += `<div class="grid-cell break-cell"></div>`;
            } else {
                html += `<div class="grid-cell lecture-slot ${viewType} ${day.id}"></div>`;
            }
        });
    });

    gridContainer.innerHTML = html;
    feather.replace();
}

// Render helpers
const DAY_MAP = {
    Monday: "mon",
    Tuesday: "tue",
    Wednesday: "wed",
    Thursday: "thr",
    Friday: "fri"
};

function populateClassSelect(fullTimetable, classSelectElement) {
    if (!fullTimetable || typeof fullTimetable !== "object") return;
    if (!classSelectElement) return;
    classSelectElement.innerHTML = '<option value="" disabled>Select Class</option>';
    Object.keys(fullTimetable).forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        classSelectElement.appendChild(opt);
    });
    if (classSelectElement.options.length > 1) {
        classSelectElement.options[1].selected = true;
    }
}

function renderClassView(fullTimetable, className) {
    if (!fullTimetable || typeof fullTimetable !== "object") return;
    if (!className) return;
    const classTimetable = fullTimetable[className];
    if (!classTimetable) return;

    // Generate dynamic slots based on lecture count
    const count = lectureCount > 0 ? lectureCount : 6;
    const SLOTS = Array.from({ length: count }, (_, i) => `L${i + 1}`);

    Object.keys(DAY_MAP).forEach(day => {
        const dayClass = DAY_MAP[day];
        const cells = document.querySelectorAll(`.lecture-slot.class-view.${dayClass}`);

        SLOTS.forEach((slot, index) => {
            const entry = classTimetable?.[day]?.[slot];
            if (cells[index]) {
                cells[index].innerHTML = entry
                    ? `<strong>${entry.subject || "-"}</strong><br><small>${entry.faculty || ""}</small>`
                    : "-";
            }
        });
    });

    feather.replace();
}

function renderPersonalView(facultyTimetable) {
    if (!facultyTimetable || typeof facultyTimetable !== "object") return;

    // Generate dynamic slots based on lecture count
    const count = lectureCount > 0 ? lectureCount : 6;
    const SLOTS = Array.from({ length: count }, (_, i) => `L${i + 1}`);

    Object.keys(DAY_MAP).forEach(day => {
        const dayClass = DAY_MAP[day];
        const cells = document.querySelectorAll(`.lecture-slot.personal.${dayClass}`);

        SLOTS.forEach((slot, index) => {
            const entry = facultyTimetable?.[day]?.[slot];
            if (cells[index]) {
                cells[index].innerHTML = entry
                    ? `<strong>${entry.subject || "-"}</strong><br><small>${entry.class || ""}</small>`
                    : "-";
            }
        });
    });

    feather.replace();
}
