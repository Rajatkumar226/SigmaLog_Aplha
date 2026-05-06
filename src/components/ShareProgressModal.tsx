import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateShareImage, type SharePeriod } from '../utils/generateShareImage';
import type { DailyLog } from '../App';

interface ShareProgressModalProps {
  streak: number;
  dailyLogs: DailyLog[];
  onClose: () => void;
}

const PERIODS: { key: SharePeriod; label: string; days: number }[] = [
  { key: 'daily',       label: 'Today',     days: 1   },
  { key: 'weekly',      label: 'Weekly',    days: 7   },
  { key: 'quarterly',   label: 'Quarterly', days: 90  },
  { key: 'half_yearly', label: 'Half Year', days: 182 },
  { key: 'yearly',      label: 'Yearly',    days: 365 },
];

function buildShareData(logs: DailyLog[], period: SharePeriod, streak: number) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === todayStr);

  if (period === 'daily') {
    return {
      period, streak,
      avgScore: 0, daysLogged: 0, totalDays: 1, perfectDays: 0,
      todayScore:       todayLog?.score ?? 0,
      todayMaxScore:    todayLog?.maxScore ?? 0,
      habitsCompleted:  todayLog?.completedHabits.length ?? 0,
      totalHabits:      todayLog?.maxScore ?? 0,
    };
  }

  const days   = PERIODS.find(p => p.key === period)!.days;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const inRange = logs.filter(l => new Date(l.date) >= cutoff);
  const logged  = inRange.filter(l => l.score > 0);
  const perfect = inRange.filter(l => l.maxScore > 0 && l.score === l.maxScore);
  const avg     = logged.length > 0
    ? Math.round(logged.reduce((s, l) => s + (l.score / l.maxScore) * 100, 0) / logged.length)
    : 0;

  return {
    period, streak,
    avgScore: avg, daysLogged: logged.length, totalDays: days, perfectDays: perfect.length,
    todayScore: todayLog?.score ?? 0, todayMaxScore: todayLog?.maxScore ?? 0,
    habitsCompleted: todayLog?.completedHabits.length ?? 0, totalHabits: todayLog?.maxScore ?? 0,
  };
}

function buildText(period: SharePeriod, streak: number, avg: number, daysLogged: number, totalDays: number, todayScore: number, todayMax: number) {
  if (period === 'daily') {
    const pct = todayMax > 0 ? Math.round((todayScore / todayMax) * 100) : 0;
    return `${pct}% today on SigmaLog 🔥 — ${streak} day streak\nTrack your habits → sigmalog.vercel.app`;
  }
  const label = PERIODS.find(p => p.key === period)!.label.toLowerCase();
  return `${streak} day streak on SigmaLog 🔥\n${avg}% avg this ${label} · ${daysLogged}/${totalDays} days\nTrack your habits → sigmalog.vercel.app`;
}

function tryDeepLink(url: string): Promise<boolean> {
  return new Promise(resolve => {
    let done = false;
    const finish = (v: boolean) => { if (done) return; done = true; window.removeEventListener('blur', onBlur); clearTimeout(t); resolve(v); };
    const onBlur = () => finish(true);
    const t = setTimeout(() => finish(false), 2200);
    window.addEventListener('blur', onBlur);
    window.location.href = url;
  });
}

function saveFile(blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sigmalog-progress.png';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function ShareProgressModal({ streak, dailyLogs, onClose }: ShareProgressModalProps) {
  const [period, setPeriod]     = useState<SharePeriod>('daily');
  const [imgUrl, setImgUrl]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [sharing, setSharing]   = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const urlRef  = useRef<string | null>(null);

  const data = buildShareData(dailyLogs, period, streak);
  const text = buildText(period, streak, data.avgScore, data.daysLogged, data.totalDays, data.todayScore, data.todayMaxScore);

  // Regenerate preview whenever period changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    blobRef.current = null;

    generateShareImage(data).then(blob => {
      if (cancelled) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      blobRef.current = blob;
      setImgUrl(url);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, streak]);

  const getBlob = async () => {
    if (blobRef.current) return blobRef.current;
    const blob = await generateShareImage(data);
    blobRef.current = blob;
    return blob;
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'sigmalog-progress.png', { type: 'image/png' });

      // Try native share with file (works on Android + iOS Safari 15+)
      if (navigator.share) {
        const shareData: ShareData = navigator.canShare?.({ files: [file] })
          ? { files: [file], title: 'My SigmaLog Progress', text }
          : { title: 'My SigmaLog Progress', text };
        await navigator.share(shareData);
        setSharing(false);
        return;
      }

      // Desktop / unsupported: try WhatsApp web fallback, else save
      const opened = await tryDeepLink(`whatsapp://send?text=${encodeURIComponent(text)}`);
      if (!opened) {
        saveFile(blob);
        toast.success('Image saved — share it on any platform!');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const blob = await getBlob().catch(() => null);
        if (blob) { saveFile(blob); toast.success('Image saved!'); }
      }
    }
    setSharing(false);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.92, y: 24  }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="w-full relative"
          style={{ maxWidth: 360 }}
        >
          {/* Subtle outer glow */}
          <div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.15), transparent 60%)', borderRadius: 24 }}
          />

          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ background: '#0f1421', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-5">
              <div>
                <p className="font-bold text-base text-white tracking-tight">Share Progress</p>
                <p className="text-xs text-gray-500 mt-0.5">Inspire others with your discipline</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="p-2 rounded-2xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            </div>

            {/* ── Period pills ────────────────────────────── */}
            <div className="px-6 pb-5">
              <div
                className="flex gap-2 overflow-x-auto pb-0.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {PERIODS.map(p => (
                  <motion.button
                    key={p.key}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setPeriod(p.key)}
                    className="flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer"
                    style={
                      period === p.key
                        ? {
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#ffffff',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.40)',
                            border: '1px solid rgba(139,92,246,0.5)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.05)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }
                    }
                  >
                    {p.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Card preview ────────────────────────────── */}
            <div className="px-6 pb-5">
              <motion.div
                key={period}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative w-full aspect-square rounded-2xl overflow-hidden"
                style={{
                  background: '#0a0e1a',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
                }}
              >
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background: '#0a0e1a' }}>
                    <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                    <p className="text-xs text-gray-600">Generating card…</p>
                  </div>
                )}
                {imgUrl && (
                  <motion.img
                    src={imgUrl}
                    alt="Progress card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: loading ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            </div>

            {/* ── Share button ────────────────────────────── */}
            <div className="px-6 pb-3">
              <motion.button
                whileHover={{ scale: sharing || loading ? 1 : 1.02 }}
                whileTap={{ scale: sharing || loading ? 1 : 0.98 }}
                onClick={handleShare}
                disabled={sharing || loading}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl
                  text-white text-sm font-bold tracking-wide
                  transition-opacity disabled:opacity-50 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: sharing || loading ? 'none' : '0 6px 20px rgba(99,102,241,0.45)',
                }}
              >
                {sharing
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Share2 className="w-4 h-4" />
                }
                {sharing ? 'Opening share…' : 'Share Now'}
              </motion.button>
            </div>

            {/* ── Marketing line ──────────────────────────── */}
            <div className="px-6 pb-6 pt-2 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                Install SigmaLog →{' '}
                <span className="text-indigo-400 font-medium">sigmalog.vercel.app</span>
              </p>
              <p className="text-xs text-gray-700 mt-1">Discipline creates freedom.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
