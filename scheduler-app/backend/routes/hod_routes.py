from services.auth_service import hash_password
import os
from dotenv import load_dotenv

load_dotenv()

USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if USE_SUPABASE:
    try:
        from storage.supabase_store import SupabaseStore
        USER_STORE = SupabaseStore()
    except Exception:
        USER_STORE = None
        USE_SUPABASE = False
else:
    USER_STORE = None


from flask import Blueprint, request, jsonify
from utils.auth_middleware import role_required
from services.timetable_service import run_scheduler

from services.data_service import (
    save_classes,
    save_faculties,
    save_rooms,
    get_all_data,
    save_timetable_config,
    get_timetable_config,
    save_batches,
    get_batches_by_class,
    save_subjects
)

hod_bp = Blueprint("hod", __name__)


@hod_bp.route("/get-data", methods=["GET"])
@role_required("hod")
def get_hod_data():
    """Fetch all saved data (classes, subjects, faculties, rooms, subjects_by_class, batches)"""
    data = get_all_data()
    batches_by_class = get_batches_by_class()

    return jsonify({
        "success": True,
        "data": {
            "classes": data.get("classes", []),
            "subjects": data.get("subjects", []),
            "subjects_by_class": data.get("subjects_by_class", {}),
            "faculties": data.get("faculties", []),
            "rooms": data.get("rooms", []),
            "batches": batches_by_class
        }
    })


@hod_bp.route("/save-data", methods=["POST"])
@role_required("hod")
def save_hod_data():
    """Save classes, faculties, rooms, and batches."""
    data = request.get_json()

    save_classes(data.get("classes", []))
    save_faculties(data.get("faculties", []))
    save_rooms(data.get("rooms", []))
    
    # Save batches for each class (batch names auto-generated with class prefix)
    batches_data = data.get("batches", {})  # {"FEA": 3, "SEA": 2}
    for class_name, batch_count in batches_data.items():
        save_batches(class_name, int(batch_count) if batch_count else 0)

    return jsonify({
        "success": True,
        "message": "Data saved successfully"
    })
    

@hod_bp.route("/save-timetable-config", methods=["POST"])
@role_required("hod")
def save_timetable_config_api():
    """Save timetable configuration (settings, lessons, faculty choices)"""
    data = request.get_json()

    save_timetable_config(data)

    return jsonify({
        "success": True,
        "message": "Timetable configuration saved successfully"
    })


@hod_bp.route("/save-subjects-for-class", methods=["POST"])
@role_required("hod")
def save_subjects_for_class():
    """Save subjects for a single class with type and duration. Saves to both subjects table and JSONB."""
    data = request.get_json()
    class_name = (data.get("class_name") or "").strip()
    subjects = data.get("subjects")
    if not class_name:
        return jsonify({"success": False, "message": "class_name is required"}), 400
    if not isinstance(subjects, list):
        return jsonify({"success": False, "message": "subjects must be an array"}), 400

    # Prepare subjects with type and duration_slots
    formatted_subjects = [
        {
            "name": (s.get("name") or "").strip(),
            "short": (s.get("short") or "").strip(),
            "type": s.get("type", "lecture"),
            "duration_slots": s.get("duration_slots", 1)
        }
        for s in subjects if (s.get("name") or "").strip()
    ]

    # 1. Save to subjects table (for database storage with type/duration)
    save_subjects(formatted_subjects)

    # 2. Save to timetable_config.subjects_by_class (for scheduler usage)
    config = get_timetable_config()
    sb = config.get("subjects_by_class") or {}
    sb[class_name] = formatted_subjects
    config["subjects_by_class"] = sb
    save_timetable_config(config)

    return jsonify({"success": True, "message": "Subjects saved for class"})


@hod_bp.route("/get-timetable-config", methods=["GET"])
@role_required("hod")
def get_timetable_config_api():
    """Get saved timetable configuration"""
    config = get_timetable_config()
    
    return jsonify({
        "success": True,
        "config": config
    })


@hod_bp.route("/generate-timetable", methods=["POST"])
@role_required("hod")
def generate_timetable_api():
    timetable = run_scheduler()

    return jsonify({
        "success": True,
        "timetable": timetable
    })


# ==================== USER MANAGEMENT ====================

@hod_bp.route("/users", methods=["GET"])
@role_required("hod")
def get_all_users():
    if not USE_SUPABASE or not USER_STORE:
        return jsonify({"success": False, "message": "User management requires database"}), 503
    users = USER_STORE.get_all_users()
    return jsonify({"success": True, "users": users})

@hod_bp.route("/users/create", methods=["POST"])
@role_required("hod")
def create_user():
    if not USE_SUPABASE or not USER_STORE:
        return jsonify({"success": False, "message": "User management requires database"}), 503
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    email = data.get("email")
    if not username or not password or not role:
        return jsonify({"success": False, "message": "Username, password, and role are required"}), 400
    valid_roles = ["hod", "faculty", "exam_control"]
    if role not in valid_roles:
        return jsonify({"success": False, "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"}), 400
    existing_user = USER_STORE.get_user_by_username(username)
    if existing_user:
        return jsonify({"success": False, "message": "Username already exists"}), 409
    password_hash = hash_password(password)
    user = USER_STORE.create_user(username, password_hash, role, email)
    if user:
        return jsonify({"success": True, "message": "User created successfully", "user": {"id": user["id"], "username": user["username"], "role": user["role"], "email": user.get("email")}}), 201
    return jsonify({"success": False, "message": "Failed to create user"}), 500

@hod_bp.route("/users/<int:user_id>", methods=["DELETE"])
@role_required("hod")
def delete_user(user_id):
    if not USE_SUPABASE or not USER_STORE:
        return jsonify({"success": False, "message": "User management requires database"}), 503
    current_user = request.current_user
    if current_user and current_user.get("user_id") == user_id:
        return jsonify({"success": False, "message": "Cannot delete your own account"}), 400
    try:
        from storage.supabase_store import supabase
        if supabase:
            supabase.table("users").delete().eq("id", user_id).execute()
            return jsonify({"success": True, "message": "User deleted successfully"})
        return jsonify({"success": False, "message": "Database connection failed"}), 503
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to delete user: {str(e)}"}), 500