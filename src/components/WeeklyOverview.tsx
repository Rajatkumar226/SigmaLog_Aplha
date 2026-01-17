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
      <h3 className="mb-4">This Week</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekData.map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`bg-white/5 border rounded-lg p-4 hover:bg-white/[0.07] transition-all
              ${day.isToday ? 'border-white/30 ring-2 ring-white/10' : 'border-white/10'}`}
          >
            <div className="text-center">
              <p className={`text-sm mb-3 ${day.isToday ? 'text-white font-semibold' : 'text-gray-400'}`}>
                {day.day}
                {day.isToday && ' (Today)'}
              </p>
              
              <div className="flex justify-center mb-2">
                <CircularProgress 
                  percentage={day.percentage} 
                  size={60}
                  strokeWidth={6}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                {day.score} / {day.maxScore}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
