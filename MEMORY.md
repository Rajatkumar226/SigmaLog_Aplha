# SigmaLog — Project Memory

> Read this file at the start of every session to fully understand the project and resume work.

---

## What It Is
A **daily discipline & habit tracker** web app (Alpha). Users define habits, log completions daily, track streaks, view analytics, write Time Capsule messages to their future self, and log excuses for missed habits (Excuse Wall).

- **Auth:** Supabase Email OTP (passwordless — no passwords)
- **Stage:** Alpha — personal tool, actively iterating on UI and features
- **GitHub:** `https://github.com/Rajatkumar226/SigmaLog_Aplha` (branch: `main`)

---

## Stack
| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 → output dir `build/`, dev on port 3000 |
| Styling | Tailwind CSS + SCSS (BEM on feature components) |
| Animation | `motion/react` (AnimatePresence, motion.div) |
| Backend | Supabase (PostgreSQL + RLS + OTP Auth) |
| UI Primitives | Radix UI + shadcn/ui (`src/components/ui/`) |
| Charts | Recharts |
| Toast | Sonner |
| Icons | Lucide React |

---

## How to Run
```bash
# 1. Install dependencies
npm install

# 2. Setup environment (copy and fill in Supabase keys)
cp .env.example .env.local

# 3. Start dev server
npm run dev
# Opens at http://localhost:3000
```

---

## How to Push to GitHub
```bash
git add <files>
git commit -m "your message"
git push -f origin main
```
> Force push is required — this repo was initialized from a zip download, so local commits are not descendants of origin's history.

---

## Entry Point (IMPORTANT)
`src/main.tsx` → imports **`AppWithSupabase.tsx`** — this is the **ACTIVE** app root.

> `App.tsx` also exists but is the **old unused version**. Never edit App.tsx. Always work in AppWithSupabase.tsx.

---

## Screen Flow
```
PublicLandingPage (unauthenticated)
  → AuthScreen (OTP email login)
    → LandingScreen
      → HabitSetupScreen (first time)
        → MainDashboard ← main screen
            → ProgressScreen
            → SettingsScreen
```
- Screen state persisted in `localStorage['sigmalog_screen']`
- Onboarding seen flag: `localStorage['sigmalog_onboarding_seen']`

---

## Features
| Feature | Component | Status |
|---|---|---|
| Habit Tracking (name, category, points 1-3) | `MainDashboard.tsx` | Done |
| Daily log toggle + live score + streak | `useDailyLogs.ts` | Done |
| Monthly Heatmap (navigable calendar) | `MonthlyHeatmap.tsx` | Done |
| Progress / Analytics | `ProgressScreen.tsx` | Done |
| Shadow Stats widget | `ShadowStats.tsx` | Done |
| Time Capsule (write → seal → reveal) | `TimeCapsuleModal` + `TimeCapsuleReveal` | Done |
| Excuse Wall (log missed habit reasons) | `excuseService.ts` + `ExcuseWall.scss` | Done |
| Milestone detection (7/30/90/365 day) | `MilestoneModal.tsx` | Done |
| Onboarding Modal (3-slide first-time guide) | `OnboardingModal.tsx` | Done |
| Share progress | `ShareModal.tsx` | Done |
| Settings (edit habits, reset, sign out) | `SettingsScreen.tsx` | Done |

---

