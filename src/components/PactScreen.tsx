import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Check, X, Trash2, Flame, Link as LinkIcon } from 'lucide-react';
import { Header } from './Header';
import { useScrolled } from '../hooks/useScrolled';
import { usePartners } from '../hooks/usePartners';
import * as partnerService from '../services/partnerService';
import { toast } from 'sonner';

interface PactScreenProps {
  onNavigate: (screen: 'dashboard' | 'progress' | 'settings' | 'mirror' | 'pact') => void;
}

export function PactScreen({ onNavigate }: PactScreenProps) {
  const scrolled = useScrolled();
  const { partners, requests, sent, loading, sendRequest, respond, remove, cancel } = usePartners();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    const res = await sendRequest(email.trim());
    setSending(false);
    if (res.ok) {
      toast.success(res.message);
      setEmail('');
    } else {
      toast.error(res.message);
    }
  };

  const handleShareLink = async () => {
    const code = await partnerService.getMyInviteCode();
    if (!code) {
      toast.error('Could not create an invite link. Try again.');
      return;
    }
    const url = `${window.location.origin}/?invite=${code}`;
    const text = `I'm building discipline on SigmaLog 🗿 — be my accountability partner: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SigmaLog', text });
      } catch {
        /* user cancelled share sheet */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Invite link copied — paste it to a friend.');
      } catch {
        toast.message(url);
      }
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6" style={{ paddingTop: 96, paddingBottom: 56 }}>
      <div className="max-w-3xl mx-auto">
        <Header onNavigate={onNavigate} currentScreen={'pact' as any} scrolled={scrolled} />

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🤝</span>
            <h2 className="leading-none">Accountability Pact</h2>
          </div>
          <p className="text-sm text-gray-500">
            Link with someone who sees whether you show up. No hiding, no excuses.
          </p>
        </motion.div>

        {/* Invite */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-gray-400" />
            <h3 className="leading-none text-base">Add a partner</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            They need a SigmaLog account. They'll see only your daily completion % and streak — never your habits.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="partner@email.com"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            />
            <button
              onClick={handleSend}
              disabled={!email.trim() || sending}
              className="w-full sm:w-auto px-5 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>

          {/* Share invite link — works even if they don't have an account yet */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] uppercase tracking-widest text-gray-600">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <button
            onClick={handleShareLink}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            Share an invite link
          </button>
          <p className="text-[11px] text-gray-600 mt-2 text-center">
            Send it to anyone — they don't need an account yet. They join, you're partners.
          </p>
        </motion.div>

        {/* Sent (outgoing pending) requests */}
        <AnimatePresence>
          {sent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest text-[11px]">Sent — waiting to accept</h3>
              <div className="space-y-2">
                {sent.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm truncate">{s.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Pending — waiting for them to accept</p>
                    </div>
                    <button
                      onClick={async () => { if (await cancel(s.id)) toast.success('Request cancelled'); }}
                      className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incoming requests */}
        <AnimatePresence>
          {requests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest text-[11px]">Requests</h3>
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-sm truncate mr-3">{r.email}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={async () => { if (await respond(r.id, true)) toast.success('Partner added'); }}
                        className="p-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg transition-colors cursor-pointer"
                        aria-label="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => respond(r.id, false)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors cursor-pointer"
                        aria-label="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Partners */}
        <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-widest text-[11px]">Your partners</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Loading...
          </div>
        ) : partners.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-3xl mb-3">🤝</div>
            <p className="text-sm text-gray-400">No partners yet. Add one above — discipline holds better with a witness.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map((p) => (
              <motion.div
                key={p.partnerId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between border rounded-2xl p-4 ${
                  p.completedToday ? 'bg-green-500/[0.07] border-green-500/25' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.todayMax > 0
                      ? p.completedToday
                        ? 'Done for today ✅'
                        : `Today: ${p.todayPct}% — not done yet`
                      : 'No habits set'}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm">
                    <Flame className={`w-4 h-4 ${p.streak > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
                    {p.streak}
                  </div>
                  <button
                    onClick={async () => { if (await remove(p.partnerId)) toast.success('Partner removed'); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    aria-label="Remove partner"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
