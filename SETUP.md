# SigmaLog Backend Setup Guide

This guide walks you through setting up the complete Supabase backend for SigmaLog.

---

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works perfectly for Alpha)
- Basic familiarity with PostgreSQL (helpful but not required)

---

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose your organization
4. Fill in project details:
   - **Name**: SigmaLog (or your choice)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
5. Click **"Create new project"** and wait ~2 minutes

---

## 🔧 Step 2: Set Up Database Schema

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** button
6. Repeat for:
   - `supabase/migrations/002_helper_functions.sql`
   - `supabase/migrations/003_counter_functions.sql`

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

---

## 🔑 Step 3: Configure Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - **Enable Email OTP**: ON
   - **Disable Email Confirmations**: OFF (keep email verification)
   - **Secure Email Change**: ON

### Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize **"Magic Link"** template:
   ```html
   <h2>Your SigmaLog Login Code</h2>
   <p>Your verification code is: <strong>{{ .Token }}</strong></p>
   <p>This code expires in 10 minutes.</p>
   <p>If you didn't request this, you can safely ignore this email.</p>
   ```

---

## 📝 Step 4: Get API Credentials

1. Go to **Settings** → **API** in Supabase Dashboard
2. Copy the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

---

## ⚙️ Step 5: Configure Environment Variables

1. In your project root, create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **IMPORTANT**: Never commit `.env.local` to git!

---

## 📦 Step 6: Install Dependencies

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase JavaScript client
- All existing dependencies

---

## 🔄 Step 7: Switch to Backend-Enabled App

Replace your current `App.tsx` with the Supabase-integrated version:

```bash
# Backup original
mv src/App.tsx src/App.original.tsx

# Use Supabase version
mv src/AppWithSupabase.tsx src/App.tsx
```

---

## 🧪 Step 8: Test the Setup

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open browser to `http://localhost:5173`

3. Test authentication:
   - Enter your email
   - Check your email for OTP code
   - Enter the 6-digit code
   - You should be logged in!

4. Test habit creation:
   - Create some habits
   - Mark them as complete
   - Check if they persist after refresh

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] All 3 SQL migrations executed successfully
- [ ] Email authentication enabled
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] App starts without errors
- [ ] Can sign up with email + OTP
- [ ] Can create and log habits
- [ ] Data persists after page refresh
- [ ] Can sign out and sign back in

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists in project root
- Restart dev server after creating `.env.local`

### "Failed to send magic link"
- Check email provider is enabled in Supabase
- Verify email is valid format
- Check Supabase logs in Dashboard → Logs

### "Row Level Security policy violation"
- Ensure migrations ran successfully
- Check user is authenticated
- Verify RLS policies in Database → Policies

### Database connection errors
- Verify credentials in `.env.local`
- Check project URL format: `https://xxxxx.supabase.co`
- Ensure project is not paused (free tier auto-pauses after inactivity)

---

## 📊 Verify Database Setup

Run this query in Supabase SQL Editor to verify setup:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should return: users, habits, daily_logs, milestones, notifications, shares, feedback

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

---

## 🎯 Next Steps

Your backend is now fully configured! The app will:

✅ Authenticate users with email + OTP (no passwords)
✅ Store habits in PostgreSQL database
✅ Enforce data integrity rules (no backdating)
✅ Automatically detect milestone achievements
✅ Track streaks server-side
✅ Protect data with Row Level Security

---

## 🔒 Security Notes (IMPORTANT)

### What's Protected:
- ✅ Users can only see/edit their own data (RLS enforced)
- ✅ Logs can only be created for TODAY (server-enforced)
- ✅ Timestamps are server-generated (can't be manipulated)
- ✅ One habit per day rule (database constraint)

### What's NOT Implemented (Alpha):
- ⚠️ Rate limiting on API calls
- ⚠️ Email domain restrictions
- ⚠️ Advanced audit logging

---

## 💰 Free Tier Limits (Alpha Scale)

Supabase free tier includes:
- **500 MB database** (enough for thousands of users)
- **2 GB bandwidth/month** (sufficient for Alpha)
- **50,000 monthly active users**
- **100 MB file storage**

For Alpha version, these limits are more than sufficient.

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

## 🆘 Need Help?

1. Check Supabase logs: Dashboard → Logs
2. Review browser console for errors
3. Verify environment variables are loaded
4. Check database policies are active

---

**You're all set! Start building that Sigma mindset. 🗿**
