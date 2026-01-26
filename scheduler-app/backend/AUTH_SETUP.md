# Authentication Setup Guide

This guide explains how to set up secure authentication for the scheduler app using Supabase and JWT tokens.

## Database Schema

You need to create a `users` table in your Supabase database. Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('hod', 'faculty', 'exam_control')),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data (if using Supabase Auth)
-- Note: Since we're using custom auth, you may want to disable RLS
-- or create appropriate policies based on your needs
```

## Initial User Setup

After creating the table, you can insert initial users. **IMPORTANT**: Passwords must be hashed using bcrypt. You can use the Python script below or the registration endpoint.

### Option 1: Using Python Script

Create a file `create_initial_users.py` in the backend directory:

```python
from services.auth_service import hash_password
from storage.supabase_store import SupabaseStore

store = SupabaseStore()

# Create initial users
users = [
    {"username": "hod", "password": "hod123", "role": "hod"},
    {"username": "faculty", "password": "faculty123", "role": "faculty"},
    {"username": "exam", "password": "exam123", "role": "exam_control"}
]

for user in users:
    password_hash = hash_password(user["password"])
    result = store.create_user(
        username=user["username"],
        password_hash=password_hash,
        role=user["role"]
    )
    if result:
        print(f"✅ Created user: {user['username']} ({user['role']})")
    else:
        print(f"❌ Failed to create user: {user['username']}")
```

Run it:
```bash
cd backend
python create_initial_users.py
```

### Option 2: Using Registration Endpoint

You can use the `/api/auth/register` endpoint to create users:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hod",
    "password": "hod123",
    "role": "hod"
  }'
```

**Note**: In production, you should restrict the registration endpoint to admin users only.

## Environment Variables

Make sure your `.env` file includes:

```env
# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production-use-a-long-random-string
```

**Important**: 
- Generate a strong random secret key for production
- Never commit your `.env` file to version control
- Use different keys for development and production

### Generating a Secure JWT Secret Key

You can generate a secure random key using Python:

```python
import secrets
print(secrets.token_urlsafe(32))
```

Or using OpenSSL:
```bash
openssl rand -base64 32
```

## How Authentication Works

1. **Login**: User submits username and password
2. **Verification**: Backend verifies password against bcrypt hash in database
3. **Token Generation**: If valid, backend generates a JWT token containing:
   - User ID
   - Username
   - Role
   - Expiration time (24 hours)
4. **Token Storage**: Frontend stores token in `localStorage`
5. **API Requests**: Frontend sends token in `Authorization: Bearer <token>` header
6. **Token Validation**: Backend validates token on each protected route

## Security Features

✅ **Password Hashing**: All passwords are hashed using bcrypt (salt + hash)
✅ **JWT Tokens**: Secure token-based authentication
✅ **Token Expiration**: Tokens expire after 24 hours
✅ **Role-Based Access Control**: Routes protected by role requirements
✅ **No Hardcoded Credentials**: All users stored in database

## API Endpoints

### POST `/api/auth/login`
Login and get JWT token.

**Request:**
```json
{
  "username": "hod",
  "password": "hod123",
  "role": "hod"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "username": "hod",
  "role": "hod",
  "user_id": 1
}
```

### POST `/api/auth/register`
Register a new user (restrict in production).

**Request:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "faculty",
  "email": "user@example.com"
}
```

### GET `/api/auth/verify`
Verify if a token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

## Frontend Changes

The frontend now:
- Stores JWT token in `localStorage` as `authToken`
- Sends token in `Authorization: Bearer <token>` header
- Uses `getAuthHeaders()` helper function from `main.js`
- Automatically redirects to login if token is missing

## Troubleshooting

### "Authentication requires database"
- Make sure `USE_SUPABASE=true` in your `.env` file
- Verify Supabase connection is working

### "Invalid or expired token"
- Token may have expired (24 hour limit)
- User needs to login again

### "Access denied for this role"
- User's role doesn't match required role for the endpoint
- Check user's role in database

### Password not working
- Make sure password was hashed when user was created
- Verify password hash in database matches bcrypt format
