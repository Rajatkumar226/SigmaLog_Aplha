import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Confetti from 'react-confetti';
import { X } from 'lucide-react';
import type { TimeCapsule } from '../services/timeCapsuleService';
import '../styles/TimeCapsuleReveal.scss';

interface TimeCapsuleRevealProps {
  capsule: TimeCapsule;
  onClose: () => void;
  onOpen: (id: string) => Promise<void>;
  onWriteNew: () => void;
}

type Phase = 'sealed' | 'opening' | 'revealed';

export function TimeCapsuleReveal({ capsule, onClose, onOpen, onWriteNew }: TimeCapsuleRevealProps) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [showConfetti, setShowConfetti] = useState(false);

  const writtenDate = new Date(capsule.written_at).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const daysAgo = Math.floor(
    (Date.now() - new Date(capsule.written_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleOpen = async () => {
    if (phase !== 'sealed') return;
    setPhase('opening');
    await onOpen(capsule.id);
    setTimeout(() => {
      setPhase('revealed');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4500);
    }, 900);
  };

  const isRevealed = phase === 'revealed';
  const colorVariant = isRevealed ? 'green' : 'amber';

  return (
    <>
      {showConfetti && (
        <Confetti
          numberOfPieces={160}
          recycle={false}
          colors={['#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#ffffff']}
          gravity={0.25}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="capsule-reveal"
        onClick={(e) => isRevealed && e.target === e.currentTarget && onClose()}
      >
        <div className={`capsule-reveal__box capsule-reveal__box--${colorVariant}`}>
          <div className={`capsule-reveal__glow-line capsule-reveal__glow-line--${colorVariant}`} />
          <div className={`capsule-reveal__orb capsule-reveal__orb--${colorVariant}`} />

          <AnimatePresence mode="wait">
            {!isRevealed ? (
              <motion.div
                key="sealed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -16 }}
                className="capsule-reveal__sealed"
              >
                <motion.span
                  className={`capsule-reveal__emoji${phase === 'opening' ? ' capsule-reveal__emoji--shaking' : ''}`}
                  animate={phase === 'opening'
                    ? { scale: [1, 1.3, 0.7, 1.1, 1], rotate: [0, -8, 8, -4, 0] }
                    : { y: [0, -6, 0] }
                  }
                  transition={phase === 'opening'
                    ? { duration: 0.8, ease: 'easeInOut' }
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  }
                >
                  {phase === 'opening' ? '📭' : '📦'}
                </motion.span>

                <span className="capsule-reveal__tag">Time Capsule Arrived</span>
                <h2 className="capsule-reveal__heading">Your letter from the past</h2>
                <p className="capsule-reveal__written-at">
                  Written <span className="highlight">{daysAgo} days ago</span> on {writtenDate}
                </p>

                <motion.button
                  onClick={handleOpen}
                  disabled={phase === 'opening'}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="capsule-reveal__open-btn"
                >
                  {phase === 'opening' ? '✨ Opening...' : '🔓 Open Your Letter'}
                </motion.button>

                <span className="capsule-reveal__undo-note">
                  This cannot be undone. The capsule will be marked as opened.
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="capsule-reveal__revealed"
              >
                <div className="capsule-reveal__revealed-header">
                  <div>
                    <div className="capsule-reveal__opened-tag">
                      <motion.span
                        className="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                      >
                        ✉️
                      </motion.span>
                      <span className="text">Letter Opened</span>
                    </div>
                    <p className="capsule-reveal__written-on">Written on {writtenDate}</p>
                  </div>
                  <button className="capsule-reveal__close-btn" onClick={onClose}>
                    <X />
                  </button>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="capsule-reveal__letter"
                >
                  {capsule.message}
                </motion.div>

                <div className="capsule-reveal__actions">
                  <motion.button
                    onClick={() => { onWriteNew(); onClose(); }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="capsule-reveal__write-new"
                  >
                    📝 Write a New Letter
                  </motion.button>
                  <button onClick={onClose} className="capsule-reveal__close-action">
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
