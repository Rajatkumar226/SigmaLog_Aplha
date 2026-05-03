import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Header } from './Header';
import { ShadowStats } from './ShadowStats';
import * as excuseService from '../services/excuseService';
import type { Habit, DailyLog } from '../App';
import '../styles/ExcuseWall.scss';

interface ProgressScreenProps {
  habits: Habit[];
  dailyLogs: DailyLog[];
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Body: '#3b82f6',
  Mind: '#a855f7',
  Career: '#f59e0b',
  Discipline: '#10b981',
};

export function ProgressScreen({ habits, dailyLogs, onNavigate }: ProgressScreenProps) {
  const [weekExcuses, setWeekExcuses] = useState<excuseService.ExcuseRecord[]>([]);

  useEffect(() => {
    excuseService.getWeekExcuses().then(setWeekExcuses);
  }, []);
  // Get last 7 days of data
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(l => l.date === dateStr);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      days.push({
        day: dayName,
        score: log?.score || 0,
        maxScore: log?.maxScore || 0,
        percentage: log && log.maxScore > 0 ? Math.round((log.score / log.maxScore) * 100) : 0,
      });
    }
    return days;
  };

  // Get last 30 days for trend
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(l => l.date === dateStr);
      
      days.push({
        date: date.getDate(),
        percentage: log && log.maxScore > 0 ? Math.round((log.score / log.maxScore) * 100) : 0,
      });
    }
    return days;
  };

  // Calculate category distribution
  const getCategoryDistribution = () => {
    const categoryTotals: Record<string, number> = {
      Body: 0,
      Mind: 0,
      Career: 0,
      Discipline: 0,
    };

    habits.forEach(habit => {
      categoryTotals[habit.category] += habit.points;
    });

    return Object.entries(categoryTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // Calculate best and worst habits
  const getHabitPerformance = () => {
    const habitStats = habits.map(habit => {
      const completions = dailyLogs.filter(log => 
        log.completedHabits.includes(habit.id)
      ).length;
      const totalDays = dailyLogs.length || 1;
      const completionRate = Math.round((completions / totalDays) * 100);
      
      return {
        name: habit.name,
        completionRate,
        completions,
        category: habit.category,
      };
    });

    return habitStats.sort((a, b) => b.completionRate - a.completionRate);
  };

  const weekData = getLast7Days();
  const monthData = getLast30Days();
  const categoryData = getCategoryDistribution();
  const habitPerformance = getHabitPerformance();

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header onNavigate={onNavigate} currentScreen="progress" />

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
          >
            <p className="text-sm text-gray-400 mb-2">Total Days Logged</p>
            <p className="text-3xl">{dailyLogs.length}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/5 border border-green-500/20 rounded-lg p-4 sm:p-6"
          >
            <p className="text-sm text-gray-400 mb-2">Perfect Days</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl">{dailyLogs.filter(log => log.score === log.maxScore).length}</p>
              <Award className="w-5 h-5 text-green-400" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
          >
            <p className="text-sm text-gray-400 mb-2">Total Habits</p>
            <p className="text-3xl">{habits.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 border border-blue-500/20 rounded-lg p-4 sm:p-6"
          >
            <p className="text-sm text-gray-400 mb-2">Avg Completion</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl">
                {dailyLogs.length > 0 
                  ? Math.round(dailyLogs.reduce((sum, log) => sum + (log.score / log.maxScore) * 100, 0) / dailyLogs.length)
                  : 0}%
              </p>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Weekly Discipline Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
            >
              <h3 className="mb-6">Weekly Discipline Score</h3>
              
              {weekData.every(d => d.score === 0) ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400">No data logged this week.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#666"
                      tick={{ fill: '#999' }}
                    />
                    <YAxis 
                      stroke="#666"
                      tick={{ fill: '#999' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1f35',
                        border: '1px solid #ffffff20',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar 
                      dataKey="score" 
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* 30-Day Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
            >
              <h3 className="mb-6">30-Day Completion Trend</h3>
              
              {monthData.every(d => d.percentage === 0) ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400">No data available for the last 30 days.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tick={{ fill: '#999' }}
                    />
                    <YAxis 
                      stroke="#666"
                      tick={{ fill: '#999' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1f35',
                        border: '1px solid #ffffff20',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value}%`, 'Completion']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* Right Column - Category Distribution & Habit Performance */}
          <div className="space-y-6 sm:space-y-8">
            {/* Category Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
            >
              <h3 className="mb-6">Category Focus</h3>
              
              {categoryData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-400 text-sm text-center">No habits defined yet.</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        animationDuration={800}
                        animationBegin={0}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1f35',
                          border: '1px solid #ffffff20',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2 mt-4">
                    {categoryData.map((category) => (
                      <div key={category.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: CATEGORY_COLORS[category.name] }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <span className="text-gray-400">{category.value} pts</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Habit Performance Ranking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6"
            >
              <h3 className="mb-4">Habit Performance</h3>
              
              {habitPerformance.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">No habits tracked yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {habitPerformance.map((habit, index) => (
                    <div key={habit.name} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                        index === 0 ? 'bg-green-500/20 text-green-400' :
                        index === habitPerformance.length - 1 ? 'bg-red-500/20 text-red-400' :
                        'bg-white/10 text-gray-400'
                      }`}>
                        #{index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{habit.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                habit.completionRate >= 75 ? 'bg-green-500' :
                                habit.completionRate >= 50 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                              style={{ width: `${habit.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">
                            {habit.completionRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Shadow Stats */}
        <div className="mt-6 sm:mt-8">
          <ShadowStats dailyLogs={dailyLogs} habits={habits} />
        </div>

        {/* Excuse Wall */}
        {weekExcuses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="excuse-wall"
          >
            <div className="excuse-wall__header">
              <h3 className="excuse-wall__title">Excuse Wall</h3>
              <span className="excuse-wall__badge">This week</span>
            </div>
            <p className="excuse-wall__subtitle">Your excuses, on record. Face them.</p>

            <div className="excuse-wall__list">
              {weekExcuses.map((excuse, i) => {
                const habit = habits.find(h => h.id === excuse.habit_id);
                const date = new Date(excuse.excuse_date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                });
                return (
                  <div key={excuse.id} className="excuse-wall__card">
                    <div className="excuse-wall__card-header">
                      <span className="excuse-wall__habit-name">
                        {habit?.name ?? 'Unknown habit'}
                      </span>
                      <span className="excuse-wall__date">{date}</span>
                    </div>
                    <p className="excuse-wall__excuse-text">{excuse.excuse_text}</p>
                  </div>
                );
              })}
            </div>

            <p className="excuse-wall__footer">
              {weekExcuses.length} excuse{weekExcuses.length !== 1 ? 's' : ''} this week. Every excuse is a choice.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}