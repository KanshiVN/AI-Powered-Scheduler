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


def _union_subjects_from_by_class(subjects_by_class):
    """Build a deduplicated list of all subjects from subjects_by_class (for CSP/Generate)."""
    seen = set()
    out = []
    for lst in (subjects_by_class or {}).values():
        for s in lst or []:
            n = (s.get("name") or "").strip()
            if n and n not in seen:
                seen.add(n)
                out.append({"name": n, "short": (s.get("short") or "").strip()})
    return out


def get_all_data():
    if USE_SUPABASE and STORE:
        return STORE.get_all_data()
    # In-memory: build subjects and subjects_by_class from timetable_config
    cfg = DATA_STORE.get("timetable_config") or {}
    sb = cfg.get("subjects_by_class") or {}
    result = dict(DATA_STORE)
    result["subjects"] = _union_subjects_from_by_class(sb)
    result["subjects_by_class"] = sb
    return result


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
    cfg = DATA_STORE.get("timetable_config") or {}
    if "subjects_by_class" not in cfg:
        cfg = dict(cfg)
        cfg["subjects_by_class"] = {}
    return cfg


# ==================== BATCH MANAGEMENT ====================

def save_batches(class_name, batch_count):
    """Save batches for a class with full class name as prefix"""
    if USE_SUPABASE and STORE:
        return STORE.save_batches(class_name, batch_count)
    else:
        # In-memory: generate batch names with full class name
        batches = [f"{class_name}{i+1}" for i in range(batch_count)]
        DATA_STORE["batches"][class_name] = batches
        return True


def get_batches(class_name=None):
    """Get batches for a specific class or all batches"""
    if USE_SUPABASE and STORE:
        return STORE.get_batches(class_name)
    else:
        if class_name:
            return DATA_STORE["batches"].get(class_name, [])
        return DATA_STORE["batches"]


def get_batches_by_class():
    """Get batches grouped by class"""
    if USE_SUPABASE and STORE:
        return STORE.get_all_batches_with_classes()
    else:
        return DATA_STORE["batches"]
