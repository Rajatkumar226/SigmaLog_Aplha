import { motion } from 'motion/react';
import type { DailyLog } from '../App';

interface MonthlyHeatmapProps {
  dailyLogs: DailyLog[];
}

export function MonthlyHeatmap({ dailyLogs }: MonthlyHeatmapProps) {
  // Get current month and year
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Create array of all days in month
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const dateStr = date.toISOString().split('T')[0];
    const log = dailyLogs.find(l => l.date === dateStr);
    
    let status: 'empty' | 'partial' | 'complete' = 'empty';
    if (log) {
      const percentage = (log.score / log.maxScore) * 100;
      if (percentage === 100) status = 'complete';
      else if (percentage > 0) status = 'partial';
    }
    
    days.push({
      day: i,
      date: dateStr,
      status,
      isToday: dateStr === today.toISOString().split('T')[0],
      percentage: log ? (log.score / log.maxScore) * 100 : 0,
    });
  }
  
  const getStatusColor = (status: string, isToday: boolean) => {
    if (status === 'complete') return 'bg-green-500/40 border-green-500/60';
    if (status === 'partial') return 'bg-amber-500/30 border-amber-500/50';
    if (isToday) return 'bg-white/10 border-white/30';
    return 'bg-white/5 border-white/10';
  };
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div id="monthly-calendar">
      <h3 className="mb-4">{monthName}</h3>
      
      {/* Week day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {/* Month days */}
        {days.map((day, index) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            className={`aspect-square rounded border ${getStatusColor(day.status, day.isToday)} 
              flex items-center justify-center text-sm hover:scale-105 transition-transform
              ${day.isToday ? 'ring-2 ring-white/20' : ''}`}
            title={`${day.date}: ${Math.round(day.percentage)}%`}
          >
            <span className={day.status === 'complete' ? 'font-semibold' : ''}>
              {day.day}
            </span>
          </motion.div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
          <span>No data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/40 border border-green-500/60" />
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}