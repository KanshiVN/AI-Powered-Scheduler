from functools import wraps
from flask import request, jsonify


def role_required(required_role):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get role from request headers
            user_role = request.headers.get("X-User-Role")

            if not user_role:
                return jsonify({
                    "success": False,
                    "message": "Missing role in request"
                }), 401

            if user_role != required_role:
                return jsonify({
                    "success": False,
                    "message": "Access denied for this role"
                }), 403

            return func(*args, **kwargs)
        return wrapper
    return decorator
