from flask import Blueprint, request, jsonify
from services.data_service import DATA_STORE
auth_bp = Blueprint("auth", __name__)

# Temporary users (NO DATABASE YET)
USERS = {
    "hod": {
        "username": "hod",
        "password": "hod123"
    },
    "faculty": {
        "username": "faculty",
        "password": "faculty123"
    },
    "exam_control": {
        "username": "exam",
        "password": "exam123"
    }
}


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({
            "success": False,
            "message": "Missing login fields"
        }), 400

    user = USERS.get(role)

    if not user:
        return jsonify({
            "success": False,
            "message": "Invalid role"
        }), 401

    if user["username"] == username and user["password"] == password:
        return jsonify({
            "success": True,
            "username": username,
            "role": role
        })

    return jsonify({
        "success": False,
        "message": "Invalid credentials"
    }), 401
