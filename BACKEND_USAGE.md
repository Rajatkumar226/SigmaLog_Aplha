# Backend Integration Usage Guide

This guide shows how to use the backend services and hooks in your React components.

---

## 🎯 Overview

The backend is organized into:

1. **Services** - Direct API interaction functions
2. **Hooks** - React hooks that manage state and side effects
3. **Client** - Supabase client configuration

---

## 🔐 Authentication

### Using the `useAuth` Hook

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const {
    user,
    session,
    isAuthenticated,
    loading,
    signIn,
    verifyOtp,
    signOut
  } = useAuth();

  // Check if user is logged in
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Direct Service Usage (without hook)

```typescript
import * as authService from './services/authService';

// Send OTP to email
async function handleLogin(email: string) {
  const result = await authService.sendMagicLink(email);

  if (result.success) {
    console.log('OTP sent!');
  } else {
    console.error(result.error);
  }
}

// Verify OTP code
async function handleVerify(email: string, code: string) {
  const result = await authService.verifyOtp(email, code);

  if (result.success) {
    console.log('Logged in!', result.user);
  } else {
    console.error(result.error);
  }
}

// Sign out
async function handleSignOut() {
  const result = await authService.signOut();

  if (result.success) {
    console.log('Signed out');
  }
}
```

---

## 📝 Habits Management

### Using the `useHabits` Hook

```typescript
import { useHabits } from './hooks/useHabits';

function HabitManager() {
  const {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    refetch
  } = useHabits();

  async function addNewHabit() {
    const success = await createHabit({
      name: 'Morning Run',
      category: 'Body',
      points: 2,
    });

    if (success) {
      console.log('Habit created!');
    }
  }

  async function editHabit(habitId: string) {
    const success = await updateHabit(habitId, {
      name: 'Evening Run',
      points: 3,
    });

    if (success) {
      console.log('Habit updated!');
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {habits.map(habit => (
        <div key={habit.id}>
          <span>{habit.name}</span>
          <button onClick={() => editHabit(habit.id)}>Edit</button>
          <button onClick={() => deleteHabit(habit.id)}>Delete</button>
        </div>
      ))}
      <button onClick={addNewHabit}>Add Habit</button>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import * as habitService from './services/habitService';

// Get all habits
async function loadHabits() {
  const result = await habitService.getHabits();

  if (result.success) {
    console.log('Habits:', result.data);
  }
}

// Create single habit
async function createOne() {
  const result = await habitService.createHabit({
    name: 'Meditation',
    category: 'Mind',
    points: 1,
  });

  if (result.success) {
    console.log('Created:', result.data);
  }
}

// Create multiple habits at once
async function createMultiple() {
  const result = await habitService.createHabits([
    { name: 'Exercise', category: 'Body', points: 2 },
    { name: 'Reading', category: 'Mind', points: 1 },
    { name: 'Work', category: 'Career', points: 3 },
  ]);

  if (result.success) {
    console.log('Created habits:', result.data);
  }
}
```

---

## ✅ Daily Logging

### Using the `useDailyLogs` Hook

```typescript
import { useDailyLogs } from './hooks/useDailyLogs';

function DailyTracker() {
  const {
    todayCompleted,
    dailyScore,
    streak,
    loading,
    toggleHabit,
  } = useDailyLogs();

  async function handleToggle(habitId: string) {
    const success = await toggleHabit(habitId);

    if (success) {
      console.log('Toggled!');
    }
  }

  return (
    <div>
      <p>Score: {dailyScore?.score}/{dailyScore?.maxScore}</p>
      <p>Streak: {streak} days</p>

      <div>
        {habits.map(habit => (
          <button
            key={habit.id}
            onClick={() => handleToggle(habit.id)}
            disabled={todayCompleted.includes(habit.id)}
          >
            {habit.name}
            {todayCompleted.includes(habit.id) ? ' ✓' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import * as logService from './services/logService';

// Log a habit for TODAY
async function logHabit(habitId: string) {
  const result = await logService.logHabit(habitId);

  if (result.success) {
    console.log('Logged!', result.data);
  } else {
    // Common errors:
    // - "This habit has already been logged today"
    // - "You can only log habits for today"
    console.error(result.error);
  }
}

// Remove today's log (un-check)
async function unlogHabit(habitId: string) {
  const result = await logService.removeLog(habitId);

  if (result.success) {
    console.log('Removed!');
  }
}

// Get today's score
async function getTodayScore() {
  const today = new Date().toISOString().split('T')[0];
  const result = await logService.getDailyScore(today);

  if (result.success) {
    console.log('Score:', result.data);
    // { date, score, maxScore, completedHabits, totalHabits }
  }
}

// Calculate current streak
async function getStreak() {
  const result = await logService.calculateStreak();

  if (result.success) {
    console.log('Streak:', result.data, 'days');
  }
}

// Get weekly stats
async function getWeekStats() {
  const result = await logService.getWeeklyStats();

  if (result.success) {
    console.log('Week:', result.data);
    // Array of 7 days with scores
  }
}
```

