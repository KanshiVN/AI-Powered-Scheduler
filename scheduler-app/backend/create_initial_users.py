"""
Script to create initial users in the database.
Run this after setting up the users table in Supabase.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Check if Supabase is enabled
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if not USE_SUPABASE:
    print("❌ USE_SUPABASE must be set to 'true' in .env file")
    sys.exit(1)

from services.auth_service import hash_password
from storage.supabase_store import SupabaseStore

store = SupabaseStore()

# Initial users to create
users = [
    {"username": "hod", "password": "hod123", "role": "hod", "email": None},
    {"username": "faculty", "password": "faculty123", "role": "faculty", "email": None},
    {"username": "exam", "password": "exam123", "role": "exam_control", "email": None}
]

print("🔐 Creating initial users...\n")

for user in users:
    # Check if user already exists
    existing = store.get_user_by_username(user["username"])
    if existing:
        print(f"⚠️  User '{user['username']}' already exists, skipping...")
        continue
    
    # Hash password
    password_hash = hash_password(user["password"])
    
    # Create user
    result = store.create_user(
        username=user["username"],
        password_hash=password_hash,
        role=user["role"],
        email=user["email"]
    )
    
    if result:
        print(f"✅ Created user: {user['username']} (role: {user['role']})")
    else:
        print(f"❌ Failed to create user: {user['username']}")

print("\n✨ Done! You can now login with these credentials.")
print("\nDefault credentials:")
print("  HOD: username='hod', password='hod123'")
print("  Faculty: username='faculty', password='faculty123'")
print("  Exam Control: username='exam', password='exam123'")
print("\n⚠️  IMPORTANT: Change these passwords in production!")
