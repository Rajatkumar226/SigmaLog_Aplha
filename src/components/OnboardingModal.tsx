import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Flame, Target, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Target,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Welcome to SigmaLog',
    description: 'Your daily discipline tracker. Build habits, track progress, and become the person you want to be.',
    tip: 'SigmaLog shows you who you are becoming through your daily choices.',
  },
  {
    icon: CheckCircle,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10 border-green-500/20',
    title: 'How Points Work',
    description: 'Each habit has a point value (1-3 pts) based on difficulty or importance. Your daily goal is to complete all your points.',
    tip: 'Example: If you have habits worth 2+1+3+2 = 8 points, completing all gives you 8/8 (100%)',
  },
  {
    icon: Flame,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    title: 'Build Your Streak',
    description: 'Complete ALL your habits daily to build a streak. The longer your streak, the stronger your discipline becomes.',
    tip: 'Miss a day? No drama. Reset and start again. Consistency beats perfection.',
  },
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0f1420] border border-white/10 rounded-xl max-w-md w-full p-6 relative"
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            {/* Icon */}
            <div className={`inline-flex p-4 ${slide.iconBg} border rounded-xl mb-6`}>
              <Icon className={`w-10 h-10 ${slide.iconColor}`} />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold mb-3">{slide.title}</h2>

            {/* Description */}
            <p className="text-gray-400 mb-4 leading-relaxed">{slide.description}</p>

            {/* Tip box */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">{slide.tip}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center gap-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-white text-black hover:bg-white/90 rounded-lg transition-colors font-medium"
          >
            {currentSlide === slides.length - 1 ? (
              "Let's Start"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
