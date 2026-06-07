import { motion } from 'motion/react';

interface InvitePromptProps {
  email: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function InvitePrompt({ email, onAccept, onDismiss }: InvitePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm bg-[#0f1421] border border-white/10 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-3">🤝</div>
        <h3 className="mb-2">Accountability invite</h3>
        <p className="text-sm text-gray-300 mb-1">
          <span className="font-medium text-white">{email}</span> invited you to be accountability partners.
        </p>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          You'll each see the other's daily completion % and streak — nothing else. No hiding.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onAccept}
            className="w-full px-5 py-2.5 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-medium transition-all cursor-pointer"
          >
            Accept partnership
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-all cursor-pointer"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
