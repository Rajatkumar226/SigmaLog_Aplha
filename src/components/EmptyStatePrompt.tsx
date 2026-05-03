import { motion } from 'motion/react';
import { CheckCircle, TrendingUp, Calendar as CalendarIcon, ArrowUp } from 'lucide-react';

export function EmptyStatePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-8 text-center max-w-2xl mx-auto"
    >
      {/* Day 1 Welcome Banner */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Day 1 - Let's Begin!
        </span>
      </div>

      <h3 className="mb-2 text-xl">Complete Your First Habit</h3>
      <p className="text-gray-400 mb-6">
        Click a checkbox above to mark your first habit as done
      </p>

      {/* Arrow pointing up */}
      <div className="flex justify-center mb-8">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="p-3 bg-green-500/20 border border-green-500/30 rounded-full"
        >
          <ArrowUp className="w-6 h-6 text-green-400" />
        </motion.div>
      </div>

      {/* Quick tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-6">
        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="p-2 bg-green-500/10 rounded">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h4 className="text-sm mb-1">Check Off</h4>
            <p className="text-xs text-gray-500">
              Tap habits as you complete them
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="p-2 bg-blue-500/10 rounded">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm mb-1">Earn Points</h4>
            <p className="text-xs text-gray-500">
              Each habit adds to your daily score
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="p-2 bg-purple-500/10 rounded">
            <CalendarIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm mb-1">Build Streaks</h4>
            <p className="text-xs text-gray-500">
              100% daily = streak continues
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Complete all your habits today to start your streak
      </p>
    </motion.div>
  );
}
