Subject Type Classification - Implementation Walkthrough
Summary
Successfully implemented subject type classification system with automatic detection and manual override capability. Subjects can now be classified as Lecture, Lab, or Project with configurable duration slots.

Key Features:

🎯 Auto-detection: Automatically detects type from subject name
✏️ Manual Override: HOD can change detected type via dropdown
⏱️ Duration Control: Configurable slots (1-4) for each subject
💾 Persistent Storage: Type and duration saved in database
Changes Made
1. Database Schema
Updated: 
subjects
 table (via timetable_config.subjects_by_class)

Subjects now include:

{
    "name": "DBMS Lab",
    "short": "DBMSL",
    "type": "lab",           // NEW: lecture/lab/project
    "duration_slots": 2      // NEW: 1-4 slots
}
2. Backend Implementation
Subject Service
New File: 
subject_service.py

def detect_subject_type(subject_name):
    """Auto-detect subject type from name"""
    name_lower = subject_name.lower()
    
    # Lab detection
    lab_keywords = ['lab', 'laboratory', 'practical', 'workshop', 'hands-on']
    if any(keyword in name_lower for keyword in lab_keywords):
        return {'type': 'lab', 'duration_slots': 2}
    
    # Project detection
    project_keywords = ['project', 'mini project', 'major project', 'capstone']
    if any(keyword in name_lower for keyword in project_keywords):
        return {'type': 'project', 'duration_slots': 2}
    
    # Default: lecture
    return {'type': 'lecture', 'duration_slots': 1}
Features:

Keyword-based detection
Returns both type and suggested duration
Extensible keyword lists
3. Frontend Implementation
UI Updates
data-input.html

Added columns to subject table:

Type: Dropdown (Lecture/Lab/Project)
Duration: Number input (1-4 slots)
<span class="col-type">Type</span>
<span class="col-duration">Duration</span>
JavaScript Updates
data-input.js

1. Auto-Detection Function

function detectSubjectType(subjectName) {
    const nameLower = subjectName.toLowerCase();
    
    // Lab keywords
    const labKeywords = ['lab', 'laboratory', 'practical', 'workshop'];
    if (labKeywords.some(keyword => nameLower.includes(keyword))) {
        return { type: 'lab', duration_slots: 2 };
    }
    
    // Project keywords
    const projectKeywords = ['project', 'mini project', 'major project'];
    if (projectKeywords.some(keyword => nameLower.includes(keyword))) {
        return { type: 'project', duration_slots: 2 };
    }
    
    return { type: 'lecture', duration_slots: 1 };
}
2. Auto-Detection Event Handler

function handleSubjectNameChange(event) {
    const input = event.target;
    const row = input.closest('.subject-list-row');
    const subjectName = input.value;
    const detected = detectSubjectType(subjectName);
    
    // Update type dropdown
    row.querySelector('.subject-type-select').value = detected.type;
    
    // Update duration input
    row.querySelector('.duration-input').value = detected.duration_slots;
}
3. Updated Subject Row HTML

const rowHTML = `
    <div class="subject-list-row">
        <input type="text" class="col-subject subject-name-input" value="${n}">
        <input type="text" class="col-short-name" value="${s}">
        <div class="col-type select-wrapper">
            <select class="subject-type-select">
                <option value="lecture" ${type === 'lecture' ? 'selected' : ''}>Lecture</option>
                <option value="lab" ${type === 'lab' ? 'selected' : ''}>Lab</option>
                <option value="project" ${type === 'project' ? 'selected' : ''}>Project</option>
            </select>
        </div>
        <input type="number" class="col-duration duration-input" value="${duration}" min="1" max="4">
        ...
    </div>`;
4. Updated Save Logic

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
Usage Examples
Example 1: Lab Subject Auto-Detection
User Action: HOD types "DBMS Lab" in subject name

System Response:

Detects "lab" keyword
Type dropdown → Auto-selects "Lab"
Duration input → Auto-fills "2"
Stored Data:

{
    "name": "DBMS Lab",
    "short": "DBMSL",
    "type": "lab",
    "duration_slots": 2
}
Example 2: Project Subject Auto-Detection
User Action: Types "Mini Project"

System Response:

Detects "project" keyword
Type dropdown → "Project"
Duration input → "2"
Example 3: Manual Override
User Action:

Types "Database Systems" (detects as "Lecture", duration 1)
Manually changes dropdown to "Lab"
Changes duration to "2"
Stored Data:

{
    "name": "Database Systems",
    "short": "DB",
    "type": "lab",
    "duration_slots": 2
}
Example 4: Multiple Subjects
Subject Name	Auto-Detected Type	Auto Duration	Final Type	Final Duration
DBMS Lab	Lab	2	Lab	2
Data Structures	Lecture	1	Lecture	1
Mini Project	Project	2	Project	2
ML Practical	Lab	2	Lab	2
Operating Systems	Lecture	1	Lecture	1
Auto-Detection Keywords
Lab Detection
"lab"
"laboratory"
"practical"
"workshop"
"hands-on"
Project Detection
"project"
"mini project"
"major project"
"capstone"
Default: If no keywords detected → "Lecture" with 1 slot

User Flow
1. HOD opens Subject tab
   ↓
2. Enters class name (e.g., "FEA")
   ↓
3. Clicks "Add Subject"
   ↓
4. Types subject name: "DBMS Lab"
   ↓
5. System auto-detects:
   - Type: Lab ✓
   - Duration: 2 slots ✓
   ↓
6. HOD can override if needed
   ↓
7. Clicks "Save Data"
   ↓
8. Subject saved with type & duration
Files Modified
Backend
NEW: 
subject_service.py
 - Auto-detection logic
Frontend
data-input.html
 - Added Type & Duration columns
data-input.js
 - Auto-detection & save logic
Database
Updated 
subjects
 structure in timetable_config.subjects_by_class
Testing Checklist
✅ Auto-Detection

"DBMS Lab" → Lab, 2 slots
"Mini Project" → Project, 2 slots
"Operating Systems" → Lecture, 1 slot
"Machine Learning Practical" → Lab, 2 slots
✅ Manual Override

Can change from auto-detected type
Can adjust duration slots (1-4)
✅ Persistence

Type & duration saved correctly
Reload shows correct values
✅ Edge Cases

Empty subject name → Default to Lecture, 1 slot
Multiple keywords → First match wins
No keywords → Defaults to Lecture
Future Extensions
This foundation enables:

Scheduler Enhancements

Allocate 2+ consecutive slots for labs
Use lab rooms only for lab subjects
Split batches for lab sessions
Advanced Constraints

Lab-specific room requirements
Project-specific faculty assignments
Theory vs practical scheduling rules
Reporting

Lab utilization reports
Theory-to-lab ratio analysis
Duration-based timetable statistics
Quick Reference
Type	Default Duration	Keywords	Typical Use
Lecture	1 slot	(none)	Theory classes
Lab	2 slots	lab, practical, workshop	Hands-on sessions
Project	2 slots	project, capstone	Student projects
The system is now ready to intelligently classify subjects and prepare for advanced lab scheduling!