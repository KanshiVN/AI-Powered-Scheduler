from flask import Blueprint, jsonify
from services.timetable_service import get_timetable
from scheduler.utils import validate_timetable, get_faculty_timetable

common_bp = Blueprint("common", __name__)


@common_bp.route("/timetable", methods=["GET"])
def fetch_full_timetable():
    timetable = get_timetable()

    if not timetable:
        return jsonify({
            "success": False,
            "message": "No timetable generated yet"
        }), 404

    return jsonify({
        "success": True,
        "timetable": timetable
    })


@common_bp.route("/timetable/classes", methods=["GET"])
def get_available_classes():
    """Get list of classes that have timetables generated"""
    timetable = get_timetable()

    if not timetable:
        return jsonify({
            "success": False,
            "message": "No timetable generated yet",
            "classes": []
        }), 404

    # Extract class names from timetable keys
    classes = list(timetable.keys()) if isinstance(timetable, dict) else []

    return jsonify({
        "success": True,
        "classes": classes
    })


@common_bp.route("/timetable/validate", methods=["GET"])
def validate_current_timetable():
    """Validate the current timetable and return any conflicts/warnings"""
    timetable = get_timetable()

    if not timetable:
        return jsonify({
            "success": False,
            "message": "No timetable generated yet"
        }), 404

    validation = validate_timetable(timetable)

    return jsonify({
        "success": True,
        "validation": validation
    })


@common_bp.route("/timetable/faculty/<faculty_name>", methods=["GET"])
def get_faculty_schedule(faculty_name):
    """Get timetable for a specific faculty member"""
    timetable = get_timetable()

    if not timetable:
        return jsonify({
            "success": False,
            "message": "No timetable generated yet"
        }), 404

    faculty_timetable = get_faculty_timetable(timetable, faculty_name)

    return jsonify({
        "success": True,
        "faculty": faculty_name,
        "timetable": faculty_timetable
    })
