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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.95, y: 20  }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full bg-[#0f1421] border border-white/10 rounded-2xl overflow-hidden"
          style={{ maxWidth: 360 }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <p className="font-semibold text-base text-white">Share Progress</p>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/8 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* ── Period tabs ── */}
          <div className="flex gap-1.5 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  period === p.key
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-gray-500 border border-white/8 hover:text-gray-300 hover:bg-white/8'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Card preview (square) ── */}
          <div className="px-5 pb-4">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0a0e1a]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
                </div>
              )}
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt="Progress card"
                  className={`w-full h-full object-cover transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
                />
              )}
            </div>
          </div>

          {/* ── Share button ── */}
          <div className="px-5 pb-5">
            <button
              onClick={handleShare}
              disabled={sharing || loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white text-sm font-semibold rounded-xl
                transition-all disabled:opacity-50 cursor-pointer"
            >
              {sharing
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Share2 className="w-4 h-4" />
              }
              {sharing ? 'Opening...' : 'Share'}
            </button>

            {/* ── Marketing line ── */}
            <p className="text-center text-xs text-gray-600 mt-3 leading-relaxed">
              Install SigmaLog →{' '}
              <span className="text-gray-500">sigmalog.vercel.app</span>
              <br />
              <span className="text-gray-700">Discipline creates freedom.</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
