"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { ProtectedRoute } from "@/lib/protected-route";
import { Navbar } from "@/lib/navbar";
import { motion } from "framer-motion";
import {
  Zap,
  Activity,
  ShieldCheck,
  HeartPulse,
  ClipboardList,
  ArrowRight,
  Loader2,
  UserCircle,
  Sparkles,
} from "lucide-react";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading, hasProfile } = useProfileData(user?.uid);
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "results">("dashboard");

  // Redirect first-time users to profile setup
  useEffect(() => {
    if (!profileLoading && !hasProfile()) {
      console.log("[Dashboard] First-time user detected, redirecting to profile setup");
      router.push("/dashboard/profile/setup");
    }
  }, [profileLoading, hasProfile, router]);

  const handleTabChange = (tab: "dashboard" | "profile" | "results") => {
    console.log("[Dashboard] Tab changed to:", tab);
    setActiveTab(tab);
    if (tab === "profile") router.push("/dashboard/profile");
    else if (tab === "results") router.push("/dashboard/results");
  };

  // Loading state
  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-transparent has-bottom-nav">
          <GlassmorphicBackground />
          <Navbar activeTab="dashboard" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-text-secondary text-sm">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // First-time user (will redirect, but show nice message meanwhile)
  if (!hasProfile()) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-transparent has-bottom-nav">
          <GlassmorphicBackground />
          <Navbar activeTab="dashboard" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)] px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-accent/30 flex items-center justify-center mx-auto mb-6 border border-primary/20"
              >
                <UserCircle className="w-12 h-12 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Welcome to धन्वंतरी!</h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                Let&apos;s set up your health profile first. This helps us provide personalized health insights and risk assessments.
              </p>
              <button
                onClick={() => router.push("/dashboard/profile/setup")}
                className="btn-primary inline-flex items-center gap-2 group"
              >
                Complete Your Profile
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-transparent has-bottom-nav">
        <GlassmorphicBackground />
        <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="max-w-5xl mx-auto px-6 py-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
            </h1>
            <p className="text-text-secondary text-base">
              Your personalized health monitoring hub
            </p>
          </motion.div>

          {/* Quick Stats Bar */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
            >
              {[
                { label: "BMI", value: profile.bmi?.toFixed(1) ?? "—", color: "text-primary", bgColor: "bg-primary/10" },
                { label: "Age", value: `${profile.age}`, color: "text-secondary", bgColor: "bg-secondary/10" },
                { label: "Genetic Risk", value: profile.geneticRiskScore?.toString() ?? "—", color: "text-status-mod", bgColor: "bg-status-mod/10" },
                { label: "Conditions", value: `${profile.existingConditions?.length ?? 0}`, color: "text-status-high", bgColor: "bg-status-high/10" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="card-hover text-center py-5"
                >
                  <p className="text-xs text-text-secondary mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dynamic Health Monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              onClick={() => router.push("/dynamic")}
              className="card-hover cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[18px] bg-primary/15 flex items-center justify-center mb-5 border border-primary/20 group-hover:scale-105 transition-transform">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Dynamic Health Data</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  Upload your health data files or enter values for real-time analysis with personalized insights.
                </p>
                <span className="inline-flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>

            {/* Risk Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4 }}
              onClick={() => router.push("/dashboard/results")}
              className="card-hover cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-status-low/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[18px] bg-status-low/15 flex items-center justify-center mb-5 border border-status-low/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-status-low" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Risk Assessment</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  AI-powered health risk prediction based on your profile data analyzed by our ML model.
                </p>
                <span className="inline-flex items-center gap-2 text-status-low text-sm font-medium group-hover:gap-3 transition-all">
                  View Results <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>

            {/* Profile Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4 }}
              onClick={() => router.push("/dashboard/profile")}
              className="card-hover cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-status-mod/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[18px] bg-status-mod/15 flex items-center justify-center mb-5 border border-status-mod/20 group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-7 h-7 text-status-mod" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Health Profile</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  View and manage your personal health data, lifestyle information, and medical history.
                </p>
                <span className="inline-flex items-center gap-2 text-status-mod text-sm font-medium group-hover:gap-3 transition-all">
                  View Profile <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>

            {/* NCM Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -4 }}
              onClick={() => router.push("/dashboard/ncm-analysis")}
              className="card-hover cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-[18px] bg-secondary/15 flex items-center justify-center mb-5 border border-secondary/20 group-hover:scale-105 transition-transform">
                  <Activity className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">NCM Analysis</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  Advanced non-communicable disease analysis with comprehensive health metrics.
                </p>
                <span className="inline-flex items-center gap-2 text-secondary text-sm font-medium group-hover:gap-3 transition-all">
                  Start Analysis <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
