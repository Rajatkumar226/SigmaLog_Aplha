import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, Flame, Calendar, HelpCircle } from 'lucide-react';
import type { DailyLog } from '../App';

interface StatsOverviewProps {
  dailyLogs: DailyLog[];
  currentScore: number;
  maxScore: number;
  streak: number;
}

const TOOLTIP_WIDTH = 180;

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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const rawLeft = alignRight ? rect.right - TOOLTIP_WIDTH : rect.left;
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - TOOLTIP_WIDTH - 8));
    setPos({ top: rect.bottom + 8, left });
  };

  const show = () => { calcPos(); setVisible(true); };
  const hide = () => setVisible(false);

  return (
    <>
      <div ref={triggerRef}>
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          onClick={() => { if (!visible) calcPos(); setVisible(v => !v); }}
        >
          {children}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: TOOLTIP_WIDTH,
                zIndex: 99999,
                pointerEvents: 'none',
                background: 'linear-gradient(145deg, #1e2d40, #152030)',
                border: '1px solid rgba(100,160,255,0.18)',
                borderRadius: '14px',
                padding: '11px 14px',
                boxShadow: '0 24px 56px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              {/* Upward caret at top */}
              <div style={{
                position: 'absolute',
                top: '-5px',
                ...(alignRight ? { right: '14px' } : { left: '14px' }),
                width: '10px',
                height: '10px',
                background: '#1e2d40',
                borderTop: '1px solid rgba(100,160,255,0.18)',
                borderLeft: '1px solid rgba(100,160,255,0.18)',
                transform: 'rotate(45deg)',
              }} />
              <p style={{
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: 1.6,
                margin: 0,
                position: 'relative',
                zIndex: 1,
              }}>
                {content}
              </p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export function StatsOverview({ dailyLogs, currentScore, maxScore, streak }: StatsOverviewProps) {
  // Only count days that actually had habits — dailyLogs includes empty
  // calendar days (score 0 / maxScore 0) which would otherwise read as
  // "perfect" (0 === 0) and divide-by-zero into NaN.
  const daysWithHabits = dailyLogs.filter(log => log.maxScore > 0);
  const totalDays = daysWithHabits.length;
  const perfectDays = daysWithHabits.filter(log => log.score === log.maxScore).length;
  const completionRate = totalDays > 0 ? Math.round((perfectDays / totalDays) * 100) : 0;

  const last7Days = daysWithHabits.slice(-7);
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
          className={`bg-white/5 border ${stat.borderColor} rounded-2xl p-4 sm:p-5 hover:bg-white/[0.07] transition-all hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-3">
            <StatTooltip content={stat.tooltip} alignRight={index % 2 === 1}>
              <div className="flex items-center gap-1.5 cursor-help group">
                <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
                <HelpCircle className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors" />
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
