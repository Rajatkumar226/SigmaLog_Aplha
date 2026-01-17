import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Header } from './Header';
import { StatsOverview } from './StatsOverview';
import { WeeklyOverview } from './WeeklyOverview';
import { MonthlyHeatmap } from './MonthlyHeatmap';
import { EmptyStatePrompt } from './EmptyStatePrompt';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ShareModal } from './ShareModal';
import type { Habit, DailyLog } from '../App';

interface MainDashboardProps {
  habits: Habit[];
  todayCompleted: string[];
  onToggleHabit: (habitId: string) => void;
  dailyLogs: DailyLog[];
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings') => void;
}

const categoryColors: Record<Habit['category'], string> = {
  Body: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Mind: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Career: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Discipline: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export function MainDashboard({
  habits,
  todayCompleted,
  onToggleHabit,
  dailyLogs,
  onNavigate,
}: MainDashboardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Scroll to calendar on mobile when toggled
  const scrollToCalendar = () => {
    const calendarElement = document.getElementById('monthly-calendar');
    if (calendarElement) {
      calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
    // On mobile, scroll to calendar when opening
    if (!showCalendar && window.innerWidth < 1024) {
      setTimeout(() => scrollToCalendar(), 100);
    }
  };

  const currentScore = habits
    .filter(h => todayCompleted.includes(h.id))
    .reduce((sum, h) => sum + h.points, 0);
  const maxScore = habits.reduce((sum, h) => sum + h.points, 0);

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    const sortedLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      if (log.score === log.maxScore) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  // Get identity status
  const getIdentityStatus = () => {
    const percentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    
    if (percentage === 100) return 'Sigma Mode 🗿';
    if (percentage >= 75) return 'Locked In 🔒';
    if (percentage >= 50) return 'Building 🔨';
    if (percentage > 0) return 'Starting ⚡';
    return 'Not Logged 📊';
  };

  // Get daily feedback
  const getDailyFeedback = () => {
    const percentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
    
    if (percentage === 100) return 'Sigma behavior detected 🗿';
    if (percentage >= 75) return 'You showed up. Improve tomorrow.';
    if (percentage >= 50) return 'Progress noted. Keep going.';
    if (percentage > 0) return 'Some effort. Aim higher.';
    
    // Check if streak was broken
    if (dailyLogs.length > 0 && streak === 0) {
      const lastLog = dailyLogs[dailyLogs.length - 1];
      if (lastLog.score < lastLog.maxScore) {
        return 'Streak broken. No drama. Restart.';
      }
    }
    
    return 'Nothing logged yet. The day is still alive.';
  };

  // Animate score count-up
  useEffect(() => {
    let start = 0;
    const duration = 600;
    const increment = currentScore / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= currentScore) {
        setDisplayScore(currentScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [currentScore]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8">
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts 
        habits={habits}
        onToggleHabit={onToggleHabit}
        onNavigate={onNavigate}
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header
          onNavigate={onNavigate}
          onShareClick={() => setShowShareModal(true)}
          onCalendarClick={handleCalendarToggle}
          showCalendar={showCalendar}
          currentScreen="dashboard"
        />

        {/* Stats Overview */}
        <div className="mb-6 sm:mb-8">
          <StatsOverview
            dailyLogs={dailyLogs}
            currentScore={currentScore}
            maxScore={maxScore}
            streak={streak}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left Column - Weekly Overview (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Weekly Overview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
            >
              <WeeklyOverview dailyLogs={dailyLogs} />
            </motion.div>

            {/* Today's Habits Checklist */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
            >
              <h3 className="mb-4">Today's Discipline</h3>
              
              {habits.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400">No rules defined yet. Define your discipline.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit, index) => {
                    const isCompleted = todayCompleted.includes(habit.id);
                    
                    return (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center gap-4 group relative"
                      >
                        {/* Keyboard shortcut hint */}
                        {index < 9 && (
                          <span className="absolute -left-8 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index + 1}
                          </span>
                        )}
                        
                        <button
                          onClick={() => onToggleHabit(habit.id)}
                          className="relative cursor-pointer"
                        >
                          <motion.div
                            whileTap={{ scale: 0.95 }}
                            className={`w-6 h-6 rounded border-2 transition-all ${
                              isCompleted
                                ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
                                : 'border-white/20 hover:border-white/40'
                            }`}
                          >
                            {isCompleted && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-full h-full p-0.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </motion.svg>
                            )}
                          </motion.div>
                        </button>

                        <span className={`flex-1 ${isCompleted ? 'text-gray-400' : ''}`}>
                          {habit.name}
                        </span>

                        <span
                          className={`px-2.5 py-1 border rounded-full text-xs ${categoryColors[habit.category]}`}
                          title={`Category: ${habit.category} - Helps organize your habits by life area`}
                        >
                          {habit.category}
                        </span>

                        <span
                          className="text-sm text-gray-400 w-8 text-right cursor-help"
                          title={`This habit is worth ${habit.points} point${habit.points > 1 ? 's' : ''} toward your daily goal`}
                        >
                          +{habit.points}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* First Time User Guide - Only show if no logs yet */}
            {dailyLogs.length === 0 && habits.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <EmptyStatePrompt />
              </motion.div>
            )}

            {/* Daily Feedback - Only show if there are logs */}
            {dailyLogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className={`bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 ${
                  currentScore === maxScore && maxScore > 0 ? 'bg-green-500/5 border-green-500/20' : ''
                }`}
              >
                <p className="text-sm text-gray-400 mb-2">Daily Feedback</p>
                <motion.p
                  key={getDailyFeedback()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-lg"
                >
                  {getDailyFeedback()}
                </motion.p>
              </motion.div>
            )}
          </div>

          {/* Right Column - Monthly Calendar (1/3 width on desktop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={`bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 ${
              showCalendar ? 'block' : 'hidden lg:block'
            }`}
          >
            <MonthlyHeatmap dailyLogs={dailyLogs} />
          </motion.div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          dailyLogs={dailyLogs}
        />
      )}
    </div>
  );
}