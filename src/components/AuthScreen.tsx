import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ArrowRight, Shield, Flame, Target } from "lucide-react";
import * as authService from "../services/authService";
import { toast } from "sonner";

interface AuthScreenProps {
  onAuthenticate: () => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsProcessing(true);
    setError(null);

    const result = await authService.sendMagicLink(email);

    setIsProcessing(false);

    if (result.success) {
      setStage("otp");
      toast.success("OTP sent! Check your email.");
    } else {
      setError(result.error || "Failed to send OTP");
      toast.error(result.error || "Failed to send OTP");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((digit) => digit) && index === 5) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    setIsProcessing(true);
    setError(null);

    const result = await authService.verifyOtp(email, code);

    setIsProcessing(false);

    if (result.success) {
      toast.success("Welcome to SigmaLog!");
      onAuthenticate();
    } else {
      setError(result.error || "Invalid OTP code");
      toast.error(result.error || "Invalid OTP code");
      setOtp(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("otp-0");
      firstInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    setIsProcessing(true);
    setError(null);

    const result = await authService.sendMagicLink(email);

    setIsProcessing(false);

    if (result.success) {
      toast.success("New OTP sent! Check your email.");
      setOtp(["", "", "", "", "", ""]);
    } else {
      setError(result.error || "Failed to resend OTP");
      toast.error(result.error || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
        {/* Left side - Branding & Philosophy */}
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
            {stage === "input"
              ? "Enter your email to continue"
              : "Verify your identity"}
          </motion.p>

          {/* Rotating discipline quotes */}
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
                <div className="flex-1">
                  <p className="text-lg italic text-gray-300">
                    "{disciplineQuotes[currentQuote]}"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Feature indicators */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                {
                  icon: Target,
                  label: "Daily tracking",
                  color: "text-blue-400",
                },
                {
                  icon: Flame,
                  label: "Streak system",
                  color: "text-orange-400",
                },
                {
                  icon: Shield,
                  label: "Data privacy",
                  color: "text-green-400",
                },
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

        {/* Right side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-[#0f1421]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                {stage === "input" ? "Sign In" : "Enter OTP"}
              </h2>
              <p className="text-sm text-gray-400">
                {stage === "input"
                  ? "No password needed — we use secure OTP"
                  : `Code sent to ${email}`}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {stage === "input" ? (
                <motion.form
                  key="input-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-gray-400 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-lg
                          focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                        required
                        autoFocus
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isProcessing || !email}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-white/10 to-white/[0.15]
                      hover:from-white/[0.15] hover:to-white/20
                      border border-white/20 rounded-lg transition-all flex items-center justify-center gap-2
                      hover:shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed
                      relative overflow-hidden group"
                  >
                    {isProcessing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                        />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue with Email</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-center text-gray-500 pt-2">
                    We'll send a 6-digit code to verify your email
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="otp-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/5 border border-white/10 rounded-full mb-4"
                    >
                      <Mail className="w-8 h-8 text-blue-400" />
                    </motion.div>
                    <h3 className="text-xl mb-2">Check your email</h3>
                    <p className="text-sm text-gray-400">
                      Enter the 6-digit code sent to{" "}
                      <span className="text-white">{email}</span>
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-3 text-center">
                      Verification Code
                    </label>
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, index) => (
                        <motion.input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          disabled={isProcessing}
                          className="w-10 h-10 md:w-12 md:h-14 text-center text-2xl bg-white/5 border border-white/10 rounded-lg
                            focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all
                            focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                        />
                      ))}
                    </div>
                  </div>

                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                        />
                        Verifying...
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStage("input");
                        setOtp(["", "", "", "", "", ""]);
                        setError(null);
                      }}
                      disabled={isProcessing}
                      className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      ← Use different email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isProcessing}
                      className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Alpha indicator */}
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
