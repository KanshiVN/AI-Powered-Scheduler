from functools import wraps
from flask import request, jsonify
from services.auth_service import get_user_from_token


def role_required(required_role):
    """Decorator to require a specific role via JWT token"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get token from Authorization header
            auth_header = request.headers.get("Authorization")
            
            if not auth_header:
                return jsonify({
                    "success": False,
                    "message": "Missing authorization token"
                }), 401
            
            # Remove "Bearer " prefix if present
            token = auth_header
            if token.startswith("Bearer "):
                token = token[7:]
            
            # Verify token and get user info
            user_info = get_user_from_token(token)
            
            if not user_info:
                return jsonify({
                    "success": False,
                    "message": "Invalid or expired token"
                }), 401
            
            # Check role
            user_role = user_info.get("role")
            if user_role != required_role:
                return jsonify({
                    "success": False,
                    "message": f"Access denied. Required role: {required_role}"
                }), 403
            
            # Add user info to request context for use in route handlers
            request.current_user = user_info
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def token_required(func):
    """Decorator to require a valid JWT token (any role)"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return jsonify({
                "success": False,
                "message": "Missing authorization token"
            }), 401
        
        token = auth_header
        if token.startswith("Bearer "):
            token = token[7:]
        
        user_info = get_user_from_token(token)
        
        if not user_info:
            return jsonify({
                "success": False,
                "message": "Invalid or expired token"
            }), 401
        
        request.current_user = user_info
        return func(*args, **kwargs)
    return wrapper
