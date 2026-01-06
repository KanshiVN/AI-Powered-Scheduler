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

    try {
        const response = await fetch(
            "http://localhost:5000/api/common/timetable"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.warn("No timetable available");
            return;
        }

        const fullTimetable = result.timetable;

        // ✅ Pick first class for now
        const className = Object.keys(fullTimetable)[0];
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
                        ? `<strong>${entry.subject}</strong><br><small>${entry.faculty}</small>`
                        : "-";
                }
            });
        });

    } catch (err) {
        console.error("Timetable fetch failed", err);
    }
});
