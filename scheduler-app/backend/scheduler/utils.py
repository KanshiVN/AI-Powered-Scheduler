"""
Utility functions for timetable validation and analysis
"""


def validate_timetable(timetable, faculties=None):
    """
    Validate a generated timetable and check for conflicts.
    
    Returns:
        dict: {
            "valid": bool,
            "conflicts": [...],
            "warnings": [...],
            "stats": {...}
        }
    """
    conflicts = []
    warnings = []
    stats = {
        "total_slots": 0,
        "filled_slots": 0,
        "empty_slots": 0,
        "classes": 0,
        "faculty_assignments": {}
    }
    
    if not timetable:
        return {
            "valid": False,
            "conflicts": ["No timetable data"],
            "warnings": [],
            "stats": stats
        }
    
    # Track faculty assignments per time slot
    faculty_schedule = {}  # {(day, slot): {faculty: class}}
    
    stats["classes"] = len(timetable)
    
    for class_name, class_data in timetable.items():
        for day, day_data in class_data.items():
            for slot, entry in day_data.items():
                stats["total_slots"] += 1
                
                if entry is None:
                    stats["empty_slots"] += 1
                    continue
                
                stats["filled_slots"] += 1
                
                faculty = entry.get("faculty", "TBD")
                subject = entry.get("subject", "Unknown")
                
                # Track faculty assignments
                if faculty not in stats["faculty_assignments"]:
                    stats["faculty_assignments"][faculty] = 0
                stats["faculty_assignments"][faculty] += 1
                
                # Check for faculty conflicts (same faculty, same time, different class)
                time_key = (day, slot)
                if time_key not in faculty_schedule:
                    faculty_schedule[time_key] = {}
                
                if faculty in faculty_schedule[time_key]:
                    other_class = faculty_schedule[time_key][faculty]
                    if other_class != class_name and faculty != "TBD":
                        conflicts.append({
                            "type": "faculty_conflict",
                            "faculty": faculty,
                            "day": day,
                            "slot": slot,
                            "classes": [class_name, other_class]
                        })
                else:
                    faculty_schedule[time_key][faculty] = class_name
    
    # Check for uneven workload distribution
    if stats["faculty_assignments"]:
        assignments = list(stats["faculty_assignments"].values())
        avg = sum(assignments) / len(assignments)
        for faculty, count in stats["faculty_assignments"].items():
            if faculty != "TBD" and count > avg * 1.5:
                warnings.append({
                    "type": "uneven_workload",
                    "faculty": faculty,
                    "assignments": count,
                    "average": round(avg, 1)
                })
    
    # Check fill rate
    if stats["total_slots"] > 0:
        fill_rate = stats["filled_slots"] / stats["total_slots"]
        stats["fill_rate"] = round(fill_rate * 100, 1)
        
        if fill_rate < 0.5:
            warnings.append({
                "type": "low_fill_rate",
                "fill_rate": stats["fill_rate"],
                "message": "Less than 50% of slots are filled"
            })
    
    return {
        "valid": len(conflicts) == 0,
        "conflicts": conflicts,
        "warnings": warnings,
        "stats": stats
    }


def get_faculty_timetable(full_timetable, faculty_name):
    """
    Extract a specific faculty's timetable from the full timetable.
    
    Returns:
        dict: {day: {slot: {subject, class}}}
    """
    faculty_view = {}
    
    if not full_timetable:
        return faculty_view
    
    for class_name, class_data in full_timetable.items():
        for day, day_data in class_data.items():
            for slot, entry in day_data.items():
                if entry and entry.get("faculty", "").lower() == faculty_name.lower():
                    if day not in faculty_view:
                        faculty_view[day] = {}
                    
                    faculty_view[day][slot] = {
                        "subject": entry.get("subject", "Unknown"),
                        "class": class_name,
                        "room": entry.get("room", "TBD")
                    }
    
    return faculty_view


def get_room_timetable(full_timetable, room_name):
    """
    Extract a specific room's timetable from the full timetable.
    
    Returns:
        dict: {day: {slot: {subject, class, faculty}}}
    """
    room_view = {}
    
    if not full_timetable:
        return room_view
    
    for class_name, class_data in full_timetable.items():
        for day, day_data in class_data.items():
            for slot, entry in day_data.items():
                if entry and entry.get("room", "").lower() == room_name.lower():
                    if day not in room_view:
                        room_view[day] = {}
                    
                    room_view[day][slot] = {
                        "subject": entry.get("subject", "Unknown"),
                        "class": class_name,
                        "faculty": entry.get("faculty", "TBD")
                    }
    
    return room_view


def count_subject_hours(timetable, class_name, subject_name):
    """
    Count how many hours a subject is scheduled for a specific class.
    """
    count = 0
    
    if not timetable or class_name not in timetable:
        return count
    
    class_data = timetable[class_name]
    
    for day, day_data in class_data.items():
        for slot, entry in day_data.items():
            if entry and entry.get("subject", "").lower() == subject_name.lower():
                count += 1
    
    return count
