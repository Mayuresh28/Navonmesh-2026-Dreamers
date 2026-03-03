"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion } from "framer-motion";
import { Sun, Moon, AlertTriangle, CheckCircle, ShieldCheck, Activity, Heart, Brain, Zap, TrendingUp } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { profileToModelInput, type PredictionResult } from "@/components/predict/types";
import type { AnalysisResult } from "@/app/dynamic/healthEngine";

/* ── Constants ── */
const CIRCUMFERENCE = 440; // 2 * π * 70

/* ── Helpers ── */
function paramToFriendlyName(param: string): string {
  const names: Record<string, string> = {
    glucose: "Blood Sugar",
    heart_rate: "Heart Rate",
    spo2: "Oxygen Level",
    blood_pressure: "Blood Pressure",
    eeg: "Brain Activity",
    ecg: "Heart Rhythm",
    emg: "Muscle Activity",
    temperature: "Body Temperature",
    respiratory_rate: "Breathing Rate",
    sleep: "Sleep Quality",
    steps: "Daily Steps",
  };
  return names[param] || param.charAt(0).toUpperCase() + param.slice(1).replace(/_/g, " ");
}

function paramToIcon(param: string): string {
  const icons: Record<string, string> = {
    glucose: "🩸", heart_rate: "💓", spo2: "🫁", blood_pressure: "🩺",
    eeg: "🧠", ecg: "💗", emg: "💪", temperature: "🌡️",
    respiratory_rate: "🌬️", sleep: "😴", steps: "🚶",
  };
  return icons[param] || "📊";
}

function riskLabel(score: number): string {
  if (score < 0.15) return "Excellent";
  if (score < 0.35) return "Good";
  if (score < 0.50) return "Moderate";
  if (score < 0.65) return "Elevated";
  return "High";
}

function riskToStatus(risk: number): "ok" | "warn" {
  return risk < 0.50 ? "ok" : "warn";
}
function riskToBadge(risk: number): string {
  if (risk < 0.15) return "Excellent";
  if (risk < 0.35) return "Normal";
  if (risk < 0.60) return "Elevated";
  return "High";
}
function trendInfo(slope: number, riskScore: number): { icon: string; label: string; tc: string } {
  if (riskScore >= 0.60) {
    if (slope > 0.5) return { icon: "↑", label: "Rising (High)", tc: "up" };
    if (slope < -0.5) return { icon: "↓", label: "Improving", tc: "down" };
    return { icon: "⚠", label: "High", tc: "warn" };
  }
  if (riskScore >= 0.35) {
    if (slope > 0.5) return { icon: "↑", label: "Rising", tc: "up" };
    if (slope < -0.5) return { icon: "↓", label: "Improving", tc: "down" };
    return { icon: "⚠", label: "Elevated", tc: "warn" };
  }
  if (slope > 0.5) return { icon: "↑", label: "Trending up", tc: "up" };
  if (slope < -0.5) return { icon: "↓", label: "Trending down", tc: "down" };
  return { icon: "✓", label: "Normal", tc: "ok" };
}

/* ── Prediction severity helpers ── */
function severityLevel(cls: string): { label: string; color: string; bg: string; border: string } {
  const c = cls.toLowerCase();
  if (c === "low") return { label: "Low Severity", color: "var(--ok-text)", bg: "var(--ok-bg)", border: "var(--ok-border)" };
  if (c === "high") return { label: "High Severity", color: "var(--danger-text)", bg: "var(--danger-bg)", border: "var(--danger-border)" };
  return { label: "Moderate Severity", color: "var(--warn-text)", bg: "var(--warn-bg)", border: "var(--warn-border)" };
}

