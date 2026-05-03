import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Settings, Share2, TrendingUp, Flame, Trophy } from 'lucide-react';
import type { Habit, DailyLog } from '../App';
import { toast } from 'sonner@2.0.3';
import Confetti from 'react-confetti';

interface DashboardGridProps {
  habits: Habit[];
  dailyLogs: DailyLog[];
  onToggleHabit: (date: string, habitId: string) => void;
  onNavigate: (screen: 'dashboard' | 'reports' | 'settings') => void;
  onShare: () => void;
}

const categoryColors: Record<Habit['category'], string> = {
  Body: 'bg-blue-500/20 text-blue-400',
  Mind: 'bg-purple-500/20 text-purple-400',
  Career: 'bg-amber-500/20 text-amber-400',
  Discipline: 'bg-green-500/20 text-green-400',
};

const motivationalMessages = [
  'Sigma behavior detected 🗿',
  'Locked in. Keep going. 🔒',
  'You're building an empire 👑',
  'Discipline is your superpower ⚡',
  'Consistency > Everything 💪',
  'Future you is proud 🎯',
  'No excuses. Just execution. 🔥',
  'You showed up. That's what matters. ✨',
  'Beast mode activated 🦁',
  'This is how legends are made 🌟',
];

const streakMessages = [
  'Your streak is fire! 🔥',
  'Unstoppable energy! ⚡',
  'Consistency champion! 👑',
  'On a mission! 🚀',
  'Pure discipline! 💎',
];

