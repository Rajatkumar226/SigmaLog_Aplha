import { useState } from "react";
import { motion } from "motion/react";
import { Shield, Flame, Target } from "lucide-react";
import * as authService from "../services/authService";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

interface AuthScreenProps {
  onAuthenticate: () => void;
}

export function AuthScreen({ onAuthenticate: _onAuthenticate }: AuthScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disciplineQuotes = [
    "Discipline equals freedom",
    "Build identity through action",
    "Your habits define you",
    "Consistency over intensity",
    "Track truth, build discipline",
  ];

  const [currentQuote] = useState(() =>
    Math.floor(Math.random() * disciplineQuotes.length)
  );

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    setError(null);
    const result = await authService.signInWithGoogle();
    if (!result.success) {
      setError(result.error || "Failed to sign in with Google");
      toast.error(result.error || "Failed to sign in with Google");
      setIsProcessing(false);
    }
    // On success the browser redirects to Google — no further action needed
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
        {/* Left — Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl mb-8 backdrop-blur-sm"
          >
            <Shield className="w-10 h-10" />
          </motion.div>

          <motion.h1
            className="text-5xl lg:text-6xl mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            SigmaLog
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xl text-gray-400 mb-8"
          >
            Log discipline. Build the Sigma.
          </motion.p>

          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-lg italic text-gray-300 flex-1">
                  "{disciplineQuotes[currentQuote]}"
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: Target, label: "Daily tracking", color: "text-blue-400" },
                { icon: Flame, label: "Streak system", color: "text-orange-400" },
                { icon: Shield, label: "Data privacy", color: "text-green-400" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-lg mb-2">
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <p className="text-xs text-gray-500">{feature.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right — Sign In Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-[#0f1421]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Sign In</h2>
              <p className="text-sm text-gray-400">
                One tap — no passwords, no hassle
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{
                scale: 1.03,
                boxShadow: '0 8px 32px rgba(66,133,244,0.25)',
              }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isProcessing}
              style={{
                color: '#111827',
                borderRadius: '14px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
              className="w-full px-6 py-4 bg-white font-medium
                transition-all flex items-center justify-center gap-3
                hover:bg-gray-50 disabled:opacity-50
                shadow-md"
            >
              {isProcessing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full"
                  />
                  <span>Redirecting to Google...</span>
                </>
              ) : (
                <>
                  <motion.span
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    style={{ display: 'flex' }}
                  >
                    <GoogleIcon />
                  </motion.span>
                  <span>Continue with Google</span>
                </>
              )}
            </motion.button>

            <p className="text-xs text-center text-gray-600 mt-6">
              Your data is private and only visible to you
            </p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-center text-gray-600 mt-6"
          >
            Alpha version — discipline in progress
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
