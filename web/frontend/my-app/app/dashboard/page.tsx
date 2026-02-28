"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import type { AnalysisResult } from "@/app/dynamic/healthEngine";

/* ── Constants ── */
const CIRCUMFERENCE = 534; // 2 * π * 85

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
  // If risk is high, prioritize showing absolute status
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
  
  // Normal range - show trend direction
  if (slope > 0.5) return { icon: "↑", label: "Trending up", tc: "up" };
  if (slope < -0.5) return { icon: "↓", label: "Trending down", tc: "down" };
  return { icon: "✓", label: "Normal", tc: "ok" };
}

/* ── Framer stagger preset ── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
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

  /* ── Derived dashboard values from real data ── */
  const riskCategory = analysis?.overall.riskCategory ?? "—";

  const doshaNote = useMemo(() => {
    if (!profile) return "";
    if (profile.bmi < 18.5) return "Vāta-dominant constitution";
    if (profile.bmi < 25)   return "Balanced Prakriti";
    if (profile.bmi < 30)   return "Kapha-elevated";
    return "Kapha-dominant constitution";
  }, [profile]);

  /* Build metric cards from analysis */
  const metricCards = useMemo(() => {
    if (!analysis) return [];
    const m = analysis.metrics;
    type Card = { icon: string; label: string; value: string; unit: string; badge: string; status: "ok" | "warn"; pbar: number; ref: string; trend: string; tc: string; pbc?: string };
    const cards: Card[] = [];

    if (m.glucose) {
      const t = trendInfo(m.glucose.slope, m.glucose.riskScore);
      cards.push({ icon: "🩸", label: "Blood Sugar", value: m.glucose.mean.toFixed(0), unit: " mg/dL", badge: riskToBadge(m.glucose.riskScore), status: riskToStatus(m.glucose.riskScore), pbar: Math.round((1 - m.glucose.riskScore) * 100), ref: "Normal: 70-140", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    if (m.heart_rate) {
      const t = trendInfo(m.heart_rate.slope, m.heart_rate.riskScore);
      cards.push({ icon: "💓", label: "Heart Rate", value: m.heart_rate.mean.toFixed(0), unit: " bpm", badge: riskToBadge(m.heart_rate.riskScore), status: riskToStatus(m.heart_rate.riskScore), pbar: Math.round((1 - m.heart_rate.riskScore) * 100), ref: "Normal: 60-100", trend: `${t.icon} ${t.label}`, tc: t.tc, pbc: "blue" });
    }
    if (m.spo2) {
      const t = trendInfo(m.spo2.slope, m.spo2.riskScore);
      cards.push({ icon: "🫁", label: "Oxygen Level", value: m.spo2.mean.toFixed(0), unit: "%", badge: riskToBadge(m.spo2.riskScore), status: riskToStatus(m.spo2.riskScore), pbar: Math.round((1 - m.spo2.riskScore) * 100), ref: "Normal: 95-100", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    if (m.blood_pressure) {
      const t = trendInfo(m.blood_pressure.slope, m.blood_pressure.riskScore);
      cards.push({ icon: "🩺", label: "Blood Pressure", value: m.blood_pressure.mean.toFixed(0), unit: " mmHg", badge: riskToBadge(m.blood_pressure.riskScore), status: riskToStatus(m.blood_pressure.riskScore), pbar: Math.round((1 - m.blood_pressure.riskScore) * 100), ref: "Normal: Under 120/80", trend: `${t.icon} ${t.label}`, tc: t.tc });
    }
    return cards;
  }, [analysis]);

  /* Build status pills from analysis */
  const statusPills = useMemo(() => {
    if (!analysis) return [];
    const m = analysis.metrics;
    const pills: { icon: string; text: string; status: string }[] = [];
    if (m.glucose)        pills.push({ icon: "🩸", text: `Sugar ${m.glucose.mean.toFixed(0)}`,      status: riskToStatus(m.glucose.riskScore) });
    if (m.heart_rate)     pills.push({ icon: "💓", text: `Heart ${m.heart_rate.mean.toFixed(0)}`,        status: riskToStatus(m.heart_rate.riskScore) });
    if (m.spo2)           pills.push({ icon: "🫁", text: `Oxygen ${m.spo2.mean.toFixed(0)}%`,          status: riskToStatus(m.spo2.riskScore) });
    if (m.blood_pressure) pills.push({ icon: "🩺", text: `Pressure ${m.blood_pressure.mean.toFixed(0)}`,    status: riskToStatus(m.blood_pressure.riskScore) });
    return pills;
  }, [analysis]);

  /* Build alerts from real analysis + profile */
  const alerts = useMemo(() => {
    const list: { icon: string; status: string; title: string; desc: string; time: string }[] = [];

    if (analysis) {
      const ts = new Date(analysis.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (analysis.overall.overallRisk >= 0.50) {
        const p = analysis.overall.highestRiskParameter.replace(/_/g, " ");
        list.push({ icon: "⚠️", status: "warn", title: `Your ${p.charAt(0).toUpperCase() + p.slice(1)} Needs Attention`, desc: `Your current risk level is ${(analysis.overall.overallRisk * 100).toFixed(0)}%. We recommend consulting with your healthcare provider.`, time: ts });
      }
      for (const [param, data] of Object.entries(analysis.metrics)) {
        if (data.riskScore >= 0.60) {
          const n = param.replace(/_/g, " ");
          list.push({ icon: "🔔", status: "warn", title: `${n.charAt(0).toUpperCase() + n.slice(1)} Is Elevated`, desc: `Your reading is ${data.mean.toFixed(1)} with ${(data.riskScore * 100).toFixed(0)}% risk level. ${data.slope > 0 ? "Trending upward" : "Currently stable"}.`, time: ts });
        }
      }
      if (analysis.overall.riskCategory === "Low") {
        list.push({ icon: "🎉", status: "ok", title: "All Your Health Readings Look Great!", desc: "Your health measurements are all within healthy ranges. Keep up the excellent work!", time: ts });
      }
    }

    if (profile) {
      if (profile.bmi >= 25)
        list.push({ icon: "⚖️", status: "warn", title: `Your BMI is ${profile.bmi.toFixed(1)} - ${profile.bmi >= 30 ? "Obese" : "Overweight"}`, desc: "Consider adopting an Ayurvedic Kapha-balancing diet to support healthy metabolism.", time: "Profile" });
      if (profile.smokingStatus === "current")
        list.push({ icon: "🚬", status: "warn", title: "Current Smoker", desc: "Breathing exercises (Prāṇāyāma) can support your journey to quit smoking.", time: "Profile" });
      if (profile.alcoholUse === "heavy")
        list.push({ icon: "🍷", status: "warn", title: "Heavy Alcohol Consumption", desc: "Reducing alcohol intake gradually can improve your liver and heart health.", time: "Profile" });
    }

    if (list.length === 0)
      list.push({ icon: "📊", status: "ok", title: "Upload Your Health Information", desc: "Go to the Vitals tab to add your health readings and get personalized insights about your wellness.", time: "Now" });

    return list;
  }, [analysis, profile]);

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
              <span style={{ color: "var(--text-muted)", fontSize: "15px", fontWeight: 600 }}>Loading your health data…</span>
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
          <div className="flex items-baseline gap-2">
            <span style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "22px", fontWeight: 700, letterSpacing: "1px",
              background: "linear-gradient(135deg, var(--teal), var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>
              Health
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="live-badge">
              <span className="live-dot" />
              Live
            </div>
            <button onClick={toggle}
              className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              {theme === "dark"
                ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} />
                : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
            <div className="w-8.5 h-8.5 rounded-full overflow-hidden"
              style={{ border: "1.5px solid var(--teal)", boxShadow: "0 0 0 3px rgba(13,229,168,0.12)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.photoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.uid || "dhanvantari"}&backgroundColor=065f46,0e7490&backgroundType=gradientLinear`}
                alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* ── Hero Score Ring ── */}
        <section className="flex flex-col items-center gap-0 py-4 px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="score-ring-container"
          >
            <svg className="score-svg" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0de5a8" />
                  <stop offset="100%" stopColor="#18d8f5" />
                </linearGradient>
              </defs>
              {/* Decorative ticks */}
              <g stroke="rgba(240,248,255,0.08)" strokeWidth="1">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => (
                  <line key={d} x1="100" y1="8" x2="100" y2={d % 90 === 0 ? 16 : 14}
                    transform={`rotate(${d} 100 100)`} />
                ))}
              </g>
              <circle className="score-track" cx="100" cy="100" r="85" />
              <circle className="score-fill" cx="100" cy="100" r="85"
                style={{ animation: "none", strokeDasharray: CIRCUMFERENCE, strokeDashoffset: ringOffset, transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }} />
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(13,229,168,0.08)" strokeWidth="1" strokeDasharray="3 6" />
            </svg>
            <div className="deco-ring" />
            <div className="score-inner">
              <div className="score-number">{vitality ?? "—"}</div>
              <div className="score-label">Vitality</div>
              <div className="score-sub">
                {analysis
                  ? `${riskCategory}${doshaNote ? ` — ${doshaNote}` : ""}`
                  : "Upload vitals to see your score"}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Status Pills ── */}
        <div className="status-row">
          {statusPills.length > 0 ? statusPills.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.32 }}
              className={`status-pill ${p.status}`}>
              <span className="text-xs">{p.icon}</span>{p.text}
            </motion.div>
          )) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="status-pill ok">
              <span className="text-xs">📊</span>No data yet — upload vitals
            </motion.div>
          )}
        </div>

        {/* ── Home Panel Content ── */}
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="px-5 pb-4">

          {/* Section: Your Health Readings */}
          <motion.div variants={stagger.item} className="dash-sec">
            <div className="dash-sec-title">Your <em>Health</em></div>
            <div className="dash-sec-tag">
              {analysis ? new Date(analysis.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}
            </div>
          </motion.div>

          {/* Metric Cards (from real analysis) */}
          {metricCards.length > 0 && (
            <motion.div variants={stagger.item} className="metric-grid">
              {metricCards.map((m, i) => (
                <div key={i} className={`metric-card ${m.status}`}>
                  <div className="mc-head">
                    <div className={`mc-icon ${m.status}`}>{m.icon}</div>
                    <div className={`mc-badge ${m.status}`}>{m.badge}</div>
                  </div>
                  <div className="mc-label">{m.label}</div>
                  <div className="mc-value">{m.value}<span className="mc-unit">{m.unit}</span></div>
                  <div className="prana-pbar" style={{ marginTop: "10px" }}>
                    <div
                      className={`prana-pbar-fill ${m.pbc || m.status}`}
                      style={{ width: `${m.pbar}%`, transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)" }}
                    />
                  </div>
                  <div className="mc-ref">{m.ref}</div>
                  <div className={`mc-trend ${m.tc}`}>{m.trend}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── Profile Summary (from real profile) ── */}
          {profile && (
            <>
              <motion.hr variants={stagger.item} className="prana-hr" />
              <motion.div variants={stagger.item} className="dash-sec">
                <div className="dash-sec-title">Your <em>Profile</em></div>
                <div className="dash-sec-tag">
                  {new Date(profile.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </motion.div>
              <motion.div variants={stagger.item} className="metric-grid">
                <div className="metric-card ok">
                  <div className="mc-head"><div className="mc-icon ok">👤</div><div className="mc-badge ok">{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</div></div>
                  <div className="mc-label">Age</div>
                  <div className="mc-value">{profile.age}<span className="mc-unit"> yrs</span></div>
                </div>
                <div className={`metric-card ${profile.bmi >= 25 ? "warn" : "ok"}`}>
                  <div className="mc-head"><div className={`mc-icon ${profile.bmi >= 25 ? "warn" : "ok"}`}>⚖️</div><div className={`mc-badge ${profile.bmi >= 25 ? "warn" : "ok"}`}>{profile.bmi < 18.5 ? "Underweight" : profile.bmi < 25 ? "Normal" : profile.bmi < 30 ? "Overweight" : "Obese"}</div></div>
                  <div className="mc-label">BMI</div>
                  <div className="mc-value">{profile.bmi.toFixed(1)}<span className="mc-unit"> kg/m²</span></div>
                  <div className="mc-ref">{profile.height} cm · {profile.weight} kg</div>
                </div>
                <div className={`metric-card ${profile.geneticRiskScore > 0 ? "warn" : "ok"}`}>
                  <div className="mc-head"><div className={`mc-icon ${profile.geneticRiskScore > 0 ? "warn" : "ok"}`}>🧬</div><div className={`mc-badge ${profile.geneticRiskScore > 0 ? "warn" : "ok"}`}>{profile.geneticRiskScore > 0 ? "At Risk" : "Low Risk"}</div></div>
                  <div className="mc-label">Genetic Risk</div>
                  <div className="mc-value">{profile.geneticRiskScore > 0 ? "Yes" : "No"}<span className="mc-unit"> family hx</span></div>
                </div>
                <div className="metric-card ok">
                  <div className="mc-head"><div className="mc-icon ok">📐</div><div className="mc-badge ok">Multiplier</div></div>
                  <div className="mc-label">Age Risk</div>
                  <div className="mc-value">{profile.ageRiskMultiplier.toFixed(2)}<span className="mc-unit">×</span></div>
                  <div className="mc-ref">Formula: 1 + Age / 100</div>
                </div>
              </motion.div>
            </>
          )}

          {/* ── Health Overview Chart ── */}
          {analysis && Object.keys(analysis.metrics).length > 0 && (
            <>
              <motion.hr variants={stagger.item} className="prana-hr" />
              <motion.div variants={stagger.item} className="dash-sec">
                <div className="dash-sec-title">Health <em>Overview</em></div>
                <div className="dash-sec-tag">{analysis.overall.parametersCount} readings</div>
              </motion.div>

              <motion.div variants={stagger.item} className="overview-grid">
                {Object.entries(analysis.metrics).map(([param, data]) => {
                  const pct = Math.round(data.riskScore * 100);
                  const status = data.riskScore >= 0.50 ? "warn" : "ok";
                  return (
                    <div key={param} className={`overview-row ${status}`}>
                      <div className="ov-icon">{paramToIcon(param)}</div>
                      <div className="ov-body">
                        <div className="ov-top">
                          <span className="ov-name">{paramToFriendlyName(param)}</span>
                          <span className={`ov-badge ${status}`}>{riskLabel(data.riskScore)}</span>
                        </div>
                        <div className="ov-bar-track">
                          <div className={`ov-bar-fill ${status}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="ov-bottom">
                          <span className="ov-samples">{data.sampleCount} samples</span>
                          <span className="ov-pct">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
              <motion.div variants={stagger.item} className="ov-footer">
                Based on {Object.values(analysis.metrics).reduce((s, m) => s + m.sampleCount, 0)} data points across {analysis.overall.parametersCount} parameters
              </motion.div>
            </>
          )}

          {/* Health Insights */}
          <motion.hr variants={stagger.item} className="prana-hr" />
          <motion.div variants={stagger.item} className="dash-sec">
            <div className="dash-sec-title">Health <em>Insights</em></div>
          </motion.div>

          <motion.div variants={stagger.item} className="flex flex-col gap-2">
            {alerts.map((a, i) => (
              <div key={i} className={`dash-alert ${a.status}`}>
                <span className="text-lg shrink-0 mt-0.5">{a.icon}</span>
                <div>
                  <div className="dash-alert-title">{a.title}</div>
                  <div className="dash-alert-desc">{a.desc}</div>
                  <div className="dash-alert-time">{a.time}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Mantra Banner */}
          <motion.div variants={stagger.item} className="mantra-banner mt-4">
            <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>🕉</span>
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