---

## 🏆 Milestones

### Using the `useMilestones` Hook

```typescript
import { useMilestones } from './hooks/useMilestones';

function MilestoneTracker({ currentStreak }: { currentStreak: number }) {
  const { milestones, progress, loading } = useMilestones(currentStreak);

  return (
    <div>
      <p>Next milestone: {progress.next} ({progress.nextThreshold} days)</p>
      <p>Progress: {progress.progress}%</p>

      <div>
        <h3>Achieved:</h3>
        {milestones.map(m => (
          <div key={m.id}>
            {m.milestone_type} - {m.streak_length} days
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import * as milestoneService from './services/milestoneService';

// Check and create milestone (call after logging habits)
async function checkMilestone(streakLength: number) {
  const result = await milestoneService.checkAndCreateMilestone(streakLength);

  if (result.success && result.data?.milestoneCreated) {
    console.log('🎉 New milestone!', result.data.milestoneType);

    // Get milestone info for display
    const info = milestoneService.getMilestoneInfo(result.data.milestoneType);
    console.log(info.title, info.description, info.emoji);
  }
}

// Get all achieved milestones
async function getAchieved() {
  const result = await milestoneService.getMilestones();

  if (result.success) {
    console.log('Milestones:', result.data);
  }
}

// Check if specific milestone achieved
async function hasMilestone() {
  const has7Day = await milestoneService.hasMilestone('7_day');
  console.log('Has 7-day milestone?', has7Day);
}
```

---

## 🔔 Notifications (Alpha - Preferences Only)

```typescript
import * as notificationService from './services/notificationService';

// Get or create settings
async function setupNotifications() {
  const result = await notificationService.getOrCreateNotificationSettings();

  if (result.success && result.data) {
    console.log('Settings:', result.data);
  }
}

// Update notification preferences
async function updatePrefs() {
  const result = await notificationService.updateNotificationSettings({
    enabled: true,
    reminder_time: '20:00:00',
    timezone: 'America/New_York',
  });

  if (result.success) {
    console.log('Updated!');
  }
}

// Check if reminder should be sent (for future implementation)
async function checkReminder() {
  const { shouldSend, reason } = await notificationService.shouldSendReminder();

  if (shouldSend) {
    console.log('Send reminder!');
  } else {
    console.log('Skip:', reason);
  }
}
```

---

## 📤 Social Sharing (Tracking Only)

```typescript
import * as shareService from './services/shareService';

// Track a share event
async function trackShare() {
  const result = await shareService.trackShare('daily', {
    score: 8,
    maxScore: 10,
    streak: 15,
    timestamp: new Date().toISOString(),
  });

  if (result.success) {
    console.log('Share tracked!');
  }
}

// Generate share text
function getShareText() {
  const text = shareService.generateShareText('weekly', {
    perfectDays: 5,
    streak: 15,
  });

  console.log(text);
  // "📊 SigmaLog - Discipline Tracker
  //  This week's progress:
  //  ✅ Perfect days: 5/7
  //  🔥 Current streak: 15 days
  //  Consistency over intensity."
}

// Copy to clipboard and track
async function shareToClipboard() {
  const success = await shareService.copyShareTextToClipboard('monthly', {
    perfectDays: 25,
    streak: 25,
  });

  if (success) {
    console.log('Copied and tracked!');
  }
}
```

