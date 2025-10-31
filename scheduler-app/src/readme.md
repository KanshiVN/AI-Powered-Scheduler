scheduler-app/
├── node_modules/       # Installed Node.js packages (like Electron)
├── server/             # (PLANNED) Backend Node.js server code
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
├── src/                # All frontend HTML, CSS, and JS files
│   ├── css/
│   │   └── style.css   # Main stylesheet
│   │
│   ├── js/
│   │   ├── login.js
│   │   ├── main.js               # Mobile menu logic
│   │   │
│   │   ├── dashboard.js          # HOD
│   │   ├── data-input.js         # HOD
│   │   ├── generate-timetable.js # HOD
│   │   ├── view-timetable.js     # HOD
│   │   ├── exams.js              # HOD
│   │   │
│   │   ├── faculty-dashboard.js
│   │   ├── faculty-view-timetable.js
│   │   ├── faculty-exams.js
│   │   │
│   │   ├── exam-control-dashboard.js
│   │   ├── exam-control-generator.js
│   │   └── exam-control-viewer.js
│   │
│   ├── login.html              # Login page
│   ├── index.html              # HOD Dashboard
│   ├── data-input.html
│   ├── generate-timetable.html
│   ├── view-timetable.html
│   ├── exams.html
│   │
│   ├── faculty-dashboard.html
│   ├── faculty-view-timetable.html
│   ├── faculty-exams.html
│   │
│   ├── exam-control-dashboard.html
│   ├── exam-control-generator.html
│   ├── exam-control-viewer.html
│   │
│   └── favicon.png             # Application icon
│
├── main.js             # Main Electron script (loads the window)
├── package.json        # Project configuration and dependencies
└── package-lock.json   # Lockfile for dependency versions