import { useEffect } from 'react';
import type { Habit } from '../App';

interface KeyboardShortcutsProps {
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
  onNavigate?: (screen: 'dashboard' | 'progress' | 'settings') => void;
}

export function KeyboardShortcuts({ habits, onToggleHabit, onNavigate }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Number keys 1-9 to toggle habits
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (habits[index]) {
          onToggleHabit(habits[index].id);
        }
      }

      // Keyboard shortcuts with modifier keys
      if (onNavigate) {
        if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onNavigate('progress');
        }
        if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onNavigate('settings');
        }
        if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onNavigate('dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [habits, onToggleHabit, onNavigate]);

  return null; // This component doesn't render anything
}
