# SigmaLog Deployment Guide (Vercel + Supabase)

This guide shows how to deploy SigmaLog to production using Vercel (frontend) and Supabase (backend).

---

## 🎯 Architecture Overview

```
┌─────────────────┐
│  Vercel (Free)  │  ← React App Hosting
│  - Frontend     │
│  - CDN          │
└────────┬────────┘
         │
         │ HTTPS
         │
         ▼
┌─────────────────┐
│ Supabase (Free) │  ← Backend Services
│  - PostgreSQL   │
│  - Auth         │
│  - Row Level    │
│    Security     │
└─────────────────┘
```

---

## 📋 Pre-Deployment Checklist

- [ ] Supabase project configured and tested locally
- [ ] Database migrations applied
- [ ] Environment variables documented
- [ ] App tested thoroughly in development
- [ ] Git repository created

---

## 🚀 Step 1: Prepare Supabase for Production

### Enable Email Confirmations (Recommended)

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. **Email confirmations**: Enable
3. **Secure email change**: Enable
4. **Double confirm email changes**: Enable

### Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel domain (after deployment):
   ```
   https://your-app.vercel.app
   ```
3. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/auth/callback
   ```

### Production Database Settings

1. Go to **Settings** → **Database**
2. Consider enabling:
   - **Connection pooling** (for better performance)
   - **Read replicas** (optional, for scaling)

### Verify RLS Policies

Run this in SQL Editor to ensure all policies are active:

```sql
-- Check RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Should return no rows (all tables have RLS)
```

---

## 🔧 Step 2: Prepare Repository

### Create Git Repository

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with Supabase backend"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/sigmalog.git
git branch -M main
git push -u origin main
```

### Ensure .gitignore is Correct

Verify `.gitignore` includes:
```
.env.local
.env.production.local
node_modules/
dist/
```

---

## ☁️ Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. Click **"Deploy"**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and set environment variables
```

---

## 🔐 Step 4: Configure Environment Variables on Vercel

1. In Vercel project, go to **Settings** → **Environment Variables**
2. Add production variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |

3. Redeploy for variables to take effect:
   ```bash
   vercel --prod
   ```

---

## 🧪 Step 5: Test Production Deployment

### Functional Tests

1. **Authentication**:
   - [ ] Sign up with email works
   - [ ] OTP email received
   - [ ] OTP verification works
   - [ ] Session persists after refresh
   - [ ] Sign out works

2. **Habits**:
   - [ ] Can create habits
   - [ ] Can update habits
   - [ ] Can delete habits
   - [ ] Habits persist after refresh

3. **Logging**:
   - [ ] Can log habits for today
   - [ ] Cannot log same habit twice
   - [ ] Can un-check today's log
   - [ ] Score updates correctly

4. **Milestones**:
   - [ ] Milestones detected correctly
   - [ ] Only created once per type

5. **Data Integrity**:
   - [ ] Cannot backdate logs
   - [ ] Cannot edit past logs
   - [ ] Timestamps are server-generated

### Performance Tests

1. Open browser DevTools → Network tab
2. Check:
   - [ ] Initial load < 3 seconds
   - [ ] API calls respond < 500ms
   - [ ] No excessive API calls
   - [ ] Assets cached properly

---

## 📊 Step 6: Set Up Monitoring

### Supabase Monitoring

1. Go to **Project Dashboard** in Supabase
2. Monitor:
   - **Database size**: Should stay under 500MB for free tier
   - **API requests**: Track daily usage
   - **Auth users**: Monitor user growth

### Vercel Monitoring

1. Go to **Analytics** in Vercel project
2. Monitor:
   - **Page views**
   - **Performance metrics**
   - **Error rates**

---

## 🔒 Step 7: Security Hardening

### Enable Captcha (Optional)

1. In Supabase: **Authentication** → **Settings**
2. Enable **Captcha protection**
3. Add Cloudflare Turnstile or reCAPTCHA

### Rate Limiting

For production, consider:
```sql
-- Add rate limiting trigger (example)
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Limit 10 logs per minute per user
  IF (
    SELECT COUNT(*)
    FROM daily_logs
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '1 minute'
  ) > 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limit_logs
  BEFORE INSERT ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION check_rate_limit();
