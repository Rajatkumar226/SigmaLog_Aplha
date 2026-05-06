import { motion } from 'motion/react';
import { CircularProgress } from './CircularProgress';
import type { DailyLog } from '../App';

interface WeeklyOverviewProps {
  dailyLogs: DailyLog[];
}

export function WeeklyOverview({ dailyLogs }: WeeklyOverviewProps) {
  // Get last 7 days
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(l => l.date === dateStr);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = i === 0;
      
      days.push({
        day: dayName,
        date: dateStr,
        percentage: log && log.maxScore > 0 ? (log.score / log.maxScore) * 100 : 0,
        score: log?.score || 0,
        maxScore: log?.maxScore || 0,
        isToday,
      });
    }
    
    return days;
  };

  const weekData = getLast7Days();

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gray-300 uppercase tracking-widest">This Week</h3>

      {/* Mobile: horizontal scroll | Desktop: 7-col grid */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory
        lg:grid lg:grid-cols-7 lg:gap-3 lg:overflow-visible lg:pb-0
        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {weekData.map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
            className={`flex-shrink-0 w-[88px] snap-start lg:w-auto
              rounded-2xl p-3 lg:p-4 transition-all
              ${day.isToday
                ? 'bg-white/[0.08] border border-white/25 ring-1 ring-white/10'
                : 'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07]'
              }`}
          >
            <div className="text-center">
              <p className={`text-xs mb-2.5 font-medium ${day.isToday ? 'text-white' : 'text-gray-500'}`}>
                {day.day}
                {day.isToday && <span className="block text-[10px] text-gray-400 font-normal leading-tight">Today</span>}
              </p>

              <div className="flex justify-center mb-2">
                <CircularProgress
                  percentage={day.percentage}
                  size={52}
                  strokeWidth={5}
                />
              </div>

              <p className="text-[10px] text-gray-600">
                {day.score}/{day.maxScore}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
