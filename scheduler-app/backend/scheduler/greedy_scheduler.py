def generate_timetable(data):
    """
    data = {
        "classes": [...],
        "subjects": [...],
        "faculties": [...],
        "rooms": [...],
        "preferences": [...]
    }
    """

    timetable = {}

    classes = data.get("classes", [])
    subjects = data.get("subjects", [])
    faculties = data.get("faculties", [])

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    slots = ["L1", "L2", "L3", "L4", "L5", "L6"]

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
                faculty = faculties[subject_index % len(faculties)] if faculties else "TBD"

                timetable[class_name][day][slot] = {
                    "subject": subject.get("name"),
                    "faculty": faculty.get("name", "TBD")
                }

                subject_index += 1

    return timetable
