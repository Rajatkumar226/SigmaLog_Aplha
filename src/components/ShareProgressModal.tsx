import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Instagram, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { generateShareImage, type SharePeriod } from '../utils/generateShareImage';
import type { DailyLog } from '../App';

interface ShareProgressModalProps {
  streak: number;
  dailyLogs: DailyLog[];
  onClose: () => void;
}

const PERIOD_CONFIG: { key: SharePeriod; label: string; days: number }[] = [
  { key: 'daily',       label: 'Today',       days: 1   },
  { key: 'weekly',      label: 'Weekly',      days: 7   },
  { key: 'quarterly',   label: 'Quarterly',   days: 90  },
  { key: 'half_yearly', label: 'Half Year',   days: 182 },
  { key: 'yearly',      label: 'Yearly',      days: 365 },
];

function buildShareData(dailyLogs: DailyLog[], period: SharePeriod, streak: number) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayLog = dailyLogs.find(l => l.date === todayStr);

  if (period === 'daily') {
    return {
      period,
      streak,
      avgScore: 0,
      daysLogged: 0,
      totalDays: 1,
      perfectDays: 0,
      todayScore: todayLog?.score ?? 0,
      todayMaxScore: todayLog?.maxScore ?? 0,
      habitsCompleted: todayLog?.completedHabits.length ?? 0,
      totalHabits: todayLog?.maxScore ?? 0,
    };
  }

  const days = PERIOD_CONFIG.find(p => p.key === period)!.days;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const inRange = dailyLogs.filter(l => new Date(l.date) >= cutoff);
  const logged  = inRange.filter(l => l.score > 0);
  const perfect = inRange.filter(l => l.maxScore > 0 && l.score === l.maxScore);
  const avg = logged.length > 0
    ? Math.round(logged.reduce((s, l) => s + (l.score / l.maxScore) * 100, 0) / logged.length)
    : 0;

  return {
    period,
    streak,
    avgScore: avg,
    daysLogged: logged.length,
    totalDays: days,
    perfectDays: perfect.length,
    todayScore: todayLog?.score ?? 0,
    todayMaxScore: todayLog?.maxScore ?? 0,
    habitsCompleted: todayLog?.completedHabits.length ?? 0,
    totalHabits: todayLog?.maxScore ?? 0,
  };
}

function buildShareText(period: SharePeriod, streak: number, avgScore: number, daysLogged: number, totalDays: number, todayScore: number, todayMaxScore: number): string {
  if (period === 'daily') {
    const pct = todayMaxScore > 0 ? Math.round((todayScore / todayMaxScore) * 100) : 0;
    return `${pct}% score today on SigmaLog 🔥\n${streak} day streak going strong\nsigmalog.vercel.app`;
  }
  const label = PERIOD_CONFIG.find(p => p.key === period)!.label.toLowerCase();
  return `${streak} day streak on SigmaLog 🔥\n${avgScore}% avg this ${label} · ${daysLogged}/${totalDays} days logged\nsigmalog.vercel.app`;
}

