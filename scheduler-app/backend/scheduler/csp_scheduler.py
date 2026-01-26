"""
CSP (Constraint Satisfaction Problem) Scheduler using Google OR-Tools
This scheduler handles real-world constraints for timetable generation.
"""
from ortools.sat.python import cp_model


def generate_timetable_csp(data, config=None):
    """
    Generate an optimized timetable using Constraint Satisfaction Problem (CSP) solver.
    
    Args:
        data: {
            "classes": ["BE A", "BE B", ...],
            "subjects": [{"name": "ML", "short": "ML"}, ...],
            "faculties": [{"name": "Prof X", "short": "PX"}, ...],
            "rooms": [{"room": "301", "type": "classroom"}, ...],
            "preferences": []  # faculty preferences
        }
        config: {
            "lectures_per_day": 6,
            "lesson_hours": {"BE A": [{"subject": "ML", "hours": 3}, ...]},
            "faculty_choices": {"Prof X": {"BE A": ["ML", "AI"]}}
        }
    
    Returns:
        Timetable dict: {class: {day: {slot: {subject, faculty, room}}}}
    """
    
    classes = data.get("classes", [])
    subjects = data.get("subjects", [])
    faculties = data.get("faculties", [])
    rooms = data.get("rooms", [])
    
    if not classes or not subjects:
        return _generate_empty_timetable(classes)
    
    config = config or {}
    lectures_per_day = config.get("lectures_per_day", 6)
    lesson_hours = config.get("lesson_hours", {})
    faculty_choices = config.get("faculty_choices", {})
    
    # Time structure
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    num_days = len(days)
    slots = [f"L{i+1}" for i in range(lectures_per_day)]
    num_slots = len(slots)
    
    # Create indices
    num_classes = len(classes)
    num_subjects = len(subjects)
    num_faculties = len(faculties) if faculties else 1
    num_rooms = len(rooms) if rooms else 1
    
    # Create the model
    model = cp_model.CpModel()
    
    # Decision variables
    # x[c, d, s, subj, f] = 1 if class c has subject subj with faculty f on day d, slot s
    assignments = {}
    
    for c in range(num_classes):
        for d in range(num_days):
            for s in range(num_slots):
                for subj in range(num_subjects):
                    for f in range(num_faculties):
                        var_name = f"x_c{c}_d{d}_s{s}_subj{subj}_f{f}"
                        assignments[(c, d, s, subj, f)] = model.NewBoolVar(var_name)
    
    # ==================== CONSTRAINTS ====================
    
    # Constraint 1: Each class must have exactly one subject per slot (or empty)
    for c in range(num_classes):
        for d in range(num_days):
            for s in range(num_slots):
                model.Add(
                    sum(assignments[(c, d, s, subj, f)] 
                        for subj in range(num_subjects) 
                        for f in range(num_faculties)) <= 1
                )
    
    # Constraint 2: Faculty cannot teach two classes at the same time
    for f in range(num_faculties):
        for d in range(num_days):
            for s in range(num_slots):
                model.Add(
                    sum(assignments[(c, d, s, subj, f)] 
                        for c in range(num_classes) 
                        for subj in range(num_subjects)) <= 1
                )
    
    # Constraint 3: Subject hours per week (from lesson_hours config)
    for c, class_name in enumerate(classes):
        class_lessons = lesson_hours.get(class_name, [])
        if isinstance(class_lessons, list):
            for lesson in class_lessons:
                subject_name = lesson.get("subject", "")
                hours_required = lesson.get("hours", 0)
                
                # Find subject index
                subj_idx = None
                for idx, subj in enumerate(subjects):
                    if subj.get("name", "").lower() == subject_name.lower():
                        subj_idx = idx
                        break
                
                if subj_idx is not None and hours_required > 0:
                    # Total assignments for this subject in this class should match hours
                    model.Add(
                        sum(assignments[(c, d, s, subj_idx, f)]
                            for d in range(num_days)
                            for s in range(num_slots)
                            for f in range(num_faculties)) == hours_required
                    )
    
    # Constraint 4: Faculty-subject preferences (soft constraint via objective)
    # Build a preference score matrix
    preference_bonus = []
    
    for c, class_name in enumerate(classes):
        for f, faculty in enumerate(faculties if faculties else [{"name": "TBD"}]):
            faculty_name = faculty.get("name", "")
            faculty_prefs = faculty_choices.get(faculty_name, {})
            class_prefs = faculty_prefs.get(class_name, [])
            
            for subj_idx, subject in enumerate(subjects):
                subject_name = subject.get("name", "")
                
                # Check if this faculty prefers this subject for this class
                if subject_name in class_prefs or subject_name.lower() in [p.lower() for p in class_prefs]:
                    # Add bonus for preferred assignments
                    for d in range(num_days):
                        for s in range(num_slots):
                            preference_bonus.append(assignments[(c, d, s, subj_idx, f)] * 10)
    
    # Constraint 5: Ensure minimum coverage - each class should have some assignments
    for c in range(num_classes):
        # At least some slots should be filled (e.g., 50% of total)
        min_slots = (num_days * num_slots) // 2
        model.Add(
            sum(assignments[(c, d, s, subj, f)]
                for d in range(num_days)
                for s in range(num_slots)
                for subj in range(num_subjects)
                for f in range(num_faculties)) >= min_slots
        )
    
    # Constraint 6: Avoid same subject multiple times in a day (soft - at most 2)
    for c in range(num_classes):
        for d in range(num_days):
            for subj in range(num_subjects):
                model.Add(
                    sum(assignments[(c, d, s, subj, f)]
                        for s in range(num_slots)
                        for f in range(num_faculties)) <= 2
                )
    
    # ==================== OBJECTIVE ====================
    # Maximize preference satisfaction
    if preference_bonus:
        model.Maximize(sum(preference_bonus))
    
    # ==================== SOLVE ====================
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0  # Timeout after 30 seconds
    
    status = solver.Solve(model)
    
    # ==================== BUILD TIMETABLE ====================
    timetable = {}
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print(f"✅ CSP Solver found {'optimal' if status == cp_model.OPTIMAL else 'feasible'} solution")
        
        for c, class_name in enumerate(classes):
            timetable[class_name] = {}
            
            for d, day in enumerate(days):
                timetable[class_name][day] = {}
                
                for s, slot in enumerate(slots):
                    assigned = False
                    
                    for subj_idx, subject in enumerate(subjects):
                        for f_idx in range(num_faculties):
                            if solver.Value(assignments[(c, d, s, subj_idx, f_idx)]) == 1:
                                faculty_name = "TBD"
                                if faculties and f_idx < len(faculties):
                                    faculty_name = faculties[f_idx].get("name", "TBD")
                                
                                timetable[class_name][day][slot] = {
                                    "subject": subject.get("name", "Unknown"),
                                    "faculty": faculty_name,
                                    "room": rooms[0].get("room", "TBD") if rooms else "TBD"
                                }
                                assigned = True
                                break
                        if assigned:
                            break
                    
                    if not assigned:
                        timetable[class_name][day][slot] = None
    else:
        print(f"⚠️ CSP Solver could not find solution (status: {status}), using fallback")
        timetable = _generate_fallback_timetable(classes, subjects, faculties, days, slots)
    
    return timetable


