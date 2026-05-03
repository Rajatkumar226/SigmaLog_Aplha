# Getting Started with SigmaLog Backend

## 📋 Complete Setup Checklist

Follow this checklist step-by-step to get your SigmaLog backend up and running.

---

## ✅ Phase 1: Prerequisites (5 minutes)

- [ ] Node.js 18+ installed on your machine
- [ ] Git installed (optional but recommended)
- [ ] Code editor installed (VS Code recommended)
- [ ] Gmail or email account for testing

---

## ✅ Phase 2: Supabase Setup (15 minutes)

### Create Project
- [ ] Go to [supabase.com](https://supabase.com) and create account
- [ ] Click "New Project"
- [ ] Fill in project details:
  - Name: SigmaLog
  - Database Password: (save this!)
  - Region: (choose closest)
- [ ] Wait for project to be ready (~2 minutes)

### Run Database Migrations
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Create new query
- [ ] Copy/paste `supabase/migrations/001_initial_schema.sql`
- [ ] Click "Run" ✅
- [ ] Create new query
- [ ] Copy/paste `supabase/migrations/002_helper_functions.sql`
- [ ] Click "Run" ✅
- [ ] Create new query
- [ ] Copy/paste `supabase/migrations/003_counter_functions.sql`
- [ ] Click "Run" ✅

### Configure Authentication
- [ ] Go to Authentication → Providers
- [ ] Enable "Email" provider
- [ ] Enable "Email OTP"
- [ ] Disable "Confirm email" (for easier testing)
- [ ] Save changes

### Get API Credentials
- [ ] Go to Settings → API
- [ ] Copy "Project URL" (starts with https://)
- [ ] Copy "anon public" key (starts with eyJ...)
- [ ] Keep these handy for next step

---

## ✅ Phase 3: Local Project Setup (5 minutes)

### Install Dependencies
```bash
cd D:\Sigma
npm install
```
- [ ] Dependencies installed successfully
- [ ] No error messages

### Configure Environment
```bash
# Copy template
cp .env.example .env.local
```
- [ ] `.env.local` file created
- [ ] Open `.env.local` in editor
- [ ] Replace `VITE_SUPABASE_URL` with your Project URL
- [ ] Replace `VITE_SUPABASE_ANON_KEY` with your anon key
- [ ] Save file

### Switch to Backend App
```bash
# Backup original (optional)
mv src/App.tsx src/App.original.tsx

# Use backend version
mv src/AppWithSupabase.tsx src/App.tsx
```
- [ ] Files moved successfully
- [ ] `src/App.tsx` now contains backend integration

---

## ✅ Phase 4: Test the Application (10 minutes)

### Start Development Server
```bash
npm run dev
```
- [ ] Server started successfully
- [ ] No errors in terminal
- [ ] Open browser to http://localhost:5173

### Test Authentication
- [ ] Enter your email address
- [ ] Click "Access Vault" or similar
- [ ] Check your email inbox
- [ ] Find OTP code (6 digits)
- [ ] Enter OTP code
- [ ] ✅ Successfully logged in!

### Test Habit Creation
- [ ] Create a new habit (e.g., "Morning Run")
- [ ] Select category (e.g., "Body")
- [ ] Select points (e.g., 2)
- [ ] Click "Lock My Rules" or save
- [ ] ✅ Habit appears in list

### Test Daily Logging
- [ ] Click on a habit to mark it complete
- [ ] ✅ Checkmark appears
- [ ] ✅ Score updates
- [ ] Click again to un-check
- [ ] ✅ Works correctly

### Test Data Persistence
- [ ] Refresh the page (F5)
- [ ] ✅ Still logged in
- [ ] ✅ Habits still there
- [ ] ✅ Completed habits still checked

### Test Sign Out
- [ ] Click sign out button
- [ ] ✅ Redirected to auth screen
- [ ] ✅ Session cleared

---

## ✅ Phase 5: Verify Database (5 minutes)

### Check Data in Supabase
- [ ] Go to Supabase Dashboard
- [ ] Click "Table Editor"
- [ ] Check `users` table → Your user exists
- [ ] Check `habits` table → Your habits exist
- [ ] Check `daily_logs` table → Your logs exist
- [ ] All data is there! ✅

### Check RLS Policies
```sql
-- Run in SQL Editor
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```
- [ ] All tables show `rowsecurity = true`
- [ ] RLS is working! ✅

---

## ✅ Phase 6: Advanced Testing (Optional)

### Test Data Integrity
Try these (they should FAIL):
- [ ] ❌ Try to log a habit twice → Error: "already logged today"
- [ ] ✅ Error message appears correctly

### Test in Another Browser
- [ ] Open app in incognito/private window
- [ ] Sign up with different email
- [ ] ✅ Previous user's data is NOT visible
- [ ] RLS is working correctly!

---

## 🎉 Success Criteria

You're done when:
- ✅ Authentication works (email + OTP)
- ✅ Can create and manage habits
- ✅ Can log habits for today
- ✅ Data persists after refresh
- ✅ Can sign out and back in
- ✅ Database contains your data
- ✅ RLS policies are active

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists in project root
- Check variables are spelled correctly
- Restart dev server (`Ctrl+C` then `npm run dev`)

### "Failed to send magic link"
- Check email format is valid
- Check Supabase project is not paused
- Check Auth provider is enabled
- Try different email address

### "Row Level Security policy violation"
- Check you're logged in
- Check migrations ran successfully
- Check RLS policies in Supabase Dashboard

### Email not received
- Check spam/junk folder
- Wait up to 5 minutes
- Try "Resend code" option
- Check Supabase logs in Dashboard

### Database errors
- Verify all 3 migrations ran successfully
- Check for red errors in SQL Editor
- Re-run migrations if needed

---

## 📚 Next Steps

Once everything works locally:

1. **Learn the APIs**: Read [BACKEND_USAGE.md](./BACKEND_USAGE.md)
2. **Deploy to Production**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Keep Reference Handy**: Print [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## 🆘 Still Stuck?

1. Check Supabase Dashboard → Logs for errors
2. Check browser console (F12) for errors
3. Verify environment variables are loaded
4. Re-read [SETUP.md](./SETUP.md) for detailed explanations

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] All Phase 1-5 tasks completed
- [ ] Authentication works end-to-end
- [ ] Habits CRUD operations work
- [ ] Daily logging works
- [ ] Data persists after refresh
- [ ] Database shows correct data
- [ ] No console errors
- [ ] No terminal errors

---

**Congratulations! Your SigmaLog backend is now fully operational! 🎉**

**Time to build that Sigma mindset! 🗿**
