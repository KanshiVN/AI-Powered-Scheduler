from flask import Blueprint, jsonify
from services.timetable_service import get_timetable

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
