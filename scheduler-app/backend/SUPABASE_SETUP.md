# Supabase Setup Guide

This guide will help you set up Supabase as your database for the scheduler app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - **Name**: scheduler-app (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region
5. Click "Create new project"
6. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    short TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculties table
CREATE TABLE IF NOT EXISTS faculties (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    short TEXT,
    position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    room TEXT NOT NULL,
    type TEXT DEFAULT 'classroom',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timetable_config table
CREATE TABLE IF NOT EXISTS timetable_config (
    id BIGSERIAL PRIMARY KEY,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id BIGSERIAL PRIMARY KEY,
    timetable_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty_preferences table (optional, for future use)
CREATE TABLE IF NOT EXISTS faculty_preferences (
    id BIGSERIAL PRIMARY KEY,
    faculty_name TEXT NOT NULL,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-key-here
   USE_SUPABASE=true
   
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ```

## Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 6: Test the Connection

Run your Flask app:
```bash
python app.py
```

You should see:
- `✅ Using Supabase for data storage` if Supabase is configured correctly
- `📝 Using in-memory storage` if Supabase is not enabled

## Troubleshooting

### Error: "SUPABASE_URL and SUPABASE_KEY must be set"
- Make sure your `.env` file exists and has the correct values
- Check that `USE_SUPABASE=true` is set

### Error: "Failed to initialize Supabase"
- Verify your Supabase URL and key are correct
- Check your internet connection
- Make sure your Supabase project is active

### Data not persisting
- Check that tables were created successfully
- Verify you're using `USE_SUPABASE=true`
- Check Supabase dashboard → Table Editor to see if data is being saved

## Switching Back to In-Memory Storage

If you want to switch back to in-memory storage temporarily:
1. Set `USE_SUPABASE=false` in `.env`
2. Restart your Flask app

## Benefits of Using Supabase

✅ **Persistent Storage**: Data survives server restarts  
✅ **Real-time Updates**: Can add real-time features later  
✅ **Authentication**: Built-in auth system (can replace current auth)  
✅ **Scalable**: Handles growth automatically  
✅ **Free Tier**: Generous free tier for development  
✅ **PostgreSQL**: Full SQL database power  

## Next Steps

- [ ] Set up Row Level Security (RLS) policies for multi-tenant support
- [ ] Implement Supabase Auth to replace current authentication
- [ ] Add real-time subscriptions for live updates
- [ ] Set up database backups
