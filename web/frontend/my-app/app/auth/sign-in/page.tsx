"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, HeartPulse } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] -z-10 opacity-20"
        style={{ background: "var(--teal)" }} />
      <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[50%] rounded-full blur-[100px] -z-10 opacity-15"
        style={{ background: "var(--cyan)" }} />

      {/* EKG Strip */}
      <div className="ekg-strip">
        <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
          <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
        </svg>
      </div>

      {/* Header */}
      <nav className="w-full px-6 py-5 md:px-12 z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-accent)" }}>
              <HeartPulse className="w-6 h-6" style={{ color: "var(--teal)" }} />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--teal)" }}>
              PRĀṆA <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>OS</span>
            </span>
          </Link>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 md:px-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="prana-vessel p-10 md:p-12"
            style={{ borderRadius: "28px" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Welcome Back
              </h1>
              <p className="mb-8" style={{ color: "var(--text-body)" }}>
                Sign in to access your Vedic health dashboard
              </p>
            </motion.div>

            <form onSubmit={handleSignIn} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[16px] p-4"
                  style={{ background: "var(--danger-bg)", border: "1.5px solid var(--danger-border)" }}
                >
                  <p className="text-sm font-medium" style={{ color: "var(--danger-text)" }}>{error}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
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
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
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
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 pt-8"
              style={{ borderTop: "1.5px solid var(--border)" }}
            >
              <p className="text-sm text-center" style={{ color: "var(--text-body)" }}>
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="font-medium hover:underline" style={{ color: "var(--teal)" }}>
                  Sign up here
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
