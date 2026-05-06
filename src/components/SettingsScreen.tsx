import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Bell,
  BellOff,
  MessageSquare,
  Shield,
  Smartphone,
  Monitor,
  Download,
  Check,
} from "lucide-react";
import { Header } from "./Header";
import { DataIntegrityIndicator } from "./DataIntegrityIndicator";
import type { Habit } from "../App";
import { STANDARD_CATEGORIES } from "../App";
import {
  isNotificationSupported,
  getPermission,
  requestPermission,
  registerSW,
  fireNotification,
  subscribeToWebPush,
  savePushSubscription,
  unsubscribeFromWebPush,
} from "../services/pushNotificationService";

// Category selector component with custom option
interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [showCustomInput, setShowCustomInput] = useState(
    !STANDARD_CATEGORIES.includes(value as any) && value !== ""
  );
  const [customValue, setCustomValue] = useState(
    !STANDARD_CATEGORIES.includes(value as any) ? value : ""
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "custom") {
      setShowCustomInput(true);
      onChange(customValue || "");
    } else {
      setShowCustomInput(false);
      setCustomValue("");
      onChange(selected);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };

  const selectValue = showCustomInput
    ? "custom"
    : STANDARD_CATEGORIES.includes(value as any)
    ? value
    : "custom";

  return (
    <div className="flex gap-2 w-full">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        title="Category"
        aria-label="Select category"
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-white/20"
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
          aria-label="Custom category name"
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-white/20"
          autoFocus
        />
      )}
    </div>
  );
}

interface SettingsScreenProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  onResetData: () => void;
  onNavigate: (screen: "dashboard" | "progress" | "settings") => void;
  onSignOut?: () => void;
}

