"""
Supabase storage implementation for scheduler app
Replaces in-memory storage with persistent database
"""
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import json

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Supabase client initialized: {SUPABASE_URL[:30]}...")
    except Exception as e:
        print(f"⚠️ Failed to create Supabase client: {e}")
        supabase = None
else:
    print("⚠️ SUPABASE_URL or SUPABASE_KEY not found in environment variables")


class SupabaseStore:
    """Supabase database storage implementation"""
    
    # Table names
    TABLES = {
        "classes": "classes",
        "subjects": "subjects",
        "faculties": "faculties",
        "rooms": "rooms",
        "faculty_preferences": "faculty_preferences",
        "timetable_config": "timetable_config",
        "timetable": "timetables",
        "users": "users"
    }
    
    @staticmethod
    def save_classes(classes):
        """Save classes to database"""
        if not supabase:
            return False
        try:
            # Delete all existing classes
            supabase.table(SupabaseStore.TABLES["classes"]).delete().neq("id", 0).execute()
            
            # Insert new classes
            if classes:
                data = [{"name": cls} for cls in classes]
                supabase.table(SupabaseStore.TABLES["classes"]).insert(data).execute()
            return True
        except Exception as e:
            print(f"❌ Error saving classes: {e}")
            print(f"   Hint: Make sure the '{SupabaseStore.TABLES['classes']}' table exists in Supabase")
            return False
    
    @staticmethod
    def get_classes():
        """Get all classes from database"""
        try:
            response = supabase.table(SupabaseStore.TABLES["classes"]).select("*").execute()
            return [row["name"] for row in response.data]
        except Exception as e:
            print(f"Error getting classes: {e}")
            return []
    
    @staticmethod
    def save_subjects(subjects):
        """Save subjects to database"""
        try:
            # Delete all existing subjects
            supabase.table(SupabaseStore.TABLES["subjects"]).delete().neq("id", 0).execute()
            
            # Insert new subjects
            if subjects:
                data = [{"name": subj.get("name", ""), "short": subj.get("short", "")} for subj in subjects]
                supabase.table(SupabaseStore.TABLES["subjects"]).insert(data).execute()
            return True
        except Exception as e:
            print(f"Error saving subjects: {e}")
            return False
    
    @staticmethod
    def get_subjects():
        """Get all subjects from database"""
        try:
            response = supabase.table(SupabaseStore.TABLES["subjects"]).select("*").execute()
            return [{"name": row["name"], "short": row.get("short", "")} for row in response.data]
        except Exception as e:
            print(f"Error getting subjects: {e}")
            return []
    
    @staticmethod
    def save_faculties(faculties):
        """Save faculties to database"""
        try:
            # Delete all existing faculties
            supabase.table(SupabaseStore.TABLES["faculties"]).delete().neq("id", 0).execute()
            
            # Insert new faculties
            if faculties:
                data = [
                    {
                        "name": fac.get("name", ""),
                        "short": fac.get("short", ""),
                        "position": fac.get("position", "")
                    }
                    for fac in faculties
                ]
                supabase.table(SupabaseStore.TABLES["faculties"]).insert(data).execute()
            return True
        except Exception as e:
            print(f"Error saving faculties: {e}")
            return False
    
    @staticmethod
    def get_faculties():
        """Get all faculties from database"""
        try:
            response = supabase.table(SupabaseStore.TABLES["faculties"]).select("*").execute()
            return [
                {
                    "name": row["name"],
                    "short": row.get("short", ""),
                    "position": row.get("position", "")
                }
                for row in response.data
            ]
        except Exception as e:
            print(f"Error getting faculties: {e}")
            return []
    
    @staticmethod
    def save_rooms(rooms):
        """Save rooms to database"""
        try:
            # Delete all existing rooms
            supabase.table(SupabaseStore.TABLES["rooms"]).delete().neq("id", 0).execute()
            
            # Insert new rooms
            if rooms:
                data = [
                    {
                        "room": room.get("room", ""),
                        "type": room.get("type", "classroom")
                    }
                    for room in rooms
                ]
                supabase.table(SupabaseStore.TABLES["rooms"]).insert(data).execute()
            return True
        except Exception as e:
            print(f"Error saving rooms: {e}")
            return False
    
    @staticmethod
    def get_rooms():
        """Get all rooms from database"""
        try:
            response = supabase.table(SupabaseStore.TABLES["rooms"]).select("*").execute()
            return [
                {
                    "room": row["room"],
                    "type": row.get("type", "classroom")
                }
                for row in response.data
            ]
        except Exception as e:
            print(f"Error getting rooms: {e}")
            return []
    
    @staticmethod
    def save_timetable_config(config):
        """Save timetable configuration"""
        try:
            # Delete existing config
            supabase.table(SupabaseStore.TABLES["timetable_config"]).delete().neq("id", 0).execute()
            
            # Insert new config
            supabase.table(SupabaseStore.TABLES["timetable_config"]).insert({
                "config": json.dumps(config)
            }).execute()
            return True
        except Exception as e:
            print(f"Error saving timetable config: {e}")
            return False
    
    @staticmethod
    def get_timetable_config():
        """Get timetable configuration"""
        try:
            response = supabase.table(SupabaseStore.TABLES["timetable_config"]).select("*").limit(1).execute()
            if response.data:
                return json.loads(response.data[0]["config"])
            return {
                "lectures_per_day": 6,
                "lesson_hours": {},
                "faculty_choices": {}
            }
        except Exception as e:
            print(f"Error getting timetable config: {e}")
            return {
                "lectures_per_day": 6,
                "lesson_hours": {},
                "faculty_choices": {}
            }
    
    @staticmethod
    def save_timetable(timetable):
        """Save generated timetable"""
        try:
            # Delete existing timetables
            supabase.table(SupabaseStore.TABLES["timetable"]).delete().neq("id", 0).execute()
            
            # Insert new timetable
            supabase.table(SupabaseStore.TABLES["timetable"]).insert({
                "timetable_data": json.dumps(timetable)
            }).execute()
            return True
        except Exception as e:
            print(f"Error saving timetable: {e}")
            return False
    
    @staticmethod
    def get_timetable():
        """Get generated timetable"""
        try:
            response = supabase.table(SupabaseStore.TABLES["timetable"]).select("*").limit(1).execute()
            if response.data:
                return json.loads(response.data[0]["timetable_data"])
            return None
        except Exception as e:
            print(f"Error getting timetable: {e}")
            return None
    
    @staticmethod
    def get_all_data():
        """Get all data (for compatibility with existing code)"""
        return {
            "classes": SupabaseStore.get_classes(),
            "subjects": SupabaseStore.get_subjects(),
            "faculties": SupabaseStore.get_faculties(),
            "rooms": SupabaseStore.get_rooms(),
            "faculty_preferences": [],  # TODO: Implement if needed
            "timetable_config": SupabaseStore.get_timetable_config(),
            "timetable": SupabaseStore.get_timetable()
        }
    
    # ==================== USER MANAGEMENT ====================
    
    @staticmethod
    def create_user(username: str, password_hash: str, role: str, email: str = None):
        """Create a new user in the database"""
        if not supabase:
            return None
        try:
            data = {
                "username": username,
                "password_hash": password_hash,
                "role": role
            }
            if email:
                data["email"] = email
            
            response = supabase.table(SupabaseStore.TABLES["users"]).insert(data).execute()
            if response.data:
                user = response.data[0]
                # Don't return password hash
                return {
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"],
                    "email": user.get("email")
                }
            return None
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            return None
    
    @staticmethod
    def get_user_by_username(username: str):
        """Get user by username"""
        if not supabase:
            return None
        try:
            response = supabase.table(SupabaseStore.TABLES["users"]).select("*").eq("username", username).limit(1).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    @staticmethod
    def get_user_by_id(user_id: int):
        """Get user by ID"""
        if not supabase:
            return None
        try:
            response = supabase.table(SupabaseStore.TABLES["users"]).select("*").eq("id", user_id).limit(1).execute()
            if response.data:
                user = response.data[0]
                # Don't return password hash
                return {
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"],
                    "email": user.get("email")
                }
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    @staticmethod
    def update_user_password(user_id: int, new_password_hash: str):
        """Update user password"""
        if not supabase:
            return False
        try:
            supabase.table(SupabaseStore.TABLES["users"]).update({
                "password_hash": new_password_hash
            }).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating password: {e}")
            return False
    
    @staticmethod
    def get_all_users():
        """Get all users (for admin purposes)"""
        if not supabase:
            return []
        try:
            response = supabase.table(SupabaseStore.TABLES["users"]).select("id, username, role, email, created_at").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"Error getting users: {e}")
            return []
