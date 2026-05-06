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

function StatTooltip({
  content,
  children,
  alignRight = false,
}: {
  content: string;
  children: React.ReactNode;
  alignRight?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
      >
        {children}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={`absolute pointer-events-none w-44
              ${alignRight ? 'right-0' : 'left-0'}`}
            style={{
              bottom: 'calc(100% + 10px)',
              background: 'linear-gradient(145deg, #1a2035, #111827)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '14px',
              padding: '10px 13px',
              zIndex: 9999,
              boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {/* Downward caret arrow at bottom of tooltip */}
            <div
              className={`absolute w-[10px] h-[10px] rotate-45
                ${alignRight ? 'right-4' : 'left-4'}`}
              style={{
                bottom: '-5px',
                background: '#1a2035',
                borderBottom: '1px solid rgba(255,255,255,0.14)',
                borderRight: '1px solid rgba(255,255,255,0.14)',
              }}
            />
            <p className="text-[11.5px] text-gray-300 leading-relaxed">{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StatsOverview({ dailyLogs, currentScore, maxScore, streak }: StatsOverviewProps) {
  const totalDays = dailyLogs.length;
  const perfectDays = dailyLogs.filter(log => log.score === log.maxScore).length;
  const completionRate = totalDays > 0 ? Math.round((perfectDays / totalDays) * 100) : 0;

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
      tooltip: 'Your score today. Each habit = 1–3 pts. Complete all to hit 100%.',
    },
    {
      label: 'Streak',
      value: `${streak}`,
      subValue: streak === 1 ? 'day' : 'days',
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      tooltip: 'Consecutive perfect days. Miss one and it resets to 0.',
    },
    {
      label: 'Weekly Avg',
      value: `${weeklyAvg}%`,
      subValue: last7Days.length > 0 ? `${last7Days.length} days` : 'No data',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      tooltip: 'Average completion over last 7 days. Aim for 80%+.',
    },
    {
      label: 'Perfect Days',
      value: `${perfectDays}`,
      subValue: `${completionRate}% rate`,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      tooltip: 'Days you hit 100% of habits. Your true discipline score.',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`bg-white/5 border ${stat.borderColor} rounded-2xl p-3.5 sm:p-4 hover:bg-white/[0.07] transition-all hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-3">
            <StatTooltip content={stat.tooltip} alignRight={index % 2 === 1}>
              <div className="flex items-center gap-1.5 cursor-help group">
                <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
                <HelpCircle className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            </StatTooltip>
            <div className={`p-1.5 ${stat.bgColor} rounded-lg`}>
              <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
            </div>
          </div>

          <div>
            <p className="text-xl sm:text-2xl font-semibold mb-0.5">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.subValue}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
