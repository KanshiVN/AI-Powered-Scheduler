from flask import Blueprint, request, jsonify
from utils.auth_middleware import role_required
from services.timetable_service import run_scheduler

from services.data_service import (
    save_classes,
    save_subjects,
    save_faculties,
    save_rooms
)

hod_bp = Blueprint("hod", __name__)


@hod_bp.route("/save-data", methods=["POST"])
@role_required("hod")
def save_hod_data():
    data = request.get_json()

    save_classes(data.get("classes", []))
    save_subjects(data.get("subjects", []))
    save_faculties(data.get("faculties", []))
    save_rooms(data.get("rooms", []))

    return jsonify({
        "success": True,
        "message": "Data saved successfully"
    })
    

@hod_bp.route("/generate-timetable", methods=["POST"])
@role_required("hod")
def generate_timetable_api():
    timetable = run_scheduler()

    return {
        "success": True,
        "timetable": timetable
    }