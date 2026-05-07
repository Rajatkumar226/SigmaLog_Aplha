import { Calendar, Share2, BarChart3, Settings } from 'lucide-react';

interface HeaderProps {
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings') => void;
  onShareClick?: () => void;
  onCalendarClick?: () => void;
  showCalendar?: boolean;
  currentScreen?: 'dashboard' | 'progress' | 'settings';
  scrolled?: boolean;
}

export function Header({
  onNavigate,
  onShareClick,
  onCalendarClick,
  showCalendar = false,
  currentScreen = 'dashboard',
  scrolled = false,
}: HeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 40,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        background: scrolled ? 'rgba(10,14,26,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="text-left cursor-pointer hover:opacity-80 transition-opacity"
      >
        <h1 className="text-2xl sm:text-3xl mb-0 leading-none">SigmaLog</h1>
        <p className="text-xs text-gray-500 mt-0.5">Log discipline. Build the Sigma.</p>
      </button>

      {/* Nav actions */}
      <div className="flex gap-2">
        {onCalendarClick && (
          <button
            onClick={onCalendarClick}
            className={`p-2.5 border rounded-lg transition-all cursor-pointer ${
              showCalendar
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <Calendar className="w-5 h-5" />
          </button>
        )}
        {onShareClick && (
          <button
            onClick={onShareClick}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => onNavigate('progress')}
          className={`p-2.5 border rounded-lg transition-all cursor-pointer ${
            currentScreen === 'progress'
              ? 'bg-white/10 border-white/20'
              : 'bg-white/5 hover:bg-white/10 border-white/10'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className={`p-2.5 border rounded-lg transition-all cursor-pointer ${
            currentScreen === 'settings'
              ? 'bg-white/10 border-white/20'
              : 'bg-white/5 hover:bg-white/10 border-white/10'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
