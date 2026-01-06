from scheduler.greedy_scheduler import generate_timetable
from storage.in_memory_store import DATA_STORE


def run_scheduler():
    data = {
        "classes": DATA_STORE["classes"],
        "subjects": DATA_STORE["subjects"],
        "faculties": DATA_STORE["faculties"],
        "rooms": DATA_STORE["rooms"],
        "preferences": DATA_STORE["faculty_preferences"]
    }

    timetable = generate_timetable(data)

    # 👇 STORE CENTRALLY
    DATA_STORE["timetable"] = timetable

    return timetable


def get_timetable():
    return DATA_STORE["timetable"]