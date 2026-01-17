import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { DailyLog } from '../App';

interface ShareModalProps {
  dailyLogs: DailyLog[];
  onClose: () => void;
}

export function ShareModal({ onClose }: ShareModalProps) {
  const [shareType, setShareType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily');

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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <div className="bg-[#0f1421] border border-white/20 rounded-lg p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3>Share Progress</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setShareType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${
                    shareType === type
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 border border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Coming Soon Card */}
            <div className="bg-[#0a0e1a] border border-white/10 rounded-lg p-6 mb-6">
              <div className="text-center py-8">
                <h2 className="text-2xl mb-3">Coming Soon</h2>
                <p className="text-sm text-gray-400">
                  Share your discipline journey with the world
                </p>
              </div>
            </div>

            {/* Action Buttons - Disabled */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                className="px-4 py-3 bg-white/5 border border-white/10
                  rounded-lg transition-all flex items-center justify-center gap-2
                  opacity-50 cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                disabled
                className="px-4 py-3 bg-white/10 border border-white/20
                  rounded-lg transition-all flex items-center justify-center gap-2
                  opacity-50 cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {/* <p className="text-xs text-center text-gray-500 mt-4">
              Optional. Share when it feels right, not for validation.
            </p> */}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
