"use client";

import { useState, useMemo, useCallback } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import AuthPuppet, { type PuppetState } from "@/components/auth/auth-puppet";

/* Deterministic bubbles — no Math.random() to avoid hydration mismatch */
const BUBBLES = [
  { id: 0, size: 38, left: 8, delay: 0, dur: 12 },
  { id: 1, size: 24, left: 22, delay: 2.5, dur: 14 },
  { id: 2, size: 52, left: 35, delay: 1.2, dur: 10 },
  { id: 3, size: 30, left: 48, delay: 3.8, dur: 16 },
  { id: 4, size: 44, left: 60, delay: 0.8, dur: 11 },
  { id: 5, size: 20, left: 72, delay: 4.5, dur: 13 },
  { id: 6, size: 56, left: 85, delay: 1.8, dur: 15 },
  { id: 7, size: 32, left: 15, delay: 5.2, dur: 9 },
  { id: 8, size: 46, left: 42, delay: 2.2, dur: 17 },
  { id: 9, size: 28, left: 55, delay: 3.0, dur: 12 },
  { id: 10, size: 40, left: 78, delay: 0.5, dur: 14 },
  { id: 11, size: 34, left: 92, delay: 4.0, dur: 10 },
];

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | "confirm" | null>(null);
  const router = useRouter();

  const puppetState: PuppetState = useMemo(() => {
    if (success) return "success";
    if (error) return "error";
    if (focusedField === "password" || focusedField === "confirm") return "hiding";
    if (focusedField === "email") return "watching";
    return "idle";
  }, [focusedField, error, success]);

  const puppetProgress = useMemo(() => {
    if (focusedField === "email") return Math.min(email.length / 30, 1);
    return 0;
  }, [focusedField, email]);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
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
    setSuccess(false);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/profile/setup"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, router]);

  return (
    <div className="auth-page">
      {/* ── Animated background ── */}
      <div className="auth-bg">
        <div className="auth-blob ab1" />
        <div className="auth-blob ab2" />
        <div className="auth-blob ab3" />
        {BUBBLES.map((b) => (
          <span
            key={b.id}
            className="auth-bubble"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            }}
          />
        ))}
      </div>

      {/* ── Glass card ── */}
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* LEFT — Puppet */}
        <div className="auth-card-left">
          <div className="auth-card-left-inner">
            <AuthPuppet state={puppetState} progress={puppetProgress} />
            <motion.p
              className="puppet-caption"
              key={puppetState}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {puppetState === "hiding"
                ? "Your secret's safe 🔒"
                : puppetState === "watching"
                ? "Great choice! ✨"
                : puppetState === "success"
                ? "Account created! 🎉"
                : puppetState === "error"
                ? "Let's fix that 😕"
                : "Let's get started! 🌿"}
            </motion.p>
          </div>
          <svg className="auth-mandala-bg" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
            <circle cx="250" cy="250" r="224" stroke="#d94f8c" strokeWidth="1.5" opacity=".15" fill="none" />
            <circle cx="250" cy="250" r="182" stroke="#a040c8" strokeWidth="1" opacity=".12" fill="none" strokeDasharray="6 11" />
            <circle cx="250" cy="250" r="140" stroke="#c9a84c" strokeWidth=".8" opacity=".08" fill="none" strokeDasharray="3 8" />
            <polygon points="250,32 456,384 44,384" stroke="#d94f8c" strokeWidth="1" opacity=".1" fill="none" />
            <polygon points="250,468 44,116 456,116" stroke="#a040c8" strokeWidth="1" opacity=".1" fill="none" />
          </svg>
        </div>

        {/* RIGHT — Form */}
        <div className="auth-card-right">
          <motion.div
            className="auth-card-right-inner"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <Link href="/" className="auth-logo-link">
              <span className="auth-logo-text">धन्वंतरी</span>
            </Link>

            <h1 className="auth-heading">Create Account</h1>
            <p className="auth-sub">Begin your Vedic health journey with Dhanvantari</p>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {error.includes("auth/email-already")
                    ? "This email is already registered"
                    : error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSignUp} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    className="auth-input"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="auth-input auth-input-pw"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span className="auth-hint">At least 6 characters</span>
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showCpw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="auth-input auth-input-pw"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowCpw(!showCpw)}
                    tabIndex={-1}
                  >
                    {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="auth-fill-dummy"
                onClick={() => {
                  setEmail("test@dhanvantari.dev");
                  setPassword("test1234");
                  setConfirmPassword("test1234");
                  setError("");
                }}
              >
                🧪 Fill Dummy User
              </button>

              <motion.button
                type="submit"
                disabled={loading}
                className="auth-submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="auth-switch-link">
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