def _generate_empty_timetable(classes):
    """Generate empty timetable structure"""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    slots = ["L1", "L2", "L3", "L4", "L5", "L6"]
    
    timetable = {}
    for class_name in classes:
        timetable[class_name] = {}
        for day in days:
            timetable[class_name][day] = {}
            for slot in slots:
                timetable[class_name][day][slot] = None
    
    return timetable


def _generate_fallback_timetable(classes, subjects, faculties, days, slots):
    """
    Fallback to simple round-robin assignment if CSP fails.
    This ensures we always return a valid timetable structure.
    """
    timetable = {}
    
    for class_name in classes:
        timetable[class_name] = {}
        subject_index = 0
        
        for day in days:
            timetable[class_name][day] = {}
            
            for slot in slots:
                if not subjects:
                    timetable[class_name][day][slot] = None
                    continue
                
                subject = subjects[subject_index % len(subjects)]
                faculty = faculties[subject_index % len(faculties)] if faculties else {"name": "TBD"}
                
                timetable[class_name][day][slot] = {
                    "subject": subject.get("name", "Unknown"),
                    "faculty": faculty.get("name", "TBD"),
                    "room": "TBD"
                }
                
                subject_index += 1
    
    return timetable


# For backward compatibility
def generate_timetable(data, config=None):
    """Wrapper function for backward compatibility"""
    return generate_timetable_csp(data, config)
