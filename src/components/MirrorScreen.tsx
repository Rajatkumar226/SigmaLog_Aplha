import { motion } from 'motion/react';
import { Header } from './Header';
import { useScrolled } from '../hooks/useScrolled';
import { useInsights } from '../hooks/useInsights';
import type { InsightCard } from '../services/insightsService';

interface MirrorScreenProps {
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings' | 'mirror') => void;
}

const toneRing: Record<string, string> = {
  good: 'border-green-500/25',
  bad: 'border-red-500/25',
  neutral: 'border-white/10',
};
const toneStat: Record<string, string> = {
  good: 'text-green-400',
  bad: 'text-red-400',
  neutral: 'text-white',
};

function Card({ card, index }: { card: InsightCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className={`bg-white/5 border ${toneRing[card.tone]} rounded-2xl p-5`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{card.icon}</span>
        <span className="text-[11px] uppercase tracking-widest text-gray-500">{card.label}</span>
      </div>
      <p className={`text-xl font-semibold mb-2 ${toneStat[card.tone]}`}>{card.stat}</p>
      <p className="text-sm text-gray-400 leading-relaxed">{card.verdict}</p>
    </motion.div>
  );
}

export function MirrorScreen({ onNavigate }: MirrorScreenProps) {
  const scrolled = useScrolled();
  const { insights, loading } = useInsights(90);

  return (
    <div className="min-h-screen px-4 sm:px-6" style={{ paddingTop: 96, paddingBottom: 56 }}>
      <div className="max-w-3xl mx-auto">
        <Header onNavigate={onNavigate} currentScreen={'mirror' as any} scrolled={scrolled} />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🪞</span>
            <h2 className="leading-none">The Mirror</h2>
          </div>
          <p className="text-sm text-gray-500">
            Your discipline, read back to you straight. No flattery.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-16 justify-center">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Reading your patterns...
          </div>
        ) : !insights ? (
          <p className="text-sm text-gray-500 py-16 text-center">Couldn't read your data right now.</p>
        ) : !insights.hasEnoughData ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
          >
            <div className="text-3xl mb-3">🪞</div>
            <h3 className="mb-2">{insights.headline}</h3>
            <p className="text-sm text-gray-400">{insights.subhead}</p>
          </motion.div>
        ) : (
          <>
            {/* Debrief */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-6 mb-6"
            >
              <span className="text-[11px] uppercase tracking-widest text-gray-500">
                Weekly Debrief · last {insights.daysTracked} days
              </span>
              <h3 className="mt-2 mb-2 text-2xl">{insights.headline}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{insights.subhead}</p>

              <div className="flex gap-6 mt-5 pt-5 border-t border-white/10">
                <div>
                  <p className="text-2xl font-semibold">{insights.overallRate}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">completion</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{insights.currentStreak}🔥</p>
                  <p className="text-xs text-gray-500 mt-0.5">current streak</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{insights.bestStreak}</p>
                  <p className="text-xs text-gray-500 mt-0.5">best streak</p>
                </div>
              </div>
            </motion.div>

            {/* Pattern cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.cards.map((c, i) => (
                <Card key={c.id} card={c} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