---

## 🔒 Data Integrity Rules (CRITICAL)

### What You CANNOT Do:

```typescript
// ❌ WILL FAIL - Cannot log for past dates
await logService.logHabit(habitId); // with backdated log_date
// Error: "You can only log habits for today"

// ❌ WILL FAIL - Cannot log same habit twice in one day
await logService.logHabit(habitId);
await logService.logHabit(habitId); // Second call fails
// Error: "This habit has already been logged today"

// ❌ WILL FAIL - Cannot edit past logs
// No UPDATE policy exists on daily_logs table

// ❌ WILL FAIL - Cannot delete past logs
// No DELETE policy exists for past dates
```

### What You CAN Do:

```typescript
// ✅ Log habit for TODAY
await logService.logHabit(habitId);

// ✅ Remove TODAY's log (if mistake)
await logService.removeLog(habitId);

// ✅ Toggle habit (smart check/uncheck)
await toggleHabit(habitId); // Hook handles add/remove
```

---

## 🎨 Full Example: Dashboard Component

```typescript
import { useAuth } from './hooks/useAuth';
import { useHabits } from './hooks/useHabits';
import { useDailyLogs } from './hooks/useDailyLogs';
import { useMilestones } from './hooks/useMilestones';

function Dashboard() {
  const { user, signOut } = useAuth();
  const { habits, loading: habitsLoading } = useHabits();
  const {
    todayCompleted,
    dailyScore,
    streak,
    toggleHabit
  } = useDailyLogs();
  const { milestones, progress } = useMilestones(streak);

  if (habitsLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Header */}
      <header>
        <h1>Welcome, {user?.email}</h1>
        <button onClick={signOut}>Sign Out</button>
      </header>

      {/* Stats */}
      <div>
        <p>Score: {dailyScore?.score}/{dailyScore?.maxScore}</p>
        <p>Streak: {streak} days 🔥</p>
        <p>Next: {progress.next} in {progress.nextThreshold! - streak} days</p>
      </div>

      {/* Habits */}
      <div>
        {habits.map(habit => (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={todayCompleted.includes(habit.id) ? 'completed' : ''}
          >
            {habit.name} (+{habit.points})
            {todayCompleted.includes(habit.id) && ' ✓'}
          </button>
        ))}
      </div>

      {/* Milestones */}
      <div>
        <h2>Achievements</h2>
        {milestones.map(m => (
          <div key={m.id}>
            {milestoneService.getMilestoneInfo(m.milestone_type).emoji}
            {milestoneService.getMilestoneInfo(m.milestone_type).title}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🐛 Error Handling Best Practices

```typescript
// Always check success and handle errors
async function safeOperation() {
  const result = await habitService.createHabit({
    name: 'Test',
    category: 'Body',
    points: 1,
  });

  if (result.success) {
    // Success case
    console.log('Created:', result.data);
    toast.success('Habit created!');
  } else {
    // Error case
    console.error('Error:', result.error);
    toast.error(result.error);
  }
}

// Use try-catch for hooks
async function handleToggle(habitId: string) {
  try {
    const success = await toggleHabit(habitId);
    if (success) {
      toast.success('Logged!');
    }
  } catch (error) {
    toast.error('Something went wrong');
    console.error(error);
  }
}
```

---

## 🎯 Common Patterns

### Loading States
```typescript
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

### Optimistic Updates
```typescript
// Update UI immediately, revert on error
async function optimisticToggle(habitId: string) {
  const wasCompleted = todayCompleted.includes(habitId);

  // Update UI
  setTodayCompleted(prev =>
    wasCompleted
      ? prev.filter(id => id !== habitId)
      : [...prev, habitId]
  );

  // Make API call
  const success = await toggleHabit(habitId);

  if (!success) {
    // Revert on error
    setTodayCompleted(prev =>
      wasCompleted
        ? [...prev, habitId]
        : prev.filter(id => id !== habitId)
    );
  }
}
```

### Refetching Data
```typescript
const { refetch } = useHabits();

async function afterMutation() {
  await createHabit({ ... });
  await refetch(); // Reload habits from server
}
```

---

**All services and hooks are fully typed with TypeScript for autocomplete and type safety! 🎉**
