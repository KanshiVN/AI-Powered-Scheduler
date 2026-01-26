from flask import Blueprint, request, jsonify
from services.auth_service import hash_password, verify_password, generate_token
import os
from dotenv import load_dotenv

load_dotenv()

USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if USE_SUPABASE:
    try:
        from storage.supabase_store import SupabaseStore
        STORE = SupabaseStore()
    except Exception:
        STORE = None
        USE_SUPABASE = False
else:
    STORE = None

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return JWT token"""
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    # Get user from database
    if USE_SUPABASE and STORE:
        user = STORE.get_user_by_username(username)
        
        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid credentials"
            }), 401
        
        # Verify password
        if not verify_password(password, user.get("password_hash", "")):
            return jsonify({
                "success": False,
                "message": "Invalid credentials"
            }), 401
        
        # Check role if provided
        if role and user.get("role") != role:
            return jsonify({
                "success": False,
                "message": "Invalid role for this user"
            }), 403
        
        # Generate JWT token
        token = generate_token(
            user_id=user["id"],
            username=user["username"],
            role=user["role"]
        )
        
        return jsonify({
            "success": True,
            "token": token,
            "username": user["username"],
            "role": user["role"],
            "user_id": user["id"]
        })
    else:
        # Fallback: In-memory storage not supported for auth
        return jsonify({
            "success": False,
            "message": "Authentication requires database. Please enable Supabase."
        }), 503


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user (admin/HOD only in production)"""
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    email = data.get("email")

    if not username or not password or not role:
        return jsonify({
            "success": False,
            "message": "Username, password, and role are required"
        }), 400

    # Validate role
    valid_roles = ["hod", "faculty", "exam_control"]
    if role not in valid_roles:
        return jsonify({
            "success": False,
            "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        }), 400

    if USE_SUPABASE and STORE:
        # Check if user already exists
        existing_user = STORE.get_user_by_username(username)
        if existing_user:
            return jsonify({
                "success": False,
                "message": "Username already exists"
            }), 409

        # Hash password
        password_hash = hash_password(password)

        # Create user
        user = STORE.create_user(username, password_hash, role, email)

        if user:
            # Generate token for immediate login
            token = generate_token(
                user_id=user["id"],
                username=user["username"],
                role=user["role"]
            )

            return jsonify({
                "success": True,
                "message": "User registered successfully",
                "token": token,
                "username": user["username"],
                "role": user["role"],
                "user_id": user["id"]
            }), 201
        else:
            return jsonify({
                "success": False,
                "message": "Failed to create user"
            }), 500
    else:
        return jsonify({
            "success": False,
            "message": "Registration requires database. Please enable Supabase."
        }), 503


@auth_bp.route("/verify", methods=["GET"])
def verify_token():
    """Verify if a JWT token is valid"""
    from services.auth_service import get_user_from_token
    
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({
            "success": False,
            "message": "No token provided"
        }), 401
    
    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    user_info = get_user_from_token(token)
    
    if user_info:
        return jsonify({
            "success": True,
            "user": user_info
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid or expired token"
        }), 401
