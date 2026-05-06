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
      todayScore:      todayLog?.score ?? 0,
      todayMaxScore:   todayLog?.maxScore ?? 0,
      habitsCompleted: todayLog?.completedHabits.length ?? 0,
      totalHabits:     todayLog?.maxScore ?? 0,
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
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      window.removeEventListener('blur', onBlur);
      clearTimeout(t);
      resolve(v);
    };
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
  const [period, setPeriod]   = useState<SharePeriod>('daily');
  const [imgUrl, setImgUrl]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const urlRef  = useRef<string | null>(null);

  const data = buildShareData(dailyLogs, period, streak);
  const text = buildText(period, streak, data.avgScore, data.daysLogged, data.totalDays, data.todayScore, data.todayMaxScore);

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

      if (navigator.share) {
        const shareData: ShareData = navigator.canShare?.({ files: [file] })
          ? { files: [file], title: 'My SigmaLog Progress', text }
          : { title: 'My SigmaLog Progress', text };
        await navigator.share(shareData);
        setSharing(false);
        return;
      }

      const opened = await tryDeepLink(`whatsapp://send?text=${encodeURIComponent(text)}`);
      if (!opened) {
        saveFile(blob);
        toast.success('Image saved — share it anywhere!');
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
      {/* ── Backdrop ──────────────────────────────────────── */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >

        {/* ── Modal wrapper ─────────────────────────────── */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.86, y: 40 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.90, y: 20  }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.9 }}
          style={{ width: '100%', maxWidth: 400, position: 'relative' }}
        >
          {/* Ambient glow behind card */}
          <div style={{
            position: 'absolute',
            inset: '-20px -20px -40px',
            background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
            borderRadius: 40,
          }} />

          {/* ── Card ──────────────────────────────────────── */}
          <div style={{
            position: 'relative',
            borderRadius: 28,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #131929 0%, #0d1220 60%, #111827 100%)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
          }}>

            {/* Top accent gradient bar */}
            <div style={{
              height: 4,
              background: 'linear-gradient(90deg, transparent 0%, #6366f1 30%, #8b5cf6 70%, transparent 100%)',
            }} />

            {/* ── Header ──────────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '24px 24px 0',
            }}>
              <div>
                <h2 style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  Share Progress
                </h2>
                <p style={{
                  fontSize: 13,
                  color: '#94a3b8',
                  marginTop: 6,
                  lineHeight: 1.45,
                }}>
                  Show the world your sigma discipline
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                onClick={onClose}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              background: 'rgba(255,255,255,0.06)',
              margin: '20px 24px 0',
            }} />

            {/* ── Period tabs ─────────────────────────────── */}
            <div style={{ padding: '18px 24px 0' }}>
              <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollbarWidth: 'none',
              }}>
                {PERIODS.map(p => (
                  <motion.button
                    key={p.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                    onClick={() => setPeriod(p.key)}
                    style={{
                      flexShrink: 0,
                      padding: '9px 18px',
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '-0.1px',
                      cursor: 'pointer',
                      lineHeight: 1,
                      ...(period === p.key
                        ? {
                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                            color: '#ffffff',
                            boxShadow: '0 4px 18px rgba(99,102,241,0.55)',
                            border: '1px solid rgba(139,92,246,0.6)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.07)',
                            color: '#cbd5e1',
                            border: '1px solid rgba(255,255,255,0.09)',
                          }
                      ),
                    }}
                  >
                    {p.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Card preview ────────────────────────────── */}
            <div style={{ padding: '20px 24px 0' }}>
              <motion.div
                key={period}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: '#0a0e1a',
                  boxShadow: '0 20px 56px rgba(0,0,0,0.65), 0 0 0 1px rgba(99,102,241,0.14)',
                }}
              >
                {loading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 14,
                    background: '#0a0e1a',
                  }}>
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      border: '2.5px solid rgba(99,102,241,0.2)',
                      borderTopColor: '#818cf8',
                      animation: 'spin 0.8s linear infinite',
                    }} className="animate-spin" />
                    <p style={{ fontSize: 12, color: '#475569', letterSpacing: '0.04em' }}>
                      Generating card…
                    </p>
                  </div>
                )}
                {imgUrl && (
                  <motion.img
                    src={imgUrl}
                    alt="Progress card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: loading ? 0 : 1 }}
                    transition={{ duration: 0.35 }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </motion.div>
            </div>

            {/* ── Share button ────────────────────────────── */}
            <div style={{ padding: '20px 24px 0' }}>
              <motion.button
                whileHover={{ scale: sharing || loading ? 1 : 1.025 }}
                whileTap={{ scale: sharing || loading ? 1 : 0.975 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                onClick={handleShare}
                disabled={sharing || loading}
                style={{
                  width: '100%',
                  height: 58,
                  borderRadius: 16,
                  border: 'none',
                  background: sharing || loading
                    ? 'rgba(99,102,241,0.45)'
                    : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  boxShadow: sharing || loading
                    ? 'none'
                    : '0 8px 28px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  cursor: sharing || loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: loading ? 0.65 : 1,
                  transition: 'background 0.2s, box-shadow 0.2s, opacity 0.2s',
                }}
              >
                {sharing
                  ? (
                    <div style={{
                      width: 20, height: 20,
                      borderRadius: '50%',
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                    }} className="animate-spin" />
                  )
                  : <Share2 size={19} />
                }
                <span>{sharing ? 'Sharing…' : 'Share Now'}</span>
              </motion.button>
            </div>

            {/* ── Footer ──────────────────────────────────── */}
            <div style={{
              padding: '16px 24px 28px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Install SigmaLog →{' '}
                <span style={{ color: '#818cf8', fontWeight: 600 }}>sigmalog.vercel.app</span>
              </p>
              <p style={{
                fontSize: 11,
                color: '#4b5563',
                marginTop: 5,
                letterSpacing: '0.05em',
              }}>
                Discipline creates freedom.
              </p>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
