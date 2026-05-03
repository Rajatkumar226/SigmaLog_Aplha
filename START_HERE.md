# 🚀 START HERE - Quick Setup

## ⚡ 3 Steps to Get Running

### Step 1: Run Database Migrations (5 minutes)

1. Open: https://supabase.com/dashboard/project/iszqqmnlfcmolwdnpebh/sql
2. Click **"New Query"**
3. Copy/paste `supabase/migrations/001_initial_schema.sql` → Click **"Run"**
4. Click **"New Query"** again
5. Copy/paste `supabase/migrations/002_helper_functions.sql` → Click **"Run"**
6. Click **"New Query"** again
7. Copy/paste `supabase/migrations/003_counter_functions.sql` → Click **"Run"**

✅ Done? Continue to Step 2!

---

### Step 2: Configure Email OTP Authentication (2 minutes)

**CRITICAL: This ensures you get a 6-digit OTP code, NOT a magic link!**

1. Open: https://supabase.com/dashboard/project/iszqqmnlfcmolwdnpebh/auth/providers
2. Find **"Email"** provider → Make sure it's **enabled**
3. **Disable** "Confirm email" (for easier testing)

4. Open: https://supabase.com/dashboard/project/iszqqmnlfcmolwdnpebh/auth/templates
5. Click on **"Magic Link"** template
6. Replace the email body with this (to show OTP code instead of link):
   ```
   Your SigmaLog verification code is: {{ .Token }}

   This code expires in 1 hour.
   ```
7. Save the template

✅ Done? Continue to Step 3!

---

### Step 3: Start the App (1 minute)

Open your terminal in `D:\Sigma` and run:

```bash
npm run dev
```

Then open: http://localhost:5173

✅ App running? You're done! 🎉

---

## 🧪 Quick Test

1. Enter your email → Get OTP code → Login ✅
2. Create a habit (e.g., "Morning Run") ✅
3. Mark it complete ✅
4. Refresh page → Everything persists ✅

---

## 📁 Your Files

✅ `.env.local` - Already created with your credentials
✅ `App.tsx` - Already updated with backend
✅ `package.json` - Already has Supabase dependency

**All code is ready. Just need to run the 3 migrations!**

---

## 🆘 Problems?

See [FINAL_SETUP_STEPS.md](./FINAL_SETUP_STEPS.md) for troubleshooting.

---

**Total time: ~8 minutes** ⏱️

**Let's go! 🗿**
