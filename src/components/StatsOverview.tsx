import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, Flame, Calendar, HelpCircle } from 'lucide-react';
import type { DailyLog } from '../App';

interface StatsOverviewProps {
  dailyLogs: DailyLog[];
  currentScore: number;
  maxScore: number;
  streak: number;
}

// Simple inline tooltip component for stats
function StatTooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-2 px-3 py-2 bg-[#1a1f2e] border border-white/20 rounded-lg shadow-xl w-48"
          >
            <p className="text-xs text-gray-200 leading-relaxed">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StatsOverview({ dailyLogs, currentScore, maxScore, streak }: StatsOverviewProps) {
  // Calculate stats
  const totalDays = dailyLogs.length;
  const perfectDays = dailyLogs.filter(log => log.score === log.maxScore).length;
  const completionRate = totalDays > 0 ? Math.round((perfectDays / totalDays) * 100) : 0;

  // Calculate weekly average
  const last7Days = dailyLogs.slice(-7);
  const weeklyAvg = last7Days.length > 0
    ? Math.round(last7Days.reduce((sum, log) => sum + (log.score / log.maxScore) * 100, 0) / last7Days.length)
    : 0;

  const stats = [
    {
      label: 'Today',
      value: `${currentScore}/${maxScore}`,
      subValue: maxScore > 0 ? `${Math.round((currentScore / maxScore) * 100)}%` : '0%',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      tooltip: 'Points completed today. Each habit has 1-3 points based on difficulty. Complete all to reach 100%.',
    },
    {
      label: 'Streak',
      value: `${streak}`,
      subValue: streak === 1 ? 'day' : 'days',
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      tooltip: 'Consecutive days with 100% completion. Miss a day or skip habits and your streak resets to 0.',
    },
    {
      label: 'Weekly Avg',
      value: `${weeklyAvg}%`,
      subValue: last7Days.length > 0 ? `${last7Days.length} days` : 'No data',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      tooltip: 'Your average completion rate over the last 7 days. Aim for 80%+ to build strong habits.',
    },
    {
      label: 'Perfect Days',
      value: `${perfectDays}`,
      subValue: `${completionRate}% rate`,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      tooltip: 'Days where you completed 100% of your habits. The more perfect days, the stronger your discipline.',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`bg-white/5 border ${stat.borderColor} rounded-lg p-4 hover:bg-white/[0.07] transition-all hover:shadow-lg hover:shadow-${stat.color}/5`}
        >
          <div className="flex items-start justify-between mb-3">
            <StatTooltip content={stat.tooltip}>
              <div className="flex items-center gap-1.5 cursor-help group">
                <p className="text-sm text-gray-400">{stat.label}</p>
                <HelpCircle className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            </StatTooltip>
            <div className={`p-1.5 ${stat.bgColor} rounded`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>

          <div>
            <p className="text-2xl font-semibold mb-0.5">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.subValue}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
