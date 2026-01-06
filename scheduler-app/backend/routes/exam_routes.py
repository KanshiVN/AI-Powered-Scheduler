from flask import Blueprint, jsonify
from utils.auth_middleware import role_required

exam_bp = Blueprint("exam", __name__)


@exam_bp.route("/dashboard", methods=["GET"])
@role_required("exam_control")
def exam_dashboard():
    return jsonify({
        "success": True,
        "message": "Welcome Exam Control"
    })
