from flask import Blueprint, jsonify, request
from services.timetable_service import get_timetable
from utils.auth_middleware import role_required

faculty_bp = Blueprint("faculty", __name__)


@faculty_bp.route("/timetable", methods=["GET"])
@role_required("faculty")
def get_faculty_timetable():
    """
    Return timetable filtered for the currently logged-in faculty.
    Priority:
      1) X-Username header (explicit override)
      2) Username from JWT (request.current_user)
    """
    faculty_name = (request.headers.get("X-Username") or "").strip()

    # Fallback to JWT username if header not provided
    if not faculty_name:
        user = getattr(request, "current_user", None)
        if user:
            faculty_name = (user.get("username") or "").strip()

    if not faculty_name:
        return jsonify({
            "success": False,
            "message": "Faculty identity not provided"
        }), 400

    timetable = get_timetable()

    if not timetable:
        return jsonify({
            "success": False,
            "message": "No timetable available"
        }), 404

    faculty_view = {}

    for class_name, class_data in timetable.items():
        for day, slots in class_data.items():
            for slot, entry in slots.items():
                if entry and entry.get("faculty", "").lower() == faculty_name.lower():
                    faculty_view.setdefault(day, {})
                    faculty_view[day][slot] = {
                        "subject": entry.get("subject", ""),
                        "class": class_name
                    }

    return jsonify({
        "success": True,
        "timetable": faculty_view
    })
