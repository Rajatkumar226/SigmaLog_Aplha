# SigmaLog Backend - Quick Reference Card

## 🔑 Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📦 Import Patterns

```typescript
// Services (direct API calls)
import * as authService from './services/authService';
import * as habitService from './services/habitService';
import * as logService from './services/logService';
import * as milestoneService from './services/milestoneService';

// Hooks (React state management)
import { useAuth } from './hooks/useAuth';
import { useHabits } from './hooks/useHabits';
import { useDailyLogs } from './hooks/useDailyLogs';
import { useMilestones } from './hooks/useMilestones';

// Supabase client
import { supabase } from './lib/supabase/client';
```

---

## 🔐 Authentication Cheat Sheet

```typescript
// Hook
const { user, isAuthenticated, signIn, verifyOtp, signOut } = useAuth();

// Send OTP
await signIn('user@example.com');

// Verify OTP
await verifyOtp('user@example.com', '123456');

// Sign out
await signOut();

// Check auth
if (isAuthenticated) { /* ... */ }
```

---

## 📝 Habits Cheat Sheet

```typescript
// Hook
const { habits, createHabit, updateHabit, deleteHabit } = useHabits();

// Create
await createHabit({
  name: 'Exercise',
  category: 'Body', // Body | Mind | Career | Discipline
  points: 2,        // 1 | 2 | 3
});

// Update
await updateHabit(habitId, { name: 'Gym', points: 3 });

// Delete (soft)
await deleteHabit(habitId);
```

---

## ✅ Logging Cheat Sheet

```typescript
// Hook
const {
  todayCompleted,  // string[] - Array of habit IDs
  dailyScore,      // { score, maxScore, date }
  streak,          // number
  toggleHabit      // (habitId) => Promise<boolean>
} = useDailyLogs();

// Toggle habit (smart check/uncheck)
await toggleHabit(habitId);

// Check if completed
const isCompleted = todayCompleted.includes(habitId);

// Display score
console.log(`${dailyScore.score}/${dailyScore.maxScore}`);
```

---

## 🏆 Milestones Cheat Sheet

```typescript
// Hook
const { milestones, progress } = useMilestones(currentStreak);

// Progress
progress.next           // '7_day' | '30_day' | '90_day' | '365_day'
progress.nextThreshold  // 7 | 30 | 90 | 365
progress.progress       // 0-100 (percentage)

// Get milestone info
const info = milestoneService.getMilestoneInfo('7_day');
// { title, description, emoji, days }
```

---

## 📊 Database Tables Reference

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User profiles | id, email, created_at |
| `habits` | User habits | id, user_id, name, category, points |
| `daily_logs` | Completion logs | id, user_id, habit_id, log_date |
| `milestones` | Achievements | id, user_id, milestone_type, streak_length |
| `notifications` | Preferences | id, user_id, enabled, reminder_time |
| `shares` | Share events | id, user_id, share_type, share_data |
| `feedback` | User feedback | id, user_id, type, message |

---

## 🔒 RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | Own only | Auto | Own only | ❌ |
| habits | Own only | Own only | Own only | Own only |
| daily_logs | Own only | Today only | ❌ | Today only |
| milestones | Own only | ❌ | ❌ | ❌ |
| notifications | Own only | Own only | Own only | Own only |
| shares | Own only | Own only | ❌ | ❌ |
| feedback | Own only | Anyone | ❌ | ❌ |

---

## 🛠️ Server Functions Reference

```typescript
// Calculate streak
const { data } = await supabase.rpc('calculate_streak', {
  p_user_id: userId
});

// Get daily score
const { data } = await supabase.rpc('get_daily_score', {
  p_user_id: userId,
  p_date: '2024-01-01'
});

// Get weekly stats
const { data } = await supabase.rpc('get_weekly_stats', {
  p_user_id: userId
});

// Check milestone
const { data } = await supabase.rpc('check_and_create_milestone', {
  p_user_id: userId,
  p_streak_length: 7
});
```

---

## 🎨 Common Patterns

### Loading State
```typescript
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <Content />;
```

### Error Handling
```typescript
const result = await service.doSomething();

if (result.success) {
  toast.success('Success!');
  // Use result.data
} else {
  toast.error(result.error);
}
```

### Optimistic Updates
```typescript
// Update UI immediately
setData(optimisticValue);

// Make API call
const success = await apiCall();

// Revert on error
if (!success) {
  setData(previousValue);
}
```

---

## 🐛 Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Not authenticated" | User not logged in | Check auth state |
| "Row Level Security policy violation" | RLS blocks action | Verify user owns resource |
| "This habit has already been logged today" | Duplicate log | Can't log same habit twice |
| "You can only log habits for today" | Backdating attempt | Only today's date allowed |
| "A habit with this name already exists" | Duplicate name | Use unique habit names |

---

## 🔍 Debugging Commands

```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Count users
SELECT COUNT(*) FROM auth.users;

-- Recent logs
SELECT * FROM daily_logs ORDER BY created_at DESC LIMIT 10;

-- User's habits
SELECT * FROM habits WHERE user_id = 'user-id';

-- Check streak
SELECT calculate_streak('user-id');
```

---

## ⚡ Performance Tips

1. **Use hooks** - They cache data and minimize API calls
2. **Batch creates** - Use `createHabits()` for multiple habits
3. **Server functions** - Complex calculations done server-side
4. **Indexes** - All frequently queried fields are indexed
5. **RLS** - Uses indexed columns for fast filtering

---

## 📦 NPM Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build

# Supabase CLI
supabase start     # Start local Supabase
supabase db push   # Push migrations
supabase db dump   # Backup database
```

---

## 🚀 Deployment Commands

```bash
# Vercel
vercel              # Deploy to preview
vercel --prod       # Deploy to production
vercel logs         # View logs
vercel env ls       # List environment variables

# Git
git add .
git commit -m "Update"
git push            # Auto-deploys to Vercel
```

---

## 📞 Quick Contacts

| Service | Dashboard | Status |
|---------|-----------|--------|
| Supabase | [app.supabase.com](https://app.supabase.com) | [status.supabase.com](https://status.supabase.com) |
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) | [vercel-status.com](https://www.vercel-status.com) |

---

## 🎯 Data Integrity Rules (Memorize This!)

✅ **CAN**:
- Log for TODAY
- Remove TODAY's log
- CRUD own habits
- View own data

❌ **CANNOT**:
- Backdate logs
- Edit past logs
- Delete past logs
- Log twice per day
- See others' data
- Fake timestamps

---

**Print this and keep it handy! 📄**
