import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './Header';
import { StatsOverview } from './StatsOverview';
import { WeeklyOverview } from './WeeklyOverview';
import { MonthlyHeatmap } from './MonthlyHeatmap';
import { EmptyStatePrompt } from './EmptyStatePrompt';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ShareProgressModal } from './ShareProgressModal';
import * as excuseService from '../services/excuseService';
import { toast } from 'sonner';
import type { Habit, DailyLog } from '../App';
import '../styles/HabitSection.scss';

interface MainDashboardProps {
  habits: Habit[];
  todayCompleted: string[];
  onToggleHabit: (habitId: string) => void;
  dailyLogs: DailyLog[];
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings') => void;
  capsuleStatus: 'none' | 'pending' | 'ready';
  capsuleDaysLeft: number;
  onWriteCapsule: () => void;
  onOpenCapsule: () => void;
}

export function MainDashboard({
  habits,
  todayCompleted,
  onToggleHabit,
  dailyLogs,
  onNavigate,
  capsuleStatus,
  capsuleDaysLeft,
  onWriteCapsule,
  onOpenCapsule,
}: MainDashboardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [todayExcuses, setTodayExcuses] = useState<Record<string, string>>({});
  const [showExcuseFor, setShowExcuseFor] = useState<string | null>(null);
  const [excuseInput, setExcuseInput] = useState('');
  const [submittingExcuse, setSubmittingExcuse] = useState(false);

  useEffect(() => {
    excuseService.getTodayExcuses().then(setTodayExcuses);
  }, []);

  useEffect(() => {
    setExcuseInput('');
  }, [showExcuseFor]);

  const handleSubmitExcuse = async (habitId: string) => {
    if (!excuseInput.trim() || submittingExcuse) return;
    setSubmittingExcuse(true);
    const result = await excuseService.addExcuse(habitId, excuseInput);
    if (result.success) {
      setTodayExcuses(prev => ({ ...prev, [habitId]: excuseInput.trim() }));
      setShowExcuseFor(null);
      setExcuseInput('');
      toast.success('Excuse logged. Face it tomorrow.');
    } else {
      toast.error(result.error || 'Failed to log excuse');
    }
    setSubmittingExcuse(false);
  };

  const handleRemoveExcuse = async (habitId: string) => {
    const ok = await excuseService.deleteExcuse(habitId);
    if (ok) {
      setTodayExcuses(prev => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
    }
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
    if (!showCalendar && window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('monthly-calendar')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const currentScore = habits
    .filter(h => todayCompleted.includes(h.id))
    .reduce((sum, h) => sum + h.points, 0);
  const maxScore = habits.reduce((sum, h) => sum + h.points, 0);

  const calculateStreak = () => {
    let streak = 0;
    const sorted = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sorted) {
      if (log.score === log.maxScore) streak++;
      else break;
    }
    return streak;
  };
  const streak = calculateStreak();

  const getIdentityStatus = () => {
    const pct = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    if (pct === 100) return 'Sigma Mode 🗿';
    if (pct >= 75)   return 'Locked In 🔒';
    if (pct >= 50)   return 'Building 🔨';
    if (pct > 0)     return 'Starting ⚡';
    return 'Not Logged 📊';
  };

  const getDailyFeedback = () => {
    const pct = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    if (pct === 100) return 'Sigma behavior detected 🗿';
    if (pct >= 75)   return 'You showed up. Improve tomorrow.';
    if (pct >= 50)   return 'Progress noted. Keep going.';
    if (pct > 0)     return 'Some effort. Aim higher.';
    if (dailyLogs.length > 0 && streak === 0) {
      const last = dailyLogs[dailyLogs.length - 1];
      if (last.score < last.maxScore) return 'Streak broken. No drama. Restart.';
    }
    return 'Nothing logged yet. The day is still alive.';
  };

  useEffect(() => {
    let start = 0;
    const increment = currentScore / (600 / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= currentScore) { setDisplayScore(currentScore); clearInterval(timer); }
      else setDisplayScore(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [currentScore]);

  const isPerfectDay = maxScore > 0 && currentScore === maxScore;

  const getCategoryClass = (category: string) => {
    const known = ['Body', 'Mind', 'Career', 'Discipline'];
    return known.includes(category) ? `habit-row__category--${category}` : 'habit-row__category--default';
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div style={{
        position: 'fixed', top: '10%', left: '-8%',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '15%', right: '-6%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {isPerfectDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
            width: '500px', height: '500px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }}
        />
      )}

      <KeyboardShortcuts habits={habits} onToggleHabit={onToggleHabit} onNavigate={onNavigate} />

      <div className="max-w-7xl mx-auto relative z-10">
        <Header
          onNavigate={onNavigate}
          onShareClick={() => setShowShareModal(true)}
          onCalendarClick={handleCalendarToggle}
          showCalendar={showCalendar}
          currentScreen="dashboard"
        />

        <div className="mb-6 sm:mb-8">
          <StatsOverview
            dailyLogs={dailyLogs}
            currentScore={currentScore}
            maxScore={maxScore}
            streak={streak}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            {/* Weekly Overview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px' }}
            >
              <WeeklyOverview dailyLogs={dailyLogs} />
            </motion.div>

            {/* Today's Discipline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
              className={`habit-section${isPerfectDay ? ' habit-section--perfect' : ''}`}
            >
              <div className="habit-section__header">
                <h3 className="habit-section__title">Today's Discipline</h3>
                {maxScore > 0 && (
                  <div className="habit-section__score">
                    <span
                      className="habit-section__score-val"
                      style={{ color: isPerfectDay ? '#10b981' : '#6b7280' }}
                    >
                      {currentScore} / {maxScore}
                    </span>
                    <span className="habit-section__score-unit">pts</span>
                  </div>
                )}
              </div>

              {habits.length === 0 ? (
                <p className="habit-section__empty">No habits defined. Define your discipline.</p>
              ) : (
                <div className="habit-section__list">
                  {habits.map((habit, index) => {
                    const isCompleted     = todayCompleted.includes(habit.id);
                    const hasExcuse       = !!todayExcuses[habit.id];
                    const isShowingExcuse = showExcuseFor === habit.id;

                    return (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                        className="habit-row"
                      >
                        {/* Main row */}
                        <div
                          className={[
                            'habit-row__main',
                            isCompleted     ? 'habit-row__main--completed' : '',
                            isShowingExcuse ? 'habit-row__main--excusing'  : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {/* Keyboard hint */}
                          {index < 9 && (
                            <span className="habit-row__shortcut">{index + 1}</span>
                          )}

                          {/* Checkbox */}
                          <button
                            onClick={() => onToggleHabit(habit.id)}
                            className={`habit-row__checkbox${isCompleted ? ' habit-row__checkbox--checked' : ''}`}
                          >
                            <AnimatePresence>
                              {isCompleted && (
                                <motion.svg
                                  key="check"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </motion.svg>
                              )}
                            </AnimatePresence>
                          </button>

                          {/* Name */}
                          <span className={`habit-row__name${isCompleted ? ' habit-row__name--done' : ''}`}>
                            {habit.name}
                          </span>

                          {/* Category badge */}
                          <span className={`habit-row__category ${getCategoryClass(habit.category)}`}>
                            {habit.category}
                          </span>

                          {/* Points */}
                          <span className="habit-row__points">+{habit.points}</span>

                          {/* Excuse trigger */}
                          {!isCompleted && !hasExcuse && !isShowingExcuse && (
                            <button
                              className="habit-row__excuse-trigger"
                              onClick={() => setShowExcuseFor(habit.id)}
                              title="Log a reason for skipping"
                            >
                              excuse
                            </button>
                          )}

                          {/* Excused badge */}
                          {!isCompleted && hasExcuse && (
                            <button
                              className="habit-row__excused-badge"
                              onClick={() => handleRemoveExcuse(habit.id)}
                              title={`Excuse: ${todayExcuses[habit.id]}`}
                            >
                              excused
                            </button>
                          )}

                          {/* Cancel excuse input */}
                          {isShowingExcuse && (
                            <button
                              className="habit-row__excuse-cancel-x"
                              onClick={() => setShowExcuseFor(null)}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Excuse input panel */}
                        <AnimatePresence>
                          {isShowingExcuse && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="habit-row__excuse-panel"
                            >
                              <div className="habit-row__excuse-inner">
                                <textarea
                                  autoFocus
                                  value={excuseInput}
                                  onChange={(e) => setExcuseInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSubmitExcuse(habit.id);
                                    }
                                    if (e.key === 'Escape') setShowExcuseFor(null);
                                  }}
                                  placeholder={`Why are you skipping ${habit.name}?`}
                                  className="habit-row__excuse-textarea"
                                  rows={2}
                                />
                                <div className="habit-row__excuse-actions">
                                  <button
                                    onClick={() => handleSubmitExcuse(habit.id)}
                                    disabled={!excuseInput.trim() || submittingExcuse}
                                    className="habit-row__excuse-submit"
                                  >
                                    {submittingExcuse ? 'Saving...' : 'Submit'}
                                  </button>
                                  <button
                                    onClick={() => setShowExcuseFor(null)}
                                    className="habit-row__excuse-cancel-btn"
                                  >
                                    Cancel
                                  </button>
                                  <span className="habit-row__excuse-hint">Enter to submit</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Empty state guide */}
            {dailyLogs.length === 0 && habits.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <EmptyStatePrompt />
              </motion.div>
            )}

            {/* Daily Feedback */}
            {dailyLogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.28 }}
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: isPerfectDay ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                  border: isPerfectDay ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '18px',
                }}
              >
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Daily Verdict</p>
                <motion.p
                  key={getDailyFeedback()}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-medium"
                  style={{ color: isPerfectDay ? '#34d399' : '#e5e7eb' }}
                >
                  {getDailyFeedback()}
                </motion.p>
                <p className="text-xs text-gray-400 mt-1">{getIdentityStatus()}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Time Capsule Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22 }}
            >
              <TimeCapsuleCard
                status={capsuleStatus}
                daysLeft={capsuleDaysLeft}
                onWrite={onWriteCapsule}
                onOpen={onOpenCapsule}
              />
            </motion.div>

            {/* Monthly Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
              className={showCalendar ? 'block' : 'hidden lg:block'}
            >
              <MonthlyHeatmap
                dailyLogs={dailyLogs}
                joinDate={dailyLogs[0]?.date}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareProgressModal
          streak={streak}
          dailyLogs={dailyLogs}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// ── Time Capsule Status Card ──────────────────────────────────────────────────

interface TimeCapsuleCardProps {
  status: 'none' | 'pending' | 'ready';
  daysLeft: number;
  onWrite: () => void;
  onOpen: () => void;
}

function TimeCapsuleCard({ status, daysLeft, onWrite, onOpen }: TimeCapsuleCardProps) {
  if (status === 'ready') {
    return (
      <div className="capsule-card capsule-card--ready" onClick={onOpen}>
        <div className="capsule-card__label-row">
          <span className="capsule-card__icon--wobble">✉️</span>
          <span className="capsule-card__label capsule-card__label--ready">Letter Arrived</span>
        </div>
        <p className="capsule-card__title">Your capsule is ready.</p>
        <p className="capsule-card__desc">A message from your past self is waiting.</p>
        <button className="capsule-card__open-btn">Open Your Letter →</button>
      </div>
    );
  }

  if (status === 'pending') {
    const totalDays = daysLeft <= 30 ? 30 : daysLeft <= 60 ? 60 : 90;
    const progress  = Math.max(0, ((totalDays - daysLeft) / totalDays) * 100);

    return (
      <div className="capsule-card capsule-card--pending">
        <div className="capsule-card__label-row">
          <span className="capsule-card__icon">🔒</span>
          <span className="capsule-card__label capsule-card__label--muted">Capsule Sealed</span>
        </div>
        <p className="capsule-card__title">Your letter is waiting.</p>
        <p className="capsule-card__desc">
          Opens in <span className="highlight">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>.
        </p>
        <div className="capsule-card__progress-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="capsule-card__progress-fill"
          />
        </div>
        <p className="capsule-card__progress-label">{Math.round(progress)}% of the way</p>
      </div>
    );
  }

  return (
    <div className="capsule-card capsule-card--none">
      <div className="capsule-card__label-row">
        <span className="capsule-card__icon">📦</span>
        <span className="capsule-card__label capsule-card__label--muted">Time Capsule</span>
      </div>
      <p className="capsule-card__title">Write to your future self.</p>
      <p className="capsule-card__desc">Sealed today. Opened in 30 days. No peeking.</p>
      <button className="capsule-card__write-btn" onClick={onWrite}>
        Write Your Letter →
      </button>
    </div>
  );
}
