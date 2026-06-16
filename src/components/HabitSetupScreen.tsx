import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, HelpCircle, Clock } from 'lucide-react';
import type { Habit } from '../App';
import { STANDARD_CATEGORIES } from '../App';

interface HabitSetupScreenProps {
  onLockHabits: (habits: Habit[]) => void;
  existingHabits: Habit[];
  isLoading?: boolean;
}

const DEFAULT_HABITS: Omit<Habit, 'id'>[] = [
  { name: 'Exercise', category: 'Body', points: 2 },
  { name: 'Reading', category: 'Mind', points: 1 },
  { name: 'Work', category: 'Career', points: 3 },
  { name: 'Meditation', category: 'Mind', points: 1 },
];

// Category selector component with custom option
interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [showCustomInput, setShowCustomInput] = useState(
    !STANDARD_CATEGORIES.includes(value as any) && value !== ''
  );
  const [customValue, setCustomValue] = useState(
    !STANDARD_CATEGORIES.includes(value as any) ? value : ''
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setShowCustomInput(true);
      // Keep current custom value or set empty
      onChange(customValue || '');
    } else {
      setShowCustomInput(false);
      setCustomValue('');
      onChange(selected);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };

  // Determine select value
  const selectValue = showCustomInput ? 'custom' :
    (STANDARD_CATEGORIES.includes(value as any) ? value : 'custom');

  return (
    <div className="flex gap-2 w-full">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        title="Category"
        aria-label="Select category"
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-white/20 cursor-pointer"
      >
        <option value="Body">Body</option>
        <option value="Mind">Mind</option>
        <option value="Career">Career</option>
        <option value="Discipline">Discipline</option>
        <option value="custom">Custom...</option>
      </select>
      {showCustomInput && (
        <input
          type="text"
          value={customValue}
          onChange={handleCustomInputChange}
          placeholder="Enter category"
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-white/20"
          autoFocus
        />
      )}
    </div>
  );
}

export function HabitSetupScreen({ onLockHabits, existingHabits, isLoading = false }: HabitSetupScreenProps) {
  const [habits, setHabits] = useState<Habit[]>(
    existingHabits.length > 0
      ? existingHabits
      : DEFAULT_HABITS.map((h, i) => ({ ...h, id: `habit-${i}` }))
  );

  const addHabit = () => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: 'New Habit',
      category: 'Body',
      points: 1,
    };
    setHabits([...habits, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(habits.map(h => (h.id === id ? { ...h, ...updates } : h)));
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const handleLock = () => {
    if (habits.length > 0) {
      onLockHabits(habits);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          Define Your Discipline
        </motion.h2>

        {/* Helpful intro text for new users */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 mb-8 text-sm"
        >
          Add the habits you want to track daily. Set a time on any habit (⏰) to get a daily push reminding you to start it. You can change these anytime in settings.
        </motion.p>

        {/* Explanation cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">What are Points?</span>
            </div>
            <p className="text-xs text-gray-400">
              Points reflect habit difficulty. A 3-point habit is harder than a 1-point habit.
              Your daily goal is to complete all your points (e.g., 8/8 = 100%).
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">What are Categories?</span>
            </div>
            <p className="text-xs text-gray-400">
              Categories help organize habits by life area: Body (fitness), Mind (learning),
              Career (work), Discipline (routines). Choose what fits best.
            </p>
          </div>
        </motion.div>

        <div className="space-y-3 mb-8">
          <AnimatePresence mode="popLayout">
            {habits.map((habit, index) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                  <input
                    type="text"
                    value={habit.name}
                    onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                    className="w-full lg:flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20 transition-colors min-w-0"
                    placeholder="Habit name"
                  />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:gap-2">
                    {/* Category — own full-width row on mobile so the label shows */}
                    <div className="w-full sm:w-[150px] flex-shrink-0">
                      <CategorySelect
                        value={habit.category}
                        onChange={(value) => updateHabit(habit.id, { category: value })}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={habit.points}
                        onChange={(e) =>
                          updateHabit(habit.id, { points: Number(e.target.value) as 1 | 2 | 3 })
                        }
                        title="Points"
                        aria-label="Select points"
                        className="flex-1 sm:flex-none sm:w-[78px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-white/20 cursor-pointer"
                      >
                        <option value={1}>1 pt</option>
                        <option value={2}>2 pts</option>
                        <option value={3}>3 pts</option>
                      </select>

                      <div
                        className={`flex flex-1 sm:flex-none sm:w-[136px] items-center gap-1.5 bg-white/5 border rounded-lg px-2.5 py-2 transition-colors ${
                          habit.reminderTime ? 'border-blue-400/50' : 'border-white/10'
                        }`}
                        title="Optional: daily reminder time for this task"
                      >
                        <Clock className={`w-4 h-4 flex-shrink-0 ${habit.reminderTime ? 'text-blue-400' : 'text-gray-400'}`} />
                        <input
                          type="time"
                          value={habit.reminderTime ?? ''}
                          onChange={(e) =>
                            updateHabit(habit.id, { reminderTime: e.target.value || null })
                          }
                          aria-label="Reminder time"
                          className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        title="Delete habit"
                        aria-label="Delete habit"
                        className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={addHabit}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>

          <button
            onClick={handleLock}
            disabled={habits.length === 0 || isLoading}
            className="w-full sm:flex-1 px-6 py-3 bg-white text-black hover:bg-white/90 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Setting up...
              </span>
            ) : (
              'Start Tracking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}