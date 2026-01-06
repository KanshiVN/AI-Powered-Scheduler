from storage.in_memory_store import DATA_STORE


def save_classes(classes):
    DATA_STORE["classes"] = classes
    return True


def save_subjects(subjects):
    DATA_STORE["subjects"] = subjects
    return True


def save_faculties(faculties):
    DATA_STORE["faculties"] = faculties
    return True


def save_rooms(rooms):
    DATA_STORE["rooms"] = rooms
    return True


def get_all_data():
    return DATA_STORE