function tryDeepLink(url: string): Promise<boolean> {
  return new Promise(resolve => {
    let resolved = false;
    const done = (opened: boolean) => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener('blur', onBlur);
      clearTimeout(timer);
      resolve(opened);
    };
    const onBlur = () => done(true);
    const timer = setTimeout(() => done(false), 2200);
    window.addEventListener('blur', onBlur);
    window.location.href = url;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ShareProgressModal({ streak, dailyLogs, onClose }: ShareProgressModalProps) {
  const [period, setPeriod] = useState<SharePeriod>('daily');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const prevPreviewRef = useRef<string | null>(null);

  const shareData = buildShareData(dailyLogs, period, streak);
  const shareText = buildShareText(period, streak, shareData.avgScore, shareData.daysLogged, shareData.totalDays, shareData.todayScore, shareData.todayMaxScore);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    blobRef.current = null;

    generateShareImage(shareData)
      .then(blob => {
        if (cancelled) return;
        if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current);
        const url = URL.createObjectURL(blob);
        prevPreviewRef.current = url;
        blobRef.current = blob;
        setPreviewUrl(url);
      })
      .catch(() => toast.error('Failed to generate card'))
      .finally(() => { if (!cancelled) setGenerating(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, streak]);

  const getBlob = async (): Promise<Blob | null> => {
    if (blobRef.current) return blobRef.current;
    try {
      const blob = await generateShareImage(shareData);
      blobRef.current = blob;
      return blob;
    } catch {
      toast.error('Failed to generate image');
      return null;
    }
  };

  const nativeShare = async (blob: Blob) => {
    const file = new File([blob], 'sigmalog-progress.png', { type: 'image/png' });
    if (navigator.share) {
      const data: ShareData = navigator.canShare?.({ files: [file] })
        ? { files: [file], title: 'My SigmaLog Progress', text: shareText }
        : { title: 'My SigmaLog Progress', text: shareText };
      await navigator.share(data);
      return true;
    }
    return false;
  };

  const handleNativeShare = async () => {
    setSharing('native');
    const blob = await getBlob();
    if (!blob) { setSharing(null); return; }
    try {
      const shared = await nativeShare(blob);
      if (!shared) { downloadBlob(blob, 'sigmalog-progress.png'); toast.success('Image saved — share it anywhere!'); }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { downloadBlob(blob, 'sigmalog-progress.png'); toast.success('Image saved!'); }
    }
    setSharing(null);
  };

  const handleWhatsApp = async () => {
    setSharing('whatsapp');
    const blob = await getBlob();
    if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'x.png', { type: 'image/png' })] })) {
      try { await navigator.share({ files: [new File([blob], 'sigmalog-progress.png', { type: 'image/png' })], text: shareText }); setSharing(null); return; }
      catch (e) { if ((e as Error).name === 'AbortError') { setSharing(null); return; } }
    }
    const opened = await tryDeepLink(`whatsapp://send?text=${encodeURIComponent(shareText)}`);
    if (!opened) window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    if (blob) { downloadBlob(blob, 'sigmalog-progress.png'); toast.success('Image saved — attach it in WhatsApp!'); }
    setSharing(null);
  };

  const handleInstagram = async () => {
    setSharing('instagram');
    const blob = await getBlob();
    if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'x.png', { type: 'image/png' })] })) {
      try { await navigator.share({ files: [new File([blob], 'sigmalog-progress.png', { type: 'image/png' })], title: 'SigmaLog Progress' }); setSharing(null); return; }
      catch (e) { if ((e as Error).name === 'AbortError') { setSharing(null); return; } }
    }
    if (blob) downloadBlob(blob, 'sigmalog-progress.png');
    const opened = await tryDeepLink('instagram://app');
    toast[opened ? 'success' : 'error'](opened ? 'Image saved! Share it to your Story or Feed.' : "Instagram not found. Image saved — install it and share!");
    setSharing(null);
  };

  const handleFacebook = async () => {
    setSharing('facebook');
    const blob = await getBlob();
    if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'x.png', { type: 'image/png' })] })) {
      try { await navigator.share({ files: [new File([blob], 'sigmalog-progress.png', { type: 'image/png' })], title: 'SigmaLog Progress' }); setSharing(null); return; }
      catch (e) { if ((e as Error).name === 'AbortError') { setSharing(null); return; } }
    }
    if (blob) downloadBlob(blob, 'sigmalog-progress.png');
    const opened = await tryDeepLink('fb://');
    if (!opened) window.open('https://www.facebook.com', '_blank');
    toast.success('Image saved! Create a post and attach it.');
    setSharing(null);
  };

  const handleSave = async () => {
    setSharing('save');
    const blob = await getBlob();
    if (blob) { downloadBlob(blob, 'sigmalog-progress.png'); toast.success('Image saved!'); }
    setSharing(null);
  };

  const Spinner = ({ color = 'border-t-white' }: { color?: string }) => (
    <div className={`w-4 h-4 border-2 border-white/20 ${color} rounded-full animate-spin`} />
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full sm:max-w-md bg-[#0f1421] border border-white/15 rounded-t-3xl sm:rounded-3xl overflow-hidden"
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div>
              <p className="font-semibold text-base">Share Progress</p>
              <p className="text-xs text-gray-500 mt-0.5">Share your discipline journey</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Period tabs — horizontal scroll */}
          <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-hide">
            {PERIOD_CONFIG.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  period === p.key
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/5 text-gray-500 border border-white/8 hover:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Card preview — fixed height, not square */}
          <div className="px-5 pb-4">
            <div className="relative w-full overflow-hidden rounded-2xl bg-[#0a0e1a]" style={{ height: 200 }}>
              {generating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Share card preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${generating ? 'opacity-0' : 'opacity-100'}`}
                />
              )}
            </div>
          </div>

          {/* Share buttons */}
          <div className="px-5 pb-6 space-y-2.5">
            {/* Primary share */}
            <button
              onClick={handleNativeShare}
              disabled={!!sharing || generating}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                bg-indigo-500/20 hover:bg-indigo-500/28 border border-indigo-500/30
                text-indigo-300 text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
            >
              {sharing === 'native' ? <Spinner color="border-t-indigo-300" /> : <Share2 className="w-4 h-4" />}
              Share
            </button>

            {/* Platform row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleWhatsApp}
                disabled={!!sharing || generating}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                  bg-white/5 hover:bg-green-500/10 border border-white/8 hover:border-green-500/20
                  transition-all disabled:opacity-50 cursor-pointer"
              >
                {sharing === 'whatsapp' ? <Spinner /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.524 5.847L.057 23.998l6.305-1.654A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.953 0-3.77-.538-5.316-1.473l-.381-.227-3.942 1.034 1.053-3.844-.247-.395A9.936 9.936 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                )}
                <span className="text-xs text-gray-400">WhatsApp</span>
              </button>

              <button
                onClick={handleInstagram}
                disabled={!!sharing || generating}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                  bg-white/5 hover:bg-pink-500/10 border border-white/8 hover:border-pink-500/20
                  transition-all disabled:opacity-50 cursor-pointer"
              >
                {sharing === 'instagram' ? <Spinner /> : <Instagram className="w-5 h-5 text-pink-400" />}
                <span className="text-xs text-gray-400">Instagram</span>
              </button>

              <button
                onClick={handleFacebook}
                disabled={!!sharing || generating}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                  bg-white/5 hover:bg-blue-500/10 border border-white/8 hover:border-blue-500/20
                  transition-all disabled:opacity-50 cursor-pointer"
              >
                {sharing === 'facebook' ? <Spinner /> : <Facebook className="w-5 h-5 text-blue-400" />}
                <span className="text-xs text-gray-400">Facebook</span>
              </button>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!!sharing || generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                bg-white/5 hover:bg-white/8 border border-white/8
                text-gray-400 text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {sharing === 'save' ? <Spinner /> : <Download className="w-4 h-4" />}
              Save Image
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
