from scheduler.csp_scheduler import generate_timetable_csp
from services.data_service import get_all_data, get_timetable_config
import os
from dotenv import load_dotenv

load_dotenv()

USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if USE_SUPABASE:
    try:
        from storage.supabase_store import SupabaseStore
        STORE = SupabaseStore()
    except Exception:
        from storage.in_memory_store import DATA_STORE
        STORE = None
        USE_SUPABASE = False
else:
    from storage.in_memory_store import DATA_STORE
    STORE = None


def run_scheduler():
    """
    Run the CSP scheduler to generate an optimized timetable.
    Uses configuration from timetable_config (lessons, faculty choices, etc.)
    """
    all_data = get_all_data()
    config = get_timetable_config()
    
    data = {
        "classes": all_data.get("classes", []),
        "subjects": all_data.get("subjects", []),
        "faculties": all_data.get("faculties", []),
        "rooms": all_data.get("rooms", []),
        "preferences": all_data.get("faculty_preferences", [])
    }
    
    print("🔄 Running CSP Scheduler...")
    print(f"   Classes: {len(data['classes'])}")
    print(f"   Subjects: {len(data['subjects'])}")
    print(f"   Faculties: {len(data['faculties'])}")
    print(f"   Rooms: {len(data['rooms'])}")
    
    # Generate timetable using CSP solver with config
    timetable = generate_timetable_csp(data, config)

    # 👇 STORE CENTRALLY
    if USE_SUPABASE and STORE:
        STORE.save_timetable(timetable)
    else:
        DATA_STORE["timetable"] = timetable
    
    print("✅ Timetable generated and saved")
    return timetable


def get_timetable():
    if USE_SUPABASE and STORE:
        return STORE.get_timetable()
    else:
        return DATA_STORE.get("timetable")