/* ── Framer stagger preset ── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  },
};

/* ─────────────────── Page ─────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfileData(user?.uid);

  /* ── Fetch latest health-analysis from MongoDB ── */
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health-analyze");
        if (res.ok) setAnalysis(await res.json());
      } catch (e) {
        console.error("Failed to fetch analysis:", e);
      } finally {
        setAnalysisLoading(false);
      }
    })();
  }, []);

  /* ── Fetch disease prediction ── */
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileToModelInput(profile)),
        });
        if (res.ok) setPrediction(await res.json());
      } catch (e) {
        console.error("Prediction failed:", e);
      }
    })();
  }, [profile]);

  /* ── Animated score ring offset ── */
  const vitality = useMemo(() => {
    if (!analysis) return null;
    return Math.round((1 - analysis.overall.overallRisk) * 100);
  }, [analysis]);

  const [ringOffset, setRingOffset] = useState(CIRCUMFERENCE);
  useEffect(() => {
    if (vitality !== null) {
      const t = setTimeout(() => setRingOffset(CIRCUMFERENCE * (1 - vitality / 100)), 120);
      return () => clearTimeout(t);
    }
  }, [vitality]);

  /* ── Derived values ── */
  const riskCategory = analysis?.overall.riskCategory ?? "—";

  const doshaNote = useMemo(() => {
    if (!profile) return "";
    if (profile.bmi < 18.5) return "Vāta-dominant";
    if (profile.bmi < 25)   return "Balanced Prakriti";
    if (profile.bmi < 30)   return "Kapha-elevated";
    return "Kapha-dominant";
  }, [profile]);

  /* Build metric items from analysis */
  const vitalItems = useMemo(() => {
    if (!analysis) return [];
    const m = analysis.metrics;
    type Item = { icon: string; label: string; value: string; unit: string; badge: string; status: "ok" | "warn"; riskPct: number; ref: string; trend: string; tc: string };
    const items: Item[] = [];

    if (m.glucose) {
      const t = trendInfo(m.glucose.slope, m.glucose.riskScore);
      items.push({ icon: "🩸", label: "Blood Sugar", value: m.glucose.mean.toFixed(0), unit: "mg/dL", badge: riskToBadge(m.glucose.riskScore), status: riskToStatus(m.glucose.riskScore), riskPct: Math.round(m.glucose.riskScore * 100), ref: "70–140 mg/dL", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    if (m.heart_rate) {
      const t = trendInfo(m.heart_rate.slope, m.heart_rate.riskScore);
      items.push({ icon: "💓", label: "Heart Rate", value: m.heart_rate.mean.toFixed(0), unit: "bpm", badge: riskToBadge(m.heart_rate.riskScore), status: riskToStatus(m.heart_rate.riskScore), riskPct: Math.round(m.heart_rate.riskScore * 100), ref: "60–100 bpm", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    if (m.spo2) {
      const t = trendInfo(m.spo2.slope, m.spo2.riskScore);
      items.push({ icon: "🫁", label: "Oxygen", value: m.spo2.mean.toFixed(0), unit: "%", badge: riskToBadge(m.spo2.riskScore), status: riskToStatus(m.spo2.riskScore), riskPct: Math.round(m.spo2.riskScore * 100), ref: "95–100%", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    if (m.blood_pressure) {
      const t = trendInfo(m.blood_pressure.slope, m.blood_pressure.riskScore);
      items.push({ icon: "🩺", label: "Blood Pressure", value: m.blood_pressure.mean.toFixed(0), unit: "mmHg", badge: riskToBadge(m.blood_pressure.riskScore), status: riskToStatus(m.blood_pressure.riskScore), riskPct: Math.round(m.blood_pressure.riskScore * 100), ref: "<120/80", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    return items;
  }, [analysis]);

  /* Build alerts from real analysis + profile */
  const alerts = useMemo(() => {
    const list: { icon: string; status: string; title: string; desc: string }[] = [];

    if (analysis) {
      if (analysis.overall.overallRisk >= 0.50) {
        const p = analysis.overall.highestRiskParameter.replace(/_/g, " ");
        list.push({ icon: "⚠️", status: "warn", title: `${p.charAt(0).toUpperCase() + p.slice(1)} needs attention`, desc: `Risk level at ${(analysis.overall.overallRisk * 100).toFixed(0)}%. Consult your healthcare provider.` });
      }
      for (const [param, data] of Object.entries(analysis.metrics)) {
        if (data.riskScore >= 0.60) {
          const n = param.replace(/_/g, " ");
          list.push({ icon: "🔔", status: "warn", title: `${n.charAt(0).toUpperCase() + n.slice(1)} is elevated`, desc: `Reading: ${data.mean.toFixed(1)} — ${(data.riskScore * 100).toFixed(0)}% risk. ${data.slope > 0 ? "Trending upward." : "Currently stable."}` });
        }
      }
      if (analysis.overall.riskCategory === "Low") {
        list.push({ icon: "🎉", status: "ok", title: "All readings look great!", desc: "Your vitals are within healthy ranges. Keep it up!" });
      }
    }

    if (profile) {
      if (profile.bmi >= 25)
        list.push({ icon: "⚖️", status: "warn", title: `BMI ${profile.bmi.toFixed(1)} — ${profile.bmi >= 30 ? "Obese" : "Overweight"}`, desc: "Consider an Ayurvedic Kapha-balancing diet." });
    }

    if (list.length === 0)
      list.push({ icon: "📊", status: "ok", title: "Upload your vitals", desc: "Go to the Vitals tab to get personalized insights." });

    return list;
  }, [analysis, profile]);

  /* ── Sorted probabilities for prediction ── */
  const sortedProbs = useMemo(() => {
    if (!prediction) return [];
    return Object.entries(prediction.probabilities).sort(([, a], [, b]) => b - a);
  }, [prediction]);

  const isLoading = profileLoading || analysisLoading;

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-base)" }}>

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--teal)" }} />
              <span style={{ color: "var(--text-muted)", fontSize: "16px", fontWeight: 600 }}>Loading your health data…</span>
            </div>
          </div>
        )}

        {/* ── EKG Header Strip ── */}
        <div className="ekg-strip" aria-hidden="true">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* ── Top Bar ── */}
        <header className="prana-topbar">
          <div className="flex items-center gap-2">
            <img src="/imgs/logo.png" alt="" width={28} height={28} className="prana-logo" />
            <span style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "22px", fontWeight: 700, letterSpacing: "1px",
              background: "linear-gradient(135deg, var(--teal), var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "9px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>
              Health
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={toggle}
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              {theme === "dark"
                ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} />
                : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
            <button onClick={() => router.push("/dashboard/profile")}
              className="w-8.5 h-8.5 rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-105"
              style={{ border: "1.5px solid var(--teal)", boxShadow: "0 0 0 3px rgba(13,229,168,0.12)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.photoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.uid || "dhanvantari"}&backgroundColor=065f46,0e7490&backgroundType=gradientLinear`}
                alt="Profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <motion.div
          variants={stagger.container} initial="hidden" animate="show"
          className="max-w-xl mx-auto px-6 sm:px-8 pb-6 space-y-6"
        >

          {/* ────── 1. VITALITY SCORE (compact) ────── */}
          <motion.div variants={stagger.item} className="flex flex-col items-center pt-4">
            <div className="relative" style={{ width: 160, height: 160 }}>
              <svg viewBox="0 0 160 160" width="160" height="160">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0de5a8" />
                    <stop offset="100%" stopColor="#18d8f5" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-strong)" strokeWidth="8" />
                <circle cx="80" cy="80" r="70" fill="none"
                  stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                  fontSize: "48px", fontWeight: 700, lineHeight: 1,
                  background: "linear-gradient(160deg, var(--text-primary) 40%, var(--teal))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{vitality ?? "—"}</span>
                <span style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "var(--teal)", fontWeight: 700, marginTop: 2 }}>Vitality</span>
              </div>
            </div>
            <p style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "14px", fontStyle: "italic", color: "var(--text-muted)", marginTop: 8, textAlign: "center",
            }}>
              {analysis ? `${riskCategory}${doshaNote ? ` — ${doshaNote}` : ""}` : "Upload vitals to see your score"}
            </p>
          </motion.div>

          {/* ────── 2. DISEASE PREDICTION INSIGHTS ────── */}
          {prediction && (
            <motion.section variants={stagger.item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--teal-bg)", border: "1px solid var(--border-accent)" }}>
                  <Activity className="w-5 h-5" style={{ color: "var(--teal)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                    Disease <em style={{ color: "var(--teal)", fontStyle: "italic" }}>Insights</em>
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>AI-powered risk prediction</p>
                </div>
              </div>

              {/* Main prediction card */}
              {(() => {
                const sev = severityLevel(prediction.predicted_class);
                const topProb = sortedProbs[0]?.[1] ?? 0;
                return (
                  <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--bg-card)", border: `1.5px solid ${sev.border}`, boxShadow: "var(--card-shadow)" }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: sev.bg, border: `1.5px solid ${sev.border}` }}>
                        {prediction.predicted_class.toLowerCase() === "low" ? (
                          <CheckCircle className="w-7 h-7" style={{ color: sev.color }} />
                        ) : prediction.predicted_class.toLowerCase() === "high" ? (
                          <AlertTriangle className="w-7 h-7" style={{ color: sev.color }} />
                        ) : (
                          <ShieldCheck className="w-7 h-7" style={{ color: sev.color }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div style={{ fontSize: "28px", fontWeight: 700, color: sev.color, fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                          {prediction.predicted_class} Risk
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
                          {sev.label} — {topProb.toFixed(1)}% probability
                        </div>
                      </div>
                    </div>

                    {/* Mini probability breakdown */}
                    <div className="space-y-3">
                      {sortedProbs.map(([label, pct], idx) => {
                        const isMax = label === prediction.predicted_class;
                        return (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span style={{ fontSize: "14px", fontWeight: isMax ? 700 : 500, color: isMax ? sev.color : "var(--text-primary)" }}>
                                {isMax && <span className="inline-block w-2 h-2 rounded-full mr-2" style={{
                                  background: sev.color,
                                  animation: "pulse 2s infinite",
                                }} />}
                                {label}
                              </span>
                              <span style={{ fontSize: "16px", fontWeight: 700, color: isMax ? sev.color : "var(--text-muted)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{
                                  background: isMax
                                    ? `linear-gradient(90deg, ${sev.color}, ${sev.color}cc)`
                                    : "var(--border-strong)",
                                  opacity: isMax ? 1 : 0.5,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Feature summary row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Heart className="w-4 h-4" />, label: "BMI", val: prediction.input_features.BMI.toFixed(1) },
                  { icon: <Brain className="w-4 h-4" />, label: "Genetic Risk", val: prediction.input_features.Genetic_Risk.toFixed(2) },
                  { icon: <Zap className="w-4 h-4" />, label: "Age Risk", val: prediction.input_features.Age_Risk_Multiplier.toFixed(2) + "×" },
                  { icon: <TrendingUp className="w-4 h-4" />, label: "Baseline", val: prediction.input_features.Baseline_Risk.toFixed(3) },
                ].map((f, i) => (
                  <div key={i} className="rounded-xl p-3.5 flex items-center gap-3"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--teal-bg)", color: "var(--teal)" }}>
                      {f.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>{f.label}</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>{f.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ────── 3. VITALS — BAR CHART ────── */}
          {vitalItems.length > 0 && (
            <motion.section variants={stagger.item}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                  Your <em style={{ color: "var(--teal)", fontStyle: "italic" }}>Vitals</em>
                </h2>
                <span style={{ fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontWeight: 600 }}>
                  {analysis ? new Date(analysis.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}
                </span>
              </div>

              {/* Horizontal bar chart */}
              <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-strong)", boxShadow: "var(--card-shadow)" }}>
                <div className="space-y-5">
                  {vitalItems.map((v, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: "22px" }}>{v.icon}</span>
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{v.label}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-faint)" }}>{v.ref}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{
                            fontSize: "24px", fontWeight: 700, color: "var(--text-primary)",
                            fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                          }}>
                            {v.value}
                            <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "3px" }}>{v.unit}</span>
                          </div>
                        </div>
                      </div>
                      {/* Bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${v.riskPct}%` }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                              background: v.status === "ok"
                                ? "linear-gradient(90deg, #09b885, #0de5a8, #18d8f5)"
                                : "linear-gradient(90deg, #d4820a, #ffb83f, #ffe08a)",
                              boxShadow: v.status === "ok"
                                ? "0 0 8px rgba(13,229,168,0.3)"
                                : "0 0 8px rgba(255,184,63,0.3)",
                            }}
                          />
                        </div>
                        <span style={{
                          fontSize: "13px", fontWeight: 700, minWidth: "38px", textAlign: "right",
                          color: v.status === "ok" ? "var(--ok-text)" : "var(--warn-text)",
                        }}>{v.riskPct}%</span>
                      </div>
                      {/* Trend */}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-xs font-semibold`}
                          style={{ color: v.status === "ok" ? "var(--ok-text)" : "var(--warn-text)" }}>
                          {v.badge}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                          {v.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* ────── 4. PROFILE SUMMARY ────── */}
          {profile && (
            <motion.section variants={stagger.item}>
              <h2 className="mb-4" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                Your <em style={{ color: "var(--teal)", fontStyle: "italic" }}>Profile</em>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "👤", label: "Age", value: `${profile.age}`, unit: "yrs", badge: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1), status: "ok" as const },
                  { icon: "⚖️", label: "BMI", value: profile.bmi.toFixed(1), unit: "kg/m²", badge: profile.bmi < 18.5 ? "Underweight" : profile.bmi < 25 ? "Normal" : profile.bmi < 30 ? "Overweight" : "Obese", status: (profile.bmi >= 25 ? "warn" : "ok") as "ok" | "warn" },
                  { icon: "🧬", label: "Genetic Risk", value: profile.geneticRiskScore > 0 ? "Yes" : "No", unit: "", badge: profile.geneticRiskScore > 0 ? "At Risk" : "Low Risk", status: (profile.geneticRiskScore > 0 ? "warn" : "ok") as "ok" | "warn" },
                  { icon: "📐", label: "Age Risk", value: profile.ageRiskMultiplier.toFixed(2), unit: "×", badge: "Multiplier", status: "ok" as const },
                ].map((c, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{
                    background: "var(--bg-card)",
                    border: `1.5px solid ${c.status === "warn" ? "var(--warn-border)" : "var(--ok-border)"}`,
                    boxShadow: "var(--card-shadow)",
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: "20px" }}>{c.icon}</span>
                      <span style={{
                        fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700,
                        padding: "3px 8px", borderRadius: "8px",
                        color: c.status === "warn" ? "var(--warn-text)" : "var(--ok-text)",
                        background: c.status === "warn" ? "var(--warn-bg)" : "var(--ok-bg)",
                        border: `1px solid ${c.status === "warn" ? "var(--warn-border)" : "var(--ok-border)"}`,
                      }}>{c.badge}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-faint)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>{c.label}</div>
                    <div style={{
                      fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1,
                      fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
                    }}>
                      {c.value}
                      {c.unit && <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "3px" }}>{c.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ────── 5. HEALTH OVERVIEW CHART ────── */}
          {analysis && Object.keys(analysis.metrics).length > 0 && (
            <motion.section variants={stagger.item}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                  Risk <em style={{ color: "var(--teal)", fontStyle: "italic" }}>Chart</em>
                </h2>
                <span style={{ fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
                  {analysis.overall.parametersCount} parameters
                </span>
              </div>

              {/* SVG Bar Chart */}
              <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-strong)", boxShadow: "var(--card-shadow)" }}>
                {(() => {
                  const entries = Object.entries(analysis.metrics);
                  const barH = 32;
                  const gap = 14;
                  const chartH = entries.length * (barH + gap) - gap + 20;
                  const labelW = 100;
                  const chartW = 300;
                  return (
                    <svg viewBox={`0 0 ${labelW + chartW + 60} ${chartH}`} className="w-full" style={{ overflow: "visible" }}>
                      {entries.map(([param, data], i) => {
                        const pct = Math.round(data.riskScore * 100);
                        const y = i * (barH + gap) + 10;
                        const isWarn = data.riskScore >= 0.50;
                        return (
                          <g key={param}>
                            {/* Label */}
                            <text x="0" y={y + barH / 2 + 5}
                              style={{ fontSize: "13px", fontWeight: 600, fill: "var(--text-primary)" }}>
                              {paramToIcon(param)} {paramToFriendlyName(param)}
                            </text>
                            {/* Track */}
                            <rect x={labelW + 10} y={y} width={chartW} height={barH} rx="8"
                              style={{ fill: "var(--border)" }} />
                            {/* Fill */}
                            <motion.rect
                              x={labelW + 10} y={y} height={barH} rx="8"
                              initial={{ width: 0 }}
                              animate={{ width: chartW * (pct / 100) }}
                              transition={{ duration: 1.2, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                              style={{
                                fill: isWarn
                                  ? "url(#warnGrad)"
                                  : "url(#okGrad)",
                              }}
                            />
                            {/* Percentage */}
                            <text x={labelW + chartW + 18} y={y + barH / 2 + 5}
                              style={{ fontSize: "14px", fontWeight: 700, fill: isWarn ? "var(--warn-text)" : "var(--ok-text)" }}>
                              {pct}%
                            </text>
                          </g>
                        );
                      })}
                      <defs>
                        <linearGradient id="okGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#09b885" />
                          <stop offset="100%" stopColor="#18d8f5" />
                        </linearGradient>
                        <linearGradient id="warnGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#d4820a" />
                          <stop offset="100%" stopColor="#ffb83f" />
                        </linearGradient>
                      </defs>
                    </svg>
                  );
                })()}
                <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", marginTop: "12px", fontWeight: 500 }}>
                  Based on {Object.values(analysis.metrics).reduce((s, m) => s + m.sampleCount, 0)} data points across {analysis.overall.parametersCount} parameters
                </div>
              </div>
            </motion.section>
          )}

          {/* ────── 6. HEALTH INSIGHTS ────── */}
          <motion.section variants={stagger.item}>
            <h2 className="mb-4" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
              Health <em style={{ color: "var(--teal)", fontStyle: "italic" }}>Insights</em>
            </h2>
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className="flex gap-4 items-start rounded-2xl p-4" style={{
                  background: a.status === "warn" ? "var(--warn-bg)" : "var(--ok-bg)",
                  border: `1.5px solid ${a.status === "warn" ? "var(--warn-border)" : "var(--ok-border)"}`,
                }}>
                  <span style={{ fontSize: "22px", flexShrink: 0, marginTop: "2px" }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{a.title}</div>
                    <div style={{ fontSize: "14px", color: "var(--text-body)", lineHeight: 1.6, marginTop: "4px" }}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ────── 7. MANTRA BANNER ────── */}
          <motion.div variants={stagger.item} className="mantra-banner">
            <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🕉</span>
            <div className="mantra-text">
              &ldquo;Sarve bhavantu sukhinaḥ, sarve santu nirāmayāḥ&rdquo;
            </div>
            <div className="mantra-trans-text">
              May all beings be happy, may all beings be free from illness
            </div>
            <div className="mantra-src-text">
              — Bṛhadāraṇyaka Upaniṣad
            </div>
          </motion.div>

        </motion.div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
