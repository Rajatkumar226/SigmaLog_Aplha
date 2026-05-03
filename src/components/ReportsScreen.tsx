import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, TrendingUp, Award, Target, Share2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import type { Habit, DailyLog } from '../App';

interface ReportsScreenProps {
  habits: Habit[];
  dailyLogs: DailyLog[];
  onNavigate: (screen: 'dashboard') => void;
  onShare: () => void;
}

type Period = 'week' | 'month' | 'quarter' | 'halfyear' | 'year';

const CATEGORY_COLORS: Record<string, string> = {
  Body: '#3b82f6',
  Mind: '#a855f7',
  Career: '#f59e0b',
  Discipline: '#10b981',
};

export function ReportsScreen({ habits, dailyLogs, onNavigate, onShare }: ReportsScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  const periods: { key: Period; label: string; days: number }[] = [
    { key: 'week', label: 'Week', days: 7 },
    { key: 'month', label: 'Month', days: 30 },
    { key: 'quarter', label: 'Quarter', days: 90 },
    { key: 'halfyear', label: 'Half Year', days: 180 },
    { key: 'year', label: 'Year', days: 365 },
  ];

  const currentPeriod = periods.find(p => p.key === selectedPeriod)!;

  // Get data for selected period
  const getPeriodData = () => {
    const data = [];
    const days = currentPeriod.days;
    const groupSize = days <= 30 ? 1 : days <= 90 ? 7 : 30;

    for (let i = days - 1; i >= 0; i -= groupSize) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - i);
      
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - groupSize + 1);

      let totalScore = 0;
      let totalMax = 0;
      let daysInRange = 0;

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const log = dailyLogs.find(l => l.date === dateStr);
        if (log && log.maxScore > 0) {
          totalScore += log.score;
          totalMax += log.maxScore;
          daysInRange++;
        }
      }

      const avgScore = daysInRange > 0 ? Math.round(totalScore / daysInRange) : 0;
      const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

      data.push({
        date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: avgScore,
        percentage,
      });
    }

    return data;
  };

  // Calculate category breakdown
  const getCategoryBreakdown = () => {
    const categoryTotals: Record<string, { completed: number; total: number }> = {
      Body: { completed: 0, total: 0 },
      Mind: { completed: 0, total: 0 },
      Career: { completed: 0, total: 0 },
      Discipline: { completed: 0, total: 0 },
    };

    const daysToCheck = currentPeriod.days;
    const today = new Date();

    for (let i = 0; i < daysToCheck; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = dailyLogs.find(l => l.date === dateStr);

      habits.forEach(habit => {
        categoryTotals[habit.category].total++;
        if (log?.completedHabits.includes(habit.id)) {
          categoryTotals[habit.category].completed++;
        }
      });
    }

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        completed: data.completed,
        total: data.total,
      }))
      .filter(d => d.total > 0);
  };

  // Calculate streak and stats
  const calculateStats = () => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let perfectDays = 0;
    let totalLogged = 0;

    const sortedLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));

    // Calculate current streak
    for (const log of sortedLogs) {
      if (log.score === log.maxScore && log.maxScore > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak and other stats
    sortedLogs.forEach(log => {
      if (log.maxScore > 0) {
        totalLogged++;
        if (log.score === log.maxScore) {
          perfectDays++;
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
    });

    const completionRate = totalLogged > 0 ? Math.round((perfectDays / totalLogged) * 100) : 0;

    return {
      currentStreak,
      longestStreak,
      perfectDays,
      totalLogged,
      completionRate,
    };
  };

  const periodData = getPeriodData();
  const categoryData = getCategoryBreakdown();
  const stats = calculateStats();

  // Get achievement badges
  const getAchievements = () => {
    const achievements = [];

    if (stats.currentStreak >= 7) achievements.push({ icon: '🔥', text: '7 Day Streak', color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' });
    if (stats.currentStreak >= 30) achievements.push({ icon: '💎', text: '30 Day Streak', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' });
    if (stats.currentStreak >= 100) achievements.push({ icon: '👑', text: '100 Day Streak', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' });
    if (stats.completionRate >= 80) achievements.push({ icon: '⚡', text: '80% Master', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' });
    if (stats.perfectDays >= 50) achievements.push({ icon: '🎯', text: '50 Perfect Days', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' });
    if (stats.totalLogged >= 365) achievements.push({ icon: '🏆', text: 'Year Warrior', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30' });

    return achievements;
  };

  const achievements = getAchievements();

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl">Progress Reports</h2>
              <p className="text-sm text-gray-400">Analyze your discipline journey</p>
            </div>
          </div>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share Report
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {periods.map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-5 py-2.5 rounded-lg text-sm transition-all ${
                selectedPeriod === period.key
                  ? 'bg-white text-black shadow-lg'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <p className="text-sm text-gray-400">Current Streak</p>
            </div>
            <p className="text-3xl">{stats.currentStreak}</p>
            <p className="text-xs text-orange-400 mt-1">days in a row</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-gray-400">Longest Streak</p>
            </div>
            <p className="text-3xl">{stats.longestStreak}</p>
            <p className="text-xs text-blue-400 mt-1">personal best</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <p className="text-sm text-gray-400">Perfect Days</p>
            </div>
            <p className="text-3xl">{stats.perfectDays}</p>
            <p className="text-xs text-green-400 mt-1">100% completion</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <p className="text-sm text-gray-400">Completion Rate</p>
            </div>
            <p className="text-3xl">{stats.completionRate}%</p>
            <p className="text-xs text-purple-400 mt-1">overall success</p>
          </motion.div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6"
          >
            <h3 className="mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Achievements Unlocked
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${achievement.color} border rounded-lg p-4 text-center`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="text-xs">{achievement.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Score Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h3 className="mb-6">Score Trend - {currentPeriod.label}</h3>
            {periodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fill: '#999' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f35',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data for this period
              </div>
            )}
          </motion.div>

          {/* Completion Percentage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h3 className="mb-6">Completion % - {currentPeriod.label}</h3>
            {periodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fill: '#999' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f35',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data for this period
              </div>
            )}
          </motion.div>
        </div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h3 className="mb-6">Category Performance - {currentPeriod.label}</h3>
          {categoryData.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={categoryData}>
                  <PolarGrid stroke="#ffffff20" />
                  <PolarAngleAxis dataKey="category" stroke="#999" tick={{ fill: '#999' }} />
                  <Radar
                    name="Completion %"
                    dataKey="percentage"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    animationDuration={1000}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                {categoryData.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                        />
                        <span className="text-sm">{cat.category}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {cat.completed}/{cat.total}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                      />
                    </div>
                    <p className="text-right text-xs text-gray-400 mt-1">{cat.percentage}%</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data for this period
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
