"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                // Navigate or show success
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                // Navigate or show success
            }
            router.push("/dashboard"); // Redirect to a placeholder dashboard page after login/register
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-light)] flex items-center justify-center p-6 selection:bg-[var(--color-accent-blue)]">
            {/* Background Soft Gradients */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#E3EAF5] opacity-60 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[var(--color-accent-blue)] opacity-30 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.04)] border border-[var(--color-border-light)] p-8 relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <Link href="/">
                        <div className="bg-[var(--color-bg-light)] p-3 rounded-full mb-4 cursor-pointer hover:scale-105 transition-transform">
                            <ShieldCheck className="w-8 h-8 text-[var(--color-primary-blue)]" />
                        </div>
                    </Link>
                    <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {isLogin ? "Sign in to access your health dashboard" : "Join धन्वंतरी for proactive health monitoring"}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-start gap-2 text-[var(--color-risk-high)] bg-[#FFF5F5] p-3 rounded-xl text-sm mb-6 border border-[#FFE0E0]"
                    >
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-[13px] font-medium text-[var(--color-text-primary)] ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-light)] rounded-[16px] pl-10 pr-4 py-3 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary-blue)] focus:ring-4 focus:ring-[var(--color-accent-blue)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[13px] font-medium text-[var(--color-text-primary)] ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)] pointer-events-none" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[var(--color-bg-light)] border border-[var(--color-border-light)] rounded-[16px] pl-10 pr-4 py-3 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary-blue)] focus:ring-4 focus:ring-[var(--color-accent-blue)] transition-all"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full bg-[var(--color-primary-blue)] text-white font-medium py-3.5 rounded-[16px] flex items-center justify-center gap-2 mt-4 hover:bg-[var(--color-secondary-blue)] shadow-[0px_6px_20px_rgba(126,166,247,0.2)] transition-colors disabled:opacity-70"
                        type="submit"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isLogin ? (
                            <>Sign In <LogIn className="w-4 h-4 ml-1" /></>
                        ) : (
                            <>Create Account <UserPlus className="w-4 h-4 ml-1" /></>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 text-center border-t border-[var(--color-border-light)] pt-6">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 font-medium text-[var(--color-primary-blue)] hover:text-[var(--color-secondary-blue)] transition-colors"
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
