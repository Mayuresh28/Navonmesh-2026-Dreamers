"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, HeartPulse } from "lucide-react";
import Link from "next/link";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard/profile/setup");
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("email-already-in-use")) {
          setError("An account with this email already exists. Try signing in instead.");
        } else if (msg.includes("invalid-email")) {
          setError("Please enter a valid email address.");
        } else if (msg.includes("weak-password")) {
          setError("Password is too weak. Use at least 6 characters.");
        } else {
          setError(msg);
        }
      } else {
        setError("Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary bg-transparent">
      <GlassmorphicBackground />

      {/* Header */}
      <nav className="w-full px-6 py-6 md:px-12 z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm border border-border-soft">
            <HeartPulse className="text-primary w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-primary tracking-tight">धन्वंतरी</span>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 md:px-12 z-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-xl rounded-[32px] p-10 md:p-12 border border-accent/30 shadow-[0_8px_32px_rgb(90_127_232_/_0.15)] hover:shadow-[0_8px_48px_rgb(90_127_232_/_0.25)] transition-all duration-300">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Create Account
              </h1>
              <p className="text-text-secondary mb-8">
                Start your preventive health journey with us
              </p>
            </motion.div>

            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-status-high/10 border border-status-high/30 rounded-[16px] p-4"
                >
                  <p className="text-status-high text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field w-full"
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full"
                  required
                />
                <p className="text-text-secondary text-xs mt-2">
                  At least 6 characters
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full"
                  required
                />
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-8 border-t border-border-soft"
            >
              <p className="text-text-secondary text-sm text-center">
                Already have an account?{" "}
                <Link
                  href="/auth/sign-in"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
