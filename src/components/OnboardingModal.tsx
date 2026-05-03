import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Flame, Target, ChevronRight, ChevronLeft } from 'lucide-react';
import '../styles/OnboardingModal.scss';

interface OnboardingModalProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Target,
    accent: {
      color: '#60a5fa',
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      border: 'rgba(59,130,246,0.3)',
      bg: 'rgba(59,130,246,0.08)',
      glow: 'rgba(59,130,246,0.18)',
    },
    counter: 'Step 1 of 3',
    title: 'Welcome to SigmaLog',
    desc: 'Your daily discipline tracker. Build habits, track streaks, and become the best version of yourself — one day at a time.',
    tip: '🗺 SigmaLog shows you exactly who you are becoming through the choices you make every single day.',
  },
  {
    icon: CheckCircle,
    accent: {
      color: '#34d399',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      border: 'rgba(16,185,129,0.3)',
      bg: 'rgba(16,185,129,0.08)',
      glow: 'rgba(16,185,129,0.18)',
    },
    counter: 'Step 2 of 3',
    title: 'How Points Work',
    desc: 'Each habit carries 1–3 points based on how hard it is. Your daily mission is to hit 100% — every point counts.',
    tip: '⚡ Example: habits worth 2+1+3+2 = 8 pts. Complete all → 8/8 = 100%. You either win the day or you don\'t.',
  },
  {
    icon: Flame,
    accent: {
      color: '#fb923c',
      gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
      border: 'rgba(249,115,22,0.3)',
      bg: 'rgba(249,115,22,0.08)',
      glow: 'rgba(249,115,22,0.18)',
    },
    counter: 'Step 3 of 3',
    title: 'Build Your Streak',
    desc: 'Complete ALL habits every day to extend your streak. The calendar turns green for every perfect day. Protect it.',
    tip: '🔥 Miss a day? No drama. The streak resets, not your character. Start again — that\'s discipline.',
  },
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const goTo = (next: number, direction: 1 | -1) => {
    setDir(direction);
    setIdx(next);
  };

  const slide = slides[idx];
  const Icon  = slide.icon;
  const pct   = ((idx + 1) / slides.length) * 100;

  const cssVars = {
    '--accent-color':    slide.accent.color,
    '--accent-gradient': slide.accent.gradient,
    '--accent-border':   slide.accent.border,
    '--accent-bg':       slide.accent.bg,
    '--accent-glow':     slide.accent.glow,
  } as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="onboarding-overlay"
    >
      <div className="onboarding-modal" style={cssVars}>
        <div className="onboarding-modal__glow-stripe" />

        <button className="onboarding-modal__skip" onClick={onComplete}>
          Skip
        </button>

        <div className="onboarding-modal__inner">
          {/* Icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`icon-${idx}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.25 }}
              className="onboarding-modal__icon-wrap"
            >
              <div className="onboarding-modal__icon-orb" />
              <Icon className="onboarding-modal__icon" />
            </motion.div>
          </AnimatePresence>

          {/* Slide content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`slide-${idx}`}
              initial={{ opacity: 0, x: dir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -30 }}
              transition={{ duration: 0.22 }}
              className="onboarding-modal__content"
            >
              <div className="onboarding-modal__counter">{slide.counter}</div>
              <h2 className="onboarding-modal__title">{slide.title}</h2>
              <p className="onboarding-modal__desc">{slide.desc}</p>
              <div className="onboarding-modal__tip">{slide.tip}</div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="onboarding-modal__progress-track">
            <motion.div
              className="onboarding-modal__progress-fill"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Dots */}
          <div className="onboarding-modal__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > idx ? 1 : -1)}
                className={`onboarding-modal__dot${i === idx ? ' onboarding-modal__dot--active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="onboarding-modal__actions">
            {idx > 0 && (
              <button
                className="onboarding-modal__btn-back"
                onClick={() => goTo(idx - 1, -1)}
              >
                <ChevronLeft /> Back
              </button>
            )}

            <button
              className="onboarding-modal__btn-next"
              onClick={() => idx < slides.length - 1 ? goTo(idx + 1, 1) : onComplete()}
            >
              {idx === slides.length - 1 ? "Let's Go 🚀" : <>Next <ChevronRight /></>}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
