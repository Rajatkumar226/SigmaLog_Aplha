import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Instagram, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { generateShareImage } from '../utils/generateShareImage';
import type { DailyLog } from '../App';

interface ShareProgressModalProps {
  streak: number;
  dailyLogs: DailyLog[];
  onClose: () => void;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_CONFIG: { key: Period; label: string; days: number }[] = [
  { key: 'week',    label: 'Week',    days: 7   },
  { key: 'month',   label: 'Month',   days: 30  },
  { key: 'quarter', label: 'Quarter', days: 90  },
  { key: 'year',    label: 'Year',    days: 365 },
];

function getPeriodStats(dailyLogs: DailyLog[], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const logs = dailyLogs.filter(l => new Date(l.date) >= cutoff);
  const logged = logs.filter(l => l.score > 0);
  const perfect = logs.filter(l => l.maxScore > 0 && l.score === l.maxScore);
  const avgScore =
    logged.length > 0
      ? Math.round(logged.reduce((s, l) => s + (l.score / l.maxScore) * 100, 0) / logged.length)
      : 0;

  return {
    avgScore,
    daysLogged: logged.length,
    totalDays: days,
    perfectDays: perfect.length,
  };
}

// Tries to open a URL scheme and detects if the app opened via window blur
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
  const [period, setPeriod] = useState<Period>('week');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const stats = getPeriodStats(dailyLogs, PERIOD_CONFIG.find(p => p.key === period)!.days);

  // Regenerate card whenever period or streak changes
  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    generateShareImage({ streak, period, ...stats })
      .then(blob => {
        if (cancelled) return;
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch(() => toast.error('Failed to generate card'))
      .finally(() => { if (!cancelled) setGenerating(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, streak, dailyLogs]);

  const getBlob = async (): Promise<Blob | null> => {
    if (blobRef.current) return blobRef.current;
    try {
      const blob = await generateShareImage({ streak, period, ...stats });
      blobRef.current = blob;
      return blob;
    } catch {
      toast.error('Failed to generate image');
      return null;
    }
  };

  const shareText = `${streak} day streak on SigmaLog 🔥\n${stats.avgScore}% avg this ${period} · ${stats.daysLogged}/${stats.totalDays} days logged\nsigmalog.vercel.app`;

  // ── Native share (best for mobile — shows all installed apps) ────────────
  const handleNativeShare = async () => {
    setSharing('native');
    const blob = await getBlob();
    if (!blob) { setSharing(null); return; }

    const file = new File([blob], 'sigmalog-progress.png', { type: 'image/png' });

    if (navigator.share) {
      try {
        const shareData: ShareData = navigator.canShare?.({ files: [file] })
          ? { files: [file], title: 'My SigmaLog Progress', text: shareText }
          : { title: 'My SigmaLog Progress', text: shareText };
        await navigator.share(shareData);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          // Fallback: download
          downloadBlob(blob, 'sigmalog-progress.png');
          toast.success('Image saved — share it anywhere!');
        }
      }
    } else {
      downloadBlob(blob, 'sigmalog-progress.png');
      toast.success('Image saved — share it anywhere!');
    }
    setSharing(null);
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const handleWhatsApp = async () => {
    setSharing('whatsapp');
    const blob = await getBlob();

    // Try file share first (Android Chrome shows WhatsApp in native sheet)
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], 'sigmalog-progress.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'SigmaLog Progress', text: shareText });
          setSharing(null);
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') { setSharing(null); return; }
        }
      }
    }