export function DashboardGrid({
  habits,
  dailyLogs,
  onToggleHabit,
  onNavigate,
  onShare,
}: DashboardGridProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Get dates for the grid
  const getDates = () => {
    const dates = [];
    const daysToShow = selectedPeriod === 'week' ? 7 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dates = getDates();
  const today = new Date().toISOString().split('T')[0];

  // Calculate stats
  const calculateStreak = () => {
    let streak = 0;
    const sortedLogs = [...dailyLogs]
      .sort((a, b) => b.date.localeCompare(a.date));
    
    for (const log of sortedLogs) {
      if (log.score === log.maxScore && log.maxScore > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();
  const todayLog = dailyLogs.find(l => l.date === today);
  const todayScore = todayLog?.score || 0;
  const maxScore = habits.reduce((sum, h) => sum + h.points, 0);
  const todayPercentage = maxScore > 0 ? (todayScore / maxScore) * 100 : 0;

  // Calculate total completion rate
  const totalCompletionRate = () => {
    if (dailyLogs.length === 0) return 0;
    const perfectDays = dailyLogs.filter(log => log.score === log.maxScore && log.maxScore > 0).length;
    return Math.round((perfectDays / dailyLogs.length) * 100);
  };

  // Check if habit is completed for a date
  const isCompleted = (date: string, habitId: string) => {
    const log = dailyLogs.find(l => l.date === date);
    return log?.completedHabits.includes(habitId) || false;
  };

  // Handle habit toggle with celebration
  const handleToggle = (date: string, habitId: string) => {
    onToggleHabit(date, habitId);
    
    // Check if this completes all habits for today
    if (date === today) {
      const currentLog = dailyLogs.find(l => l.date === today);
      const currentCompleted = currentLog?.completedHabits || [];
      const willBeCompleted = currentCompleted.includes(habitId)
        ? currentCompleted.length - 1
        : currentCompleted.length + 1;
      
      if (willBeCompleted === habits.length && !currentCompleted.includes(habitId)) {
        setShowConfetti(true);
        const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        toast.success(message, {
          duration: 3000,
        });
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  // Show streak milestone celebrations
  useEffect(() => {
    if (streak > 0 && streak % 7 === 0) {
      const message = streakMessages[Math.floor(Math.random() * streakMessages.length)];
      toast.success(`${streak} day streak! ${message}`, {
        duration: 4000,
      });
    }
  }, [streak]);

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1">SigmaLog</h1>
            <p className="text-sm text-gray-400">Your Discipline Dashboard</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <Flame className="w-8 h-8 text-orange-500/30" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Current Streak</p>
            <p className="text-4xl mb-1">{streak}</p>
            <p className="text-xs text-orange-400">🔥 days strong</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <TrendingUp className="w-8 h-8 text-green-500/30" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Today's Score</p>
            <p className="text-4xl mb-1">{todayScore}<span className="text-xl text-gray-500">/{maxScore}</span></p>
            <p className="text-xs text-green-400">{todayPercentage.toFixed(0)}% complete</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <Trophy className="w-8 h-8 text-blue-500/30" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Total Habits</p>
            <p className="text-4xl mb-1">{habits.length}</p>
            <p className="text-xs text-blue-400">tracked daily</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <BarChart3 className="w-8 h-8 text-purple-500/30" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Completion Rate</p>
            <p className="text-4xl mb-1">{totalCompletionRate()}<span className="text-xl">%</span></p>
            <p className="text-xs text-purple-400">perfect days</p>
          </motion.div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-400">View:</span>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              selectedPeriod === 'week'
                ? 'bg-white text-black'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              selectedPeriod === 'month'
                ? 'bg-white text-black'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            Month
          </button>
        </div>

        {/* Excel-Style Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="sticky left-0 bg-[#0f1420] border-r border-b border-white/10 px-4 py-3 text-left text-sm min-w-[200px]">
                    Habit
                  </th>
                  {dates.map((date) => {
                    const d = new Date(date);
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = d.getDate();
                    const isToday = date === today;
                    
                    return (
                      <th
                        key={date}
                        className={`border-l border-b border-white/10 px-3 py-3 text-center text-xs min-w-[60px] ${
                          isToday ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        <div className={isToday ? 'text-blue-400' : 'text-gray-400'}>
                          {dayName}
                        </div>
                        <div className={isToday ? 'text-blue-400 font-bold' : ''}>
                          {dayNum}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, habitIndex) => (
                  <motion.tr
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: habitIndex * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="sticky left-0 bg-[#0a0e1a] border-r border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{habit.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[habit.category]}`}>
                          {habit.category}
                        </span>
                        <span className="text-xs text-gray-500">+{habit.points}</span>
                      </div>
                    </td>
                    {dates.map((date) => {
                      const completed = isCompleted(date, habit.id);
                      const isToday = date === today;
                      const isFuture = new Date(date) > new Date(today);
                      
                      return (
                        <td
                          key={date}
                          className={`border-l border-b border-white/10 px-3 py-3 text-center ${
                            isToday ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          {!isFuture && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleToggle(date, habit.id)}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                completed
                                  ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50'
                                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                              }`}
                            >
                              {completed && (
                                <motion.svg
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="w-full h-full p-1"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="3"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </motion.svg>
                              )}
                            </motion.button>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
                
                {/* Total Score Row */}
                <tr className="bg-white/10 font-semibold">
                  <td className="sticky left-0 bg-[#0f1420] border-r border-t-2 border-white/20 px-4 py-3">
                    Daily Score
                  </td>
                  {dates.map((date) => {
                    const log = dailyLogs.find(l => l.date === date);
                    const score = log?.score || 0;
                    const max = log?.maxScore || maxScore;
                    const percentage = max > 0 ? (score / max) * 100 : 0;
                    const isToday = date === today;
                    const isFuture = new Date(date) > new Date(today);
                    
                    return (
                      <td
                        key={date}
                        className={`border-l border-t-2 border-white/20 px-3 py-3 text-center text-sm ${
                          isToday ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        {!isFuture && score > 0 && (
                          <div>
                            <div className={percentage === 100 ? 'text-green-400' : ''}>
                              {score}
                            </div>
                            {percentage === 100 && <div className="text-xs">🎯</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Motivational Footer */}
        <AnimatePresence mode="wait">
          {todayPercentage === 100 && maxScore > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 text-center"
            >
              <p className="text-2xl mb-2">🎉 Perfect Day Complete!</p>
              <p className="text-gray-300">
                {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
