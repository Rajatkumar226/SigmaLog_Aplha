import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import '../styles/TimeCapsuleModal.scss';

interface TimeCapsuleModalProps {
  onClose: () => void;
  onSubmit: (message: string, deliverInDays: number) => Promise<void>;
}

const DELIVER_OPTIONS = [
  { days: 30,  label: '30 days' },
  { days: 60,  label: '60 days' },
  { days: 90,  label: '90 days' },
];

const PROMPTS = [
  'Dear future me,\n\nI am starting this journey today because...\n\nThe discipline I am committing to is...\n\nIn 30 days, I want to see...',
  'To my future self,\n\nToday I made a decision. The reason behind it is...\n\nI know it will be hard when...\n\nBut I will push through because...',
  'Future self,\n\nHere is what matters to me right now...\n\nThe habits I refuse to compromise on are...\n\nHold me accountable to...',
];

export function TimeCapsuleModal({ onClose, onSubmit }: TimeCapsuleModalProps) {
  const [message, setMessage] = useState('');
  const [deliverInDays, setDeliverInDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [promptIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length));

  const deliverDate = new Date();
  deliverDate.setDate(deliverDate.getDate() + deliverInDays);
  const deliverDateStr = deliverDate.toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(message, deliverInDays);
    onClose();
  };

  const hasMessage = message.trim().length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="capsule-modal"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="capsule-modal__box"
        >
          <div className="capsule-modal__glow-line" />
          <div className="capsule-modal__orb" />

          <div className="capsule-modal__inner">
            {/* Header */}
            <div className="capsule-modal__header">
              <div className="capsule-modal__title-group">
                <div className="capsule-modal__eyebrow">
                  <span className="icon">📦</span>
                  <span className="label">Discipline Time Capsule</span>
                </div>
                <h2 className="capsule-modal__title">Write to future you</h2>
                <p className="capsule-modal__subtitle">
                  Sealed now. Delivered on <span className="date">{deliverDateStr}</span>.
                </p>
              </div>
              <button className="capsule-modal__close-btn" onClick={onClose}>
                <X />
              </button>
            </div>

            {/* Delivery day selector */}
            <div className="capsule-modal__day-selector">
              {DELIVER_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setDeliverInDays(opt.days)}
                  className={`capsule-modal__day-btn${deliverInDays === opt.days ? ' capsule-modal__day-btn--active' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Letter textarea */}
            <div className="capsule-modal__textarea-wrap">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={PROMPTS[promptIdx]}
                className="capsule-modal__textarea"
                rows={10}
              />
              <span className="capsule-modal__char-count">{message.length} chars</span>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={!hasMessage || submitting}
              whileHover={{ scale: hasMessage ? 1.01 : 1 }}
              whileTap={{ scale: hasMessage ? 0.98 : 1 }}
              className={`capsule-modal__submit${hasMessage ? ' capsule-modal__submit--active' : ''}`}
            >
              {submitting ? '✨ Sealing your capsule...' : '🔒 Seal the Capsule'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