## File Structure
```
src/
├── main.tsx                      ← Entry point
├── AppWithSupabase.tsx           ← ACTIVE app root (use this)
├── App.tsx                       ← OLD, unused
├── index.css
├── components/
│   ├── AuthScreen.tsx
│   ├── PublicLandingPage.tsx
│   ├── LandingScreen.tsx
│   ├── HabitSetupScreen.tsx
│   ├── MainDashboard.tsx         ← Core daily UI
│   ├── ProgressScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── MonthlyHeatmap.tsx
│   ├── ShadowStats.tsx
│   ├── TimeCapsuleModal.tsx
│   ├── TimeCapsuleReveal.tsx
│   ├── OnboardingModal.tsx
│   ├── MilestoneModal.tsx
│   ├── ShareModal.tsx
│   ├── StatsOverview.tsx
│   ├── WeeklyOverview.tsx
│   ├── Header.tsx
│   ├── CircularProgress.tsx
│   └── ui/                       ← shadcn/ui primitives
├── hooks/
│   ├── useAuth.ts                ← isAuthenticated, loading, user
│   ├── useHabits.ts              ← habits CRUD
│   ├── useDailyLogs.ts           ← todayCompleted, streak, toggle, history
│   ├── useMilestones.ts
│   └── useTimeCapsule.ts         ← pendingCapsule, readyCapsule, create/open
├── services/
│   ├── authService.ts
│   ├── habitService.ts
│   ├── logService.ts             ← getMonthlyHeatmap(year, month)
│   ├── milestoneService.ts
│   ├── notificationService.ts
│   ├── shareService.ts
│   ├── excuseService.ts          ← habit_excuses table
│   └── timeCapsuleService.ts     ← time_capsules table
├── lib/supabase/
│   ├── client.ts
│   └── database.types.ts
└── styles/                       ← SCSS (BEM) for feature components
    ├── ExcuseWall.scss
    ├── HabitSection.scss
    ├── MonthlyHeatmap.scss
    ├── OnboardingModal.scss
    ├── ShadowStats.scss
    ├── TimeCapsuleModal.scss
    └── TimeCapsuleReveal.scss

supabase/migrations/
├── 001_initial_schema.sql        ← users, habits, daily_logs, milestones
├── 002_helper_functions.sql
├── 003_counter_functions.sql
└── 004_new_features.sql         ← habit_excuses + time_capsules tables
```

---

## Database Tables
| Table | Key Columns |
|---|---|
| `users` | id, email, timezone |
| `habits` | id, user_id, name, category, points (1\|2\|3), is_active |
| `daily_logs` | id, user_id, habit_id, log_date, completed_at |
| `milestones` | user_id, milestone_type (7/30/90/365_day), streak_length |
| `notifications` | user_id, enabled, reminder_time, timezone |
| `shares` | user_id, share_type, share_data |
| `feedback` | user_id, type, message, status |
| `habit_excuses` | user_id, habit_id, excuse_date, excuse_text |
| `time_capsules` | user_id, message, written_at, deliver_on, is_opened |

---

## Critical Implementation Rules

### 1. Habit Creation Order
`permanentlyDeleteAllHabits()` MUST be called before `createHabits()` — skipping causes Postgres unique constraint violations.

### 2. Date Handling
All date strings must be built from **LOCAL date parts**, never `.toISOString()` (which returns UTC). Indian users are IST = UTC+5:30, so UTC dates shift to the wrong day.
```ts
// CORRECT
const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

// WRONG — causes date bug for IST users
const today = new Date().toISOString().split('T')[0];
```

### 3. Daily Logs Merge
`AppWithSupabase.tsx` merges `historicalLogs` + today's live data into a single `dailyLogs[]` array. All UI components consume this merged array.

### 4. Time Capsule Flow
1. User writes → `createCapsule(message, days)`
2. `pendingCapsule` = sealed, not yet due
3. When `deliver_on <= today (local date)` → `readyCapsule` is set
4. App auto-shows `TimeCapsuleReveal` modal on dashboard

### 5. Monthly Heatmap Navigation
- Back limit: user's join date OR 12 months ago (whichever is later)
- Forward limit: current month only
- Current month → uses `dailyLogs` prop (live); past months → calls `logService.getMonthlyHeatmap(year, month)`

---

## Design System
- **Background:** `#0a0e1a` (deep dark navy) — dark only, no light mode
- **Card border-radius:** `18px` standard across all cards
- **SCSS convention:** BEM naming, keyframes defined per SCSS file
- **OnboardingModal:** CSS custom properties per slide (`--accent-color`, `--accent-gradient`) — slide 1: blue, slide 2: green, slide 3: orange
- **No Tailwind on feature components** — use SCSS files in `src/styles/`

---

## Supabase Config
- Project URL: `https://iszqqmnlfcmolwdnpebh.supabase.co`
- Keys are in `.env.local` (gitignored) — copy from `.env.example` on a new machine and fill in the values
