document.addEventListener("DOMContentLoaded", () => {

    // Role check
    if (localStorage.getItem("userRole") !== "faculty") {
        alert("Access denied");
        window.location.href = "index.html";
        return;
    }

    // Personalization
    const username = localStorage.getItem("username");
    if (username) {
        document.getElementById("user-name").textContent = username;
    }

    // Example subjects (later from backend)
    const subjects = ["ML", "DS", "AI", "DBMS", "OS", "CN"];

    const pref1 = document.getElementById("pref1");
    const pref2 = document.getElementById("pref2");
    const pref3 = document.getElementById("pref3");

    [pref1, pref2, pref3].forEach(select => {
        subjects.forEach(sub => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = sub;
            select.appendChild(opt);
        });
    });

    // Submit logic
    document.getElementById("preference-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            faculty: username,
            preferences: [
                pref1.value,
                pref2.value,
                pref3.value
            ].filter(Boolean)
        };

        console.log("Faculty preference payload:", payload);

        /*
        await fetch("/api/faculty/preference", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        */

        alert("Preferences submitted successfully!");
    });

});
