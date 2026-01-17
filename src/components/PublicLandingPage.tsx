import {
  CheckCircle,
  Target,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Flame,
  ArrowRight,
  Star,
  Pencil,
  Settings,
} from 'lucide-react';
import './PublicLandingPage.css';

interface PublicLandingPageProps {
  onGetStarted: () => void;
}

export function PublicLandingPage({ onGetStarted }: PublicLandingPageProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGetStarted();
  };

  // Demo habits showing variety of what users can create
  const habits = [
    { name: 'Morning Run', category: 'Body', points: 2, done: true },
    { name: 'Learn Spanish', category: 'Mind', points: 1, done: true },
    { name: 'Code 2 Hours', category: 'Career', points: 3, done: true },
    { name: 'No Social Media', category: 'Discipline', points: 2, done: false },
  ];

  const journeySteps = [
    { icon: Zap, step: 1, title: 'Sign Up', desc: 'Create your account with just an email. Quick and simple.' },
    { icon: Target, step: 2, title: 'Create Your Habits', desc: 'Add any habit you want. Name it, categorize it, set difficulty. Fully customizable.' },
    { icon: CheckCircle, step: 3, title: 'Track Daily', desc: 'Check off habits as you complete them. Build streaks and see your score.' },
    { icon: TrendingUp, step: 4, title: 'Watch Growth', desc: 'See your calendar fill with green. Celebrate milestones along the way.' },
  ];

  const features = [
    { icon: Pencil, title: 'Fully Customizable', desc: 'Create any habit you want. Edit names, categories, and difficulty anytime in settings.', color: 'green' },
    { icon: Target, title: 'Point System', desc: 'Assign 1-3 points based on difficulty. Harder habits earn more credit toward your daily score.', color: 'blue' },
    { icon: Flame, title: 'Streak Tracking', desc: 'Build momentum with daily streaks. Visual proof of your consistency over time.', color: 'orange' },
    { icon: Calendar, title: 'Monthly Heatmap', desc: 'See your entire month at a glance. Green days show your discipline in action.', color: 'green' },
    { icon: Star, title: 'Milestones', desc: 'Unlock achievements at 7, 30, 90, and 365 days of consistency.', color: 'yellow' },
    { icon: Shield, title: 'No Backdating', desc: 'Can\'t log yesterday. Your progress is 100% authentic and honestly earned.', color: 'purple' },
  ];

  const whyItems = [
    { emoji: '✏️', title: 'Your Habits, Your Way', desc: 'Create exactly the habits you want to build. Morning meditation, evening journaling, weekly meal prep—if you can name it, you can track it. Edit anytime in settings.' },
    { emoji: '🔒', title: 'Honest Progress Only', desc: 'Can\'t log yesterday\'s habits. Can\'t fake your streaks. When you see green on your calendar, you actually earned it. Real accountability.' },
    { emoji: '⚖️', title: 'Weighted Difficulty', desc: 'A 2-hour deep work session is harder than drinking water. Assign 1-3 points to each habit based on effort. Your daily score reflects real work, not just checkboxes.' },
    { emoji: '📈', title: 'Build Your Identity', desc: '7 days builds a habit. 30 days builds momentum. 90 days builds identity. 365 days? That\'s who you\'ve become. Track your transformation.' },
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">SigmaLog</div>
          <button type="button" onClick={onGetStarted} className="landing-btn-primary">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <Zap className="landing-badge-icon" />
            <span>Build discipline, one day at a time</span>
          </div>

          <h1 className="landing-headline">
            Track Any Habit,
            <span className="landing-headline-gradient">Build Real Discipline</span>
          </h1>

          <p className="landing-subheadline">
            Create your own habits, track them daily, and watch yourself transform.
            No fake motivation—just honest tracking of the work you actually put in.
          </p>

          <div className="landing-cta-buttons">
            <button type="button" onClick={onGetStarted} className="landing-btn-large">
              Start Your Journey
              <ArrowRight className="landing-btn-arrow" />
            </button>
            <a href="#how-it-works" className="landing-btn-secondary">
              See How It Works
            </a>
          </div>

          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-value green">100%</div>
              <div className="landing-stat-label">Customizable</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value blue">1-3</div>
              <div className="landing-stat-label">Points Per Habit</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value purple">365</div>
              <div className="landing-stat-label">Days to Transform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="landing-demo">
        <div className="landing-demo-inner">
          <div className="landing-demo-grid">
            {/* Left Content */}
            <div>
              <div className="landing-demo-badge">
                <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                Simple & Flexible
              </div>

              <h2 className="landing-demo-title">
                Your Custom Habits,
                <span className="landing-demo-title-sub">Tracked Your Way</span>
              </h2>

              <p className="landing-demo-text">
                Create any habit you want—from "Morning Run" to "No Social Media" to "Practice Guitar."
                Assign difficulty points (1-3) and organize by category. Edit everything anytime.
              </p>

              <div className="landing-feature-list">
                <div className="landing-feature-item">
                  <div className="landing-feature-icon blue">
                    <Pencil />
                  </div>
                  <div>
                    <h4 className="landing-feature-title">Name Any Habit</h4>
                    <p className="landing-feature-desc">Type exactly what you want to track. Full flexibility.</p>
                  </div>
                </div>
                <div className="landing-feature-item">
                  <div className="landing-feature-icon purple">
                    <Target />
                  </div>
                  <div>
                    <h4 className="landing-feature-title">Set Difficulty</h4>
                    <p className="landing-feature-desc">1 point = easy, 3 points = challenging. Fair scoring.</p>
                  </div>
                </div>
                <div className="landing-feature-item">
                  <div className="landing-feature-icon green">
                    <Settings />
                  </div>
                  <div>
                    <h4 className="landing-feature-title">Edit Anytime</h4>
                    <p className="landing-feature-desc">Add, remove, or modify habits whenever you need to.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Demo Card */}
            <div className="landing-demo-card-wrapper">
              <div className="landing-demo-card-glow"></div>
              <div className="landing-demo-card">
                <div className="landing-demo-card-header">
                  <div>
                    <h3 className="landing-demo-card-title">Today's Discipline</h3>
                    <p className="landing-demo-card-date">January 17, 2026</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="landing-demo-card-score">6/8</div>
                    <div className="landing-demo-card-percent">75% Complete</div>
                  </div>
                </div>

                <div className="landing-habits-list">
                  {habits.map((habit, index) => (
                    <div key={index} className="landing-habit-item">
                      <div className={`landing-habit-checkbox ${habit.done ? 'done' : ''}`}>
                        {habit.done && <CheckCircle />}
                      </div>
                      <span className={`landing-habit-name ${habit.done ? 'done' : ''}`}>
                        {habit.name}
                      </span>
                      <span className="landing-habit-category">{habit.category}</span>
                      <span className="landing-habit-points">+{habit.points}</span>
                    </div>
                  ))}
                </div>

                <div className="landing-progress-bar">
                  <div className="landing-progress-track">
                    <div className="landing-progress-fill"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-subtitle">
              Four simple steps to start building the discipline you want.
            </p>
          </div>

          <div className="landing-journey-grid">
            {journeySteps.map((item, index) => (
              <div key={index} className="landing-journey-card">
                <div className="landing-journey-step">{item.step}</div>
                <div className="landing-journey-icon">
                  <item.icon />
                </div>
                <h3 className="landing-journey-title">{item.title}</h3>
                <p className="landing-journey-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.02))' }}>
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Built for Real Discipline</h2>
            <p className="landing-section-subtitle">
              Every feature is designed to help you stay honest and consistent.
            </p>
          </div>

          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="landing-features-card">
                <div className={`landing-features-icon ${feature.color}`}>
                  <feature.icon />
                </div>
                <h3 className="landing-features-title">{feature.title}</h3>
                <p className="landing-features-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="landing-section">
        <div className="landing-why">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Why SigmaLog?</h2>
            <p className="landing-section-subtitle">
              This isn't another motivational app. It's an honest mirror.
            </p>
          </div>

          <div className="landing-why-list">
            {whyItems.map((item, index) => (
              <div key={index} className="landing-why-card">
                <div className="landing-why-emoji">{item.emoji}</div>
                <div>
                  <h3 className="landing-why-title">{item.title}</h3>
                  <p className="landing-why-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <div className="landing-cta-card">
            <div className="landing-cta-glow-1"></div>
            <div className="landing-cta-glow-2"></div>

            <div className="landing-cta-content">
              <h2 className="landing-cta-title">Ready to Build Your Discipline?</h2>
              <p className="landing-cta-text">
                Create your habits, track your progress, and become who you want to be.
              </p>

              <form onSubmit={handleSubmit} className="landing-cta-form">
                <button type="submit" className="landing-cta-submit w-full">
                  Start Free
                  <ArrowRight className="landing-btn-arrow" />
                </button>
              </form>

              <p className="landing-cta-note">No credit card required. Just your commitment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-copy">© 2026 SigmaLog — Build discipline, track progress</div>
          <div className="landing-footer-links">
            <button type="button" onClick={onGetStarted} className="landing-footer-link">
              Get Started
            </button>
            <a href="#how-it-works" className="landing-footer-link">
              How It Works
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