export function SettingsScreen({
  habits,
  onUpdateHabits,
  onResetData,
  onNavigate,
  onSignOut,
}: SettingsScreenProps) {
  const [localHabits, setLocalHabits] = useState<Habit[]>(habits);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("sigmalog_notifications") === "true";
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem("sigmalog_reminder_time") || "20:00";
  });
  const [permissionStatus, setPermissionStatus] = useState<string>(() =>
    isNotificationSupported() ? getPermission() : 'unsupported'
  );
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPwaInstructions, setShowPwaInstructions] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    // Check if running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handle PWA install
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaInstructions(true);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!isNotificationSupported()) return;

      setRequestingPermission(true);
      const permission = await requestPermission();
      setPermissionStatus(permission);
      setRequestingPermission(false);

      if (permission !== 'granted') return;

      await registerSW();

      // Subscribe to VAPID Web Push and save subscription to DB
      const subscription = await subscribeToWebPush();
      if (subscription) {
        await savePushSubscription(subscription);
      }

      setNotificationsEnabled(true);
      localStorage.setItem("sigmalog_notifications", "true");

      await fireNotification(
        'SigmaLog — Notifications ON ✅',
        `You'll be reminded at ${reminderTime} if you haven't logged.`
      );
    } else {
      // Unsubscribe from VAPID push and clear DB record
      await unsubscribeFromWebPush();
      setNotificationsEnabled(false);
      localStorage.setItem("sigmalog_notifications", "false");
    }
  };

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time);
    localStorage.setItem("sigmalog_reminder_time", time);
  };

  const addHabit = () => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: "New Habit",
      category: "Body",
      points: 1,
    };
    setLocalHabits([...localHabits, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setLocalHabits(
      localHabits.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  const deleteHabit = (id: string) => {
    setLocalHabits(localHabits.filter((h) => h.id !== id));
  };

  const saveChanges = () => {
    onUpdateHabits(localHabits);
    onNavigate("dashboard");
  };

  const handleReset = () => {
    onResetData();
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Header onNavigate={onNavigate} currentScreen="settings" />

        {/* Habit Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"
        >
          <h3 className="mb-4">Edit Habits</h3>

          <div className="space-y-3 mb-4">
            <AnimatePresence mode="popLayout">
              {localHabits.map((habit) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row lg:items-center gap-3 lg:gap-4">
                    <input
                      type="text"
                      value={habit.name}
                      onChange={(e) =>
                        updateHabit(habit.id, { name: e.target.value })
                      }
                      className="w-full lg:flex-1 bg-transparent border-none outline-none text-white"
                      placeholder="Habit name"
                    />

                    <div className="flex items-center justify-between lg:justify-start gap-2">
                      <CategorySelect
                        value={habit.category}
                        onChange={(value) =>
                          updateHabit(habit.id, { category: value })
                        }
                      />

                      <select
                        value={habit.points}
                        onChange={(e) =>
                          updateHabit(habit.id, {
                            points: Number(e.target.value) as 1 | 2 | 3,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-white/20"
                      >
                        <option value={1}>1 pt</option>
                        <option value={2}>2 pts</option>
                        <option value={3}>3 pts</option>
                      </select>

                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-2 hover:bg-white/5 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addHabit}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>

            <button
              onClick={saveChanges}
              className="flex-1 px-6 py-2.5 bg-white text-black hover:bg-white/90 rounded-lg transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${notificationsEnabled && permissionStatus === 'granted' ? 'bg-green-500/15' : 'bg-white/5'}`}>
              {notificationsEnabled && permissionStatus === 'granted'
                ? <Bell className="w-4 h-4 text-green-400" />
                : <BellOff className="w-4 h-4 text-gray-500" />
              }
            </div>
            <div>
              <h3 className="leading-none">Notifications</h3>
              <p className="text-xs text-gray-500 mt-1">
                {notificationsEnabled && permissionStatus === 'granted' ? 'Active' : 'Off'}
              </p>
            </div>
          </div>

          {/* Unsupported */}
          {permissionStatus === 'unsupported' && (
            <p className="text-xs text-gray-500 bg-white/5 rounded-xl px-4 py-3 leading-relaxed">
              Not supported in this browser. Install the app on Android Chrome for push notifications.
            </p>
          )}

          {/* Denied */}
          {permissionStatus === 'denied' && (
            <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/15 rounded-2xl px-4 py-4 mb-5">
              <BellOff className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-300 mb-1">Notifications blocked</p>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  Go to browser Settings → Site permissions → Notifications → allow this site.
                </p>
              </div>
            </div>
          )}

          {permissionStatus !== 'unsupported' && (
            <>
              {/* Enable Toggle */}
              <div className="flex items-center justify-between py-4 px-4 bg-white/3 rounded-2xl mb-4">
                <div>
                  <p className="text-sm font-medium">Daily Reminder</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {notificationsEnabled && permissionStatus === 'granted'
                      ? `Fires at ${reminderTime} if not logged`
                      : "Tap to enable"}
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(!notificationsEnabled)}
                  disabled={requestingPermission || permissionStatus === 'denied'}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                    notificationsEnabled && permissionStatus === 'granted'
                      ? "bg-green-500/50"
                      : "bg-white/10"
                  }`}
                >
                  {requestingPermission ? (
                    <div className="absolute top-1 left-1 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <motion.div
                      animate={{ x: notificationsEnabled && permissionStatus === 'granted' ? 24 : 2 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute top-1 w-4 h-4 rounded-full ${
                        notificationsEnabled && permissionStatus === 'granted'
                          ? "bg-green-400"
                          : "bg-gray-500"
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Time Selector */}
              <AnimatePresence>
                {notificationsEnabled && permissionStatus === 'granted' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-4 bg-white/3 rounded-2xl">
                      <label className="block text-xs text-gray-400 uppercase tracking-widest mb-3">
                        Remind me at
                      </label>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => handleReminderTimeChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                          outline-none focus:border-green-500/30 transition-colors text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>

        {/* Install App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5" />
            <h3>Install App</h3>
          </div>

          {isInstalled ? (
            <div className="flex items-center gap-3 text-green-400">
              <Check className="w-5 h-5" />
              <span className="text-sm">
                SigmaLog is installed on your device
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Add SigmaLog to your home screen for quick access and a native
                app experience.
              </p>

              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-all cursor-pointer mb-4"
              >
                <Download className="w-5 h-5" />
                <span>Install SigmaLog</span>
              </button>

              <AnimatePresence>
                {showPwaInstructions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-3">
                        Use your browser menu to install:
                      </p>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500/10 p-2 rounded">
                          <Smartphone className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium mb-1">iOS Safari</p>
                          <p className="text-xs text-gray-400">
                            Tap Share → Add to Home Screen
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-green-500/10 p-2 rounded">
                          <Smartphone className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium mb-1">
                            Android Chrome
                          </p>
                          <p className="text-xs text-gray-400">
                            Menu (⋮) → Add to Home screen
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-500/10 p-2 rounded">
                          <Monitor className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium mb-1">Desktop</p>
                          <p className="text-xs text-gray-400">
                            Look for install icon in address bar
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>

        {/* Data Integrity & Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5" />
            <h3>Data Integrity</h3>
          </div>

          <div className="space-y-4">
            <DataIntegrityIndicator variant="inline" />

            <div className="pt-4 border-t border-white/10">
              <a
                href="mailto:rajat8615226@gmail.com?subject=Alpha Feedback"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 
                  border border-white/10 rounded-lg transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share feedback</span>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-500/5 border border-red-500/20 rounded-lg p-6"
        >
          <h3 className="mb-2 text-red-400">Danger Zone</h3>
          <p className="text-sm text-gray-400 mb-4">
            This will permanently delete all your habits and logged data.
          </p>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all cursor-pointer"
            >
              Reset All Data
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-col">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="flex-1 text-sm">Are you sure?</span>
              <div className="reset1 flex gap-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sign Out */}
        {onSignOut && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-lg p-6 mt-6"
          >
            <h3 className="mb-2 text-gray-400">Account</h3>
            <p className="text-sm text-gray-400 mb-4">
              Sign out of your account.
            </p>

            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
