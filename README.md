# SigmaLog - Daily Discipline Tracker

**Alpha Version with Complete Backend**

SigmaLog is a discipline and habit tracking application with a complete Supabase backend, featuring:
- 🔐 Email + OTP Authentication (passwordless)
- 📊 PostgreSQL Database with Row Level Security
- ✅ Daily habit logging with data integrity
- 🏆 Automatic milestone detection
- 🔥 Streak tracking
- 📈 Progress analytics

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Backend
Follow the comprehensive setup guide:
```bash
# See SETUP.md for detailed instructions
```

**Key Steps:**
1. Create Supabase project
2. Run database migrations
3. Configure `.env.local`
4. Switch to backend-enabled app

### 3. Start Development
```bash
npm run dev
```

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [SETUP.md](./SETUP.md) | Complete Supabase setup guide |
| [BACKEND_USAGE.md](./BACKEND_USAGE.md) | Service and hook usage examples |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment instructions |
| [BACKEND_README.md](./BACKEND_README.md) | Complete backend overview |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Developer cheat sheet |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Executive summary |

---

## ✨ Features

### Authentication
- ✅ Email + OTP (Magic Link)
- ✅ No passwords required
- ✅ Session persistence
- ✅ Auto token refresh

### Habit Management
- ✅ Create/Update/Delete habits
- ✅ Categories: Body, Mind, Career, Discipline
- ✅ Points system (1-3 points)
- ✅ Unique constraint enforcement

### Daily Logging
- ✅ Log habits for TODAY only
- ✅ No backdating (enforced by RLS)
- ✅ One habit per day constraint
- ✅ Server-generated timestamps
- ✅ Immutable logs

### Milestones & Progress
- ✅ Automatic detection (7, 30, 90, 365 days)
- ✅ Streak calculation
- ✅ Weekly/monthly stats
- ✅ Progress tracking

---

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Security**: Row Level Security (RLS)
- **Hosting**: Vercel (recommended)
- **UI**: Radix UI + Tailwind CSS

---

## 🔒 Data Integrity

**What Users CAN Do:**
- Log habits for TODAY
- Remove today's log
- CRUD own habits
- View own data only

**What Users CANNOT Do:**
- ❌ Backdate logs (RLS blocks it)
- ❌ Edit past logs (no UPDATE policy)
- ❌ Delete past logs
- ❌ Log same habit twice per day
- ❌ See other users' data

**All enforced server-side via RLS policies and database constraints.**

---

## 📁 Project Structure

```
D:\Sigma/
├── supabase/          # Database migrations
├── src/
│   ├── services/      # Backend services
│   ├── hooks/         # React hooks
│   ├── components/    # UI components (unchanged)
│   └── lib/           # Supabase client config
├── SETUP.md           # Setup instructions
├── BACKEND_USAGE.md   # Usage examples
└── DEPLOYMENT.md      # Deployment guide
```

---

## 💰 Cost (Alpha Scale)

**FREE** with:
- Supabase Free Tier (500MB DB, 50k users)
- Vercel Free Tier (100GB bandwidth)

Perfect for Alpha version!

---

## 🎯 Next Steps

1. **Setup Backend**: Follow [SETUP.md](./SETUP.md)
2. **Learn Integration**: Read [BACKEND_USAGE.md](./BACKEND_USAGE.md)
3. **Deploy**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📝 Original Design

Original Figma design: https://www.figma.com/design/gbWYTNkQQqiH01IaGpXHSd/Design-SigmaLog-Dashboard-UI

---

**Built with discipline. 🗿**