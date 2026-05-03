import { motion, AnimatePresence } from 'motion/react';
import { X, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DailyLog } from '../App';

interface MilestoneModalProps {
  dailyLogs: DailyLog[];
  onClose: () => void;
}

const milestoneData = {
  week: {
    title: '7-Day Streak',
    message: 'Most people quit before this point. You didn\'t.',
    subtitle: 'Week completed',
  },
  month: {
    title: '30-Day Streak',
    message: 'Discipline compounds. You\'re building proof.',
    subtitle: 'Month completed',
  },
  quarter: {
    title: '90-Day Streak',
    message: 'You\'ve rewritten who you are. The data proves it.',
    subtitle: 'Quarter completed',
  },
  year: {
    title: '365-Day Streak',
    message: 'Sigma behavior confirmed. A year of unbroken action.',
    subtitle: 'Year completed',
  },
};

function calculateStreak(dailyLogs: DailyLog[]): number {
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
}

function getMilestone(streak: number): 'week' | 'month' | 'quarter' | 'year' | null {
  if (streak === 7) return 'week';
  if (streak === 30) return 'month';
  if (streak === 90) return 'quarter';
  if (streak === 365) return 'year';
  return null;
}

export function MilestoneModal({ dailyLogs, onClose }: MilestoneModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestone, setMilestone] = useState<'week' | 'month' | 'quarter' | 'year' | null>(null);

  useEffect(() => {
    const streak = calculateStreak(dailyLogs);
    const achievedMilestone = getMilestone(streak);
    
    if (achievedMilestone) {
      const milestoneKey = `sigmalog_milestone_${achievedMilestone}_${streak}`;
      const hasSeenMilestone = localStorage.getItem(milestoneKey);
      
      if (!hasSeenMilestone) {
        setMilestone(achievedMilestone);
        localStorage.setItem(milestoneKey, 'true');
        
        if (achievedMilestone === 'year') {
          setShowConfetti(true);
          const timer = setTimeout(() => setShowConfetti(false), 3000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [dailyLogs]);

  if (!milestone) return null;

  const data = milestoneData[milestone];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0f1421] border border-white/20 rounded-lg p-8 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`p-4 ${
                milestone === 'year' 
                  ? 'bg-yellow-500/20 border-2 border-yellow-500/40' 
                  : 'bg-green-500/20 border-2 border-green-500/40'
              } rounded-full ${showConfetti ? 'animate-pulse' : ''}`}
            >
              <Award className={`w-12 h-12 ${
                milestone === 'year' ? 'text-yellow-400' : 'text-green-400'
              }`} />
            </motion.div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-sm text-gray-400 mb-2">{data.subtitle}</p>
            <h2 className="text-2xl mb-4">{data.title}</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {data.message}
            </p>
          </motion.div>

          {/* Subtle glow effect for yearly */}
          {milestone === 'year' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-yellow-500/5 rounded-lg pointer-events-none"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
