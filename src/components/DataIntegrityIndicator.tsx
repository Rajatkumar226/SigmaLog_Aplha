import { motion } from 'motion/react';
import { Lock, Shield } from 'lucide-react';

interface DataIntegrityIndicatorProps {
  variant?: 'inline' | 'badge';
}

export function DataIntegrityIndicator({ variant = 'inline' }: DataIntegrityIndicatorProps) {
  if (variant === 'badge') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400"
      >
        <Shield className="w-3 h-3" />
        <span>Past logs are sealed</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-xs text-gray-500"
    >
      <Lock className="w-3 h-3" />
      <span>SigmaLog records actions in real time</span>
    </motion.div>
  );
}
