import { Home, Eye, Users, BarChart3, Settings } from 'lucide-react';
import { motion } from 'motion/react';

type NavScreen = 'dashboard' | 'mirror' | 'pact' | 'progress' | 'settings';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: NavScreen) => void;
}

const TABS: { key: NavScreen; label: string; Icon: typeof Home }[] = [
  { key: 'dashboard', label: 'Home', Icon: Home },
  { key: 'mirror', label: 'Mirror', Icon: Eye },
  { key: 'pact', label: 'Pact', Icon: Users },
  { key: 'progress', label: 'Progress', Icon: BarChart3 },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

/**
 * Mobile / tablet bottom tab bar (native-app feel). Hidden on lg+ where the
 * top header keeps its nav.
 */
export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0e1a]/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto px-1">
        {TABS.map(({ key, label, Icon }) => {
          const active = currentScreen === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 cursor-pointer select-none"
            >
              {active && (
                <motion.span
                  layoutId="bottomNavActive"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-9 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.82 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}>
                <Icon
                  className={`w-[22px] h-[22px] transition-colors ${active ? 'text-white' : 'text-gray-500'}`}
                  strokeWidth={active ? 2.4 : 2}
                />
              </motion.div>
              <span className={`text-[10px] leading-none transition-colors ${active ? 'text-white font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
