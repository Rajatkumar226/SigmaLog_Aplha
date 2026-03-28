import { Calendar, Share2, BarChart3, Settings } from 'lucide-react';

interface HeaderProps {
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings') => void;
  onShareClick?: () => void;
  onCalendarClick?: () => void;
  showCalendar?: boolean;
  currentScreen?: 'dashboard' | 'progress' | 'settings';
}

export function Header({
  onNavigate,
  onShareClick,
  onCalendarClick,
  showCalendar = false,
  currentScreen = 'dashboard',
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 sm:mb-8">
      <button
        onClick={() => onNavigate('dashboard')}
        className="text-left cursor-pointer hover:opacity-80 transition-opacity"
      >
        <h1 className="text-2xl sm:text-3xl mb-1">SigmaLog</h1>
        <p className="text-sm text-gray-400">Log discipline. Build the Sigma.</p>
      </button>
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
    </div>
  );
}