    // Fallback: open WhatsApp with text
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    const opened = await tryDeepLink(`whatsapp://send?text=${encodeURIComponent(shareText)}`);
    if (!opened) {
      // Try web fallback
      window.open(waUrl, '_blank');
    }
    if (blob) { downloadBlob(blob, 'sigmalog-progress.png'); toast.success('Image saved — attach it in WhatsApp!'); }
    setSharing(null);
  };

  // ── Instagram ─────────────────────────────────────────────────────────────
  const handleInstagram = async () => {
    setSharing('instagram');
    const blob = await getBlob();

    // Try Web Share API with file (Android + iOS 15+ Safari)
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], 'sigmalog-progress.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'SigmaLog Progress' });
          setSharing(null);
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') { setSharing(null); return; }
        }
      }
    }

    // Save image first, then try to open Instagram
    if (blob) downloadBlob(blob, 'sigmalog-progress.png');

    const opened = await tryDeepLink('instagram://app');
    if (opened) {
      toast.success('Image saved! Share it to your Instagram Story or Feed.');
    } else {
      toast.error("Instagram not found. Image saved — install Instagram and share it!");
    }
    setSharing(null);
  };

  // ── Facebook ──────────────────────────────────────────────────────────────
  const handleFacebook = async () => {
    setSharing('facebook');
    const blob = await getBlob();

    // Try Web Share API with file
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], 'sigmalog-progress.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'SigmaLog Progress' });
          setSharing(null);
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') { setSharing(null); return; }
        }
      }
    }

    // Fallback: download image + open Facebook
    if (blob) downloadBlob(blob, 'sigmalog-progress.png');

    const opened = await tryDeepLink('fb://');
    if (!opened) {
      window.open('https://www.facebook.com', '_blank');
      if (!blob) { setSharing(null); return; }
      toast("Image saved! Upload it as a Facebook post.", { icon: 'ℹ️' });
    } else {
      toast.success('Image saved! Create a post and attach it.');
    }
    setSharing(null);
  };

  // ── Save image ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSharing('save');
    const blob = await getBlob();
    if (blob) { downloadBlob(blob, 'sigmalog-progress.png'); toast.success('Image saved!'); }
    setSharing(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-sm bg-[#0f1629] border border-white/10 rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h3 className="text-base font-semibold">Share Progress</h3>
              <p className="text-xs text-gray-500 mt-0.5">Your streak card, ready to post</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Period tabs */}
          <div className="flex gap-2 px-6 pb-4">
            {PERIOD_CONFIG.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  period === p.key
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Card preview */}
          <div className="px-6 pb-5">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0a0e1a]">
              {generating && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
          <div className="px-6 pb-6 space-y-3">
            {/* Primary: Native share */}
            <button
              onClick={handleNativeShare}
              disabled={!!sharing || generating}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30
                text-indigo-300 text-sm font-medium transition-all disabled:opacity-50"
            >
              {sharing === 'native'
                ? <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                : <Share2 className="w-4 h-4" />
              }
              Share
            </button>

            {/* Platform row */}
            <div className="grid grid-cols-3 gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                disabled={!!sharing || generating}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                  bg-white/5 hover:bg-green-500/10 border border-white/8 hover:border-green-500/20
                  transition-all disabled:opacity-50"
              >
                {sharing === 'whatsapp'
                  ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.524 5.847L.057 23.998l6.305-1.654A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.953 0-3.77-.538-5.316-1.473l-.381-.227-3.942 1.034 1.053-3.844-.247-.395A9.936 9.936 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                }
                <span className="text-xs text-gray-400">WhatsApp</span>
              </button>

              {/* Instagram */}
              <button
                onClick={handleInstagram}
                disabled={!!sharing || generating}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                  bg-white/5 hover:bg-pink-500/10 border border-white/8 hover:border-pink-500/20
                  transition-all disabled:opacity-50"
              >
                {sharing === 'instagram'
                  ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <Instagram className="w-5 h-5 text-pink-400" />
                }
                <span className="text-xs text-gray-400">Instagram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebook}
                disabled={!!sharing || generating}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl
                  bg-white/5 hover:bg-blue-500/10 border border-white/8 hover:border-blue-500/20
                  transition-all disabled:opacity-50"
              >
                {sharing === 'facebook'
                  ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <Facebook className="w-5 h-5 text-blue-400" />
                }
                <span className="text-xs text-gray-400">Facebook</span>
              </button>
            </div>

            {/* Save image */}
            <button
              onClick={handleSave}
              disabled={!!sharing || generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                bg-white/5 hover:bg-white/8 border border-white/8
                text-gray-400 text-sm transition-all disabled:opacity-50"
            >
              {sharing === 'save'
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <Download className="w-4 h-4" />
              }
              Save Image
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
