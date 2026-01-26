import os
from dotenv import load_dotenv

load_dotenv()

# Use Supabase if configured, otherwise fall back to in-memory storage
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if USE_SUPABASE:
    try:
        from storage.supabase_store import SupabaseStore, supabase
        if supabase is None:
            raise ValueError("Supabase client not initialized - check your .env file")
        STORE = SupabaseStore()
        print("✅ Using Supabase for data storage")
    except Exception as e:
        print(f"⚠️ Failed to initialize Supabase, falling back to in-memory storage: {e}")
        print(f"   Make sure:")
        print(f"   1. .env file exists in backend/ directory")
        print(f"   2. SUPABASE_URL and SUPABASE_KEY are set correctly")
        print(f"   3. Database tables are created (see SUPABASE_SETUP.md)")
        from storage.in_memory_store import DATA_STORE
        STORE = None
        USE_SUPABASE = False
else:
    from storage.in_memory_store import DATA_STORE
    STORE = None
    print("📝 Using in-memory storage (set USE_SUPABASE=true to use Supabase)")


def save_classes(classes):
    if USE_SUPABASE and STORE:
        return STORE.save_classes(classes)
    else:
        DATA_STORE["classes"] = classes
        return True


def save_subjects(subjects):
    if USE_SUPABASE and STORE:
        return STORE.save_subjects(subjects)
    else:
        DATA_STORE["subjects"] = subjects
        return True


def save_faculties(faculties):
    if USE_SUPABASE and STORE:
        return STORE.save_faculties(faculties)
    else:
        DATA_STORE["faculties"] = faculties
        return True


def save_rooms(rooms):
    if USE_SUPABASE and STORE:
        return STORE.save_rooms(rooms)
    else:
        DATA_STORE["rooms"] = rooms
        return True


def get_all_data():
    if USE_SUPABASE and STORE:
        return STORE.get_all_data()
    else:
        return DATA_STORE


def save_timetable_config(config):
    """Save timetable configuration (lectures per day, lesson hours, faculty choices)"""
    if USE_SUPABASE and STORE:
        return STORE.save_timetable_config(config)
    else:
        DATA_STORE["timetable_config"] = config
        return True


def get_timetable_config():
    """Get timetable configuration"""
    if USE_SUPABASE and STORE:
        return STORE.get_timetable_config()
    else:
        return DATA_STORE.get("timetable_config", {
            "lectures_per_day": 6,
            "lesson_hours": {},
            "faculty_choices": {}
        })