```

---

## 🔄 Step 8: Set Up Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys
```

### Preview Deployments

- Every pull request gets a preview deployment
- Test before merging to main
- Preview URL: `https://sigmalog-pr-123.vercel.app`

---

## 📝 Step 9: Configure Custom Domain (Optional)

1. Buy domain (e.g., from Namecheap, Google Domains)
2. In Vercel: **Settings** → **Domains**
3. Add your domain: `sigmalog.com`
4. Update DNS records as instructed
5. SSL certificate auto-provisioned

### Update Supabase URLs

After adding domain, update in Supabase:
1. **Authentication** → **URL Configuration**
2. Update **Site URL** to `https://yourdomain.com`
3. Update **Redirect URLs**

---

## 🗄️ Database Backup Strategy

### Automatic Backups (Supabase)

Free tier includes:
- Daily backups (retained 7 days)
- Point-in-time recovery (paid tiers)

### Manual Backup

```bash
# Install Supabase CLI
npm install -g supabase

# Export database
supabase db dump -f backup.sql

# Store in secure location (Git LFS, Google Drive, etc.)
```

---

## 📈 Scaling Considerations

### When to Upgrade (Future)

**Supabase Pro** ($25/month) needed when:
- 500MB database limit reached
- Need more than 50k monthly active users
- Require longer backup retention
- Need dedicated support

**Vercel Pro** ($20/month) needed when:
- Exceed 100GB bandwidth/month
- Need team collaboration features
- Require password protection
- Need analytics data

### Performance Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_daily_logs_user_date
  ON daily_logs(user_id, log_date DESC);

CREATE INDEX idx_habits_user_active
  ON habits(user_id) WHERE is_active = true;
```

---

## 🐛 Production Debugging

### Vercel Logs

```bash
# View real-time logs
vercel logs

# View logs for specific deployment
vercel logs [deployment-url]
```

### Supabase Logs

1. **Dashboard** → **Logs**
2. Filter by:
   - **API**: See API requests/errors
   - **Auth**: Authentication events
   - **Database**: Query errors

### Common Production Issues

**Problem**: "Network request failed"
- Check environment variables in Vercel
- Verify Supabase URL is accessible
- Check CORS settings

**Problem**: "Row Level Security policy violation"
- User not authenticated
- Session expired
- RLS policies misconfigured

**Problem**: Slow performance
- Check database indexes
- Monitor API call frequency
- Optimize large queries

---

## 🎯 Post-Deployment Checklist

- [ ] Production URL works
- [ ] All features tested in production
- [ ] Environment variables set correctly
- [ ] Email OTP delivery working
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Custom domain configured (optional)
- [ ] Team members have access
- [ ] Documentation updated with prod URLs

---

## 📚 Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View production logs
vercel logs --prod

# View environment variables
vercel env ls

# Pull production env to local
vercel env pull .env.local

# Revert to previous deployment
vercel rollback
```

---

## 💡 Best Practices

1. **Never commit secrets** - Use environment variables
2. **Test before deploy** - Use preview deployments
3. **Monitor regularly** - Check Vercel and Supabase dashboards
4. **Backup database** - Weekly manual backups recommended
5. **Version control** - Tag releases in git
6. **Document changes** - Keep CHANGELOG.md updated

---

## 🆘 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Status](https://status.supabase.com/)
- [Supabase Discord](https://discord.supabase.com/)

---

## 🎉 You're Live!

Your SigmaLog app is now deployed and ready for users!

**Production URL**: `https://your-app.vercel.app`

Share with users and start building that Sigma mindset at scale! 🗿
