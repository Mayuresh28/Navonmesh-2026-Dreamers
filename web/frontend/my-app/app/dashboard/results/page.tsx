"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Brain, RefreshCw, Activity, HeartPulse,
  Sun, Moon, Zap, Shield, TrendingUp, Target, Droplets,
  Wind, Footprints, BedDouble, Waves,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type { NCMResult } from "@/components/dosha/types";

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

interface RiskBreakdown {
  heart: number;
  diabetes: number;
  stroke: number;
  ecg: number;
  eeg: number;
  emg: number;
}

interface DynamicPrediction {
  final_diagnosis: string;
  confidence: number;
  risk_breakdown: RiskBreakdown;
}

interface HealthMetrics {
  mean: number;
  slope: number;
  percentChange: number;
  variance: number;
  instabilityIndex: number;
  riskScore: number;
  sampleCount: number;
}

interface OverallAssessment {
  overallRisk: number;
  overallInstability: number;
  riskCategory: "Low" | "Moderate" | "High" | "Critical";
  parametersCount: number;
  highestRiskParameter: string;
}

interface DynamicAnalysis {
  metrics: Record<string, HealthMetrics>;
  overall: OverallAssessment;
  timestamp: string;
}

interface DynamicResult {
  prediction: DynamicPrediction | null;
  vitals: { BP: number; HeartRate: number; Glucose: number; SpO2: number; Sleep: number; Steps: number };
  analysis: DynamicAnalysis;
  entries_count: number;
}

/* ═══════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════ */

const CIRCUMFERENCE = 2 * Math.PI * 70;

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  },
};

const ACCENT = {
  teal: "#0de5a8", cyan: "#4a9eff", purple: "#a78bfa",
  amber: "#ffb83f", coral: "#ff607a", rose: "#f472b6",
} as const;

const DISEASE_MAP: Record<string, { color: string; icon: string; desc: string }> = {
  "Coronary Heart Disease": { color: ACCENT.coral, icon: "♥", desc: "Heart-related risk detected from cardiac signal patterns and vital signs" },
  "Stroke": { color: ACCENT.purple, icon: "⚡", desc: "Cerebrovascular risk identified — elevated BP or neurological indicators" },
  "Diabetes": { color: ACCENT.amber, icon: "◉", desc: "Metabolic risk — glucose levels and metabolic markers suggest diabetic patterns" },
  "Hypertension": { color: "#ff8c42", icon: "↑", desc: "Persistently elevated blood pressure detected in your vital recordings" },
  "Arrhythmia": { color: ACCENT.rose, icon: "∿", desc: "Irregular heartbeat patterns detected from ECG signal analysis" },
  "Metabolic Syndrome": { color: "#e8a838", icon: "⬡", desc: "Cluster of metabolic risk factors — BP, glucose, and activity combined" },
  "General Neurological Disorder": { color: ACCENT.cyan, icon: "⊛", desc: "Mixed neurological signal patterns detected from EEG/EMG" },
  "Epilepsy": { color: "#c084fc", icon: "⫸", desc: "Epileptiform activity patterns detected in EEG-derived features" },
  "No Significant Disease": { color: ACCENT.teal, icon: "✦", desc: "All models indicate low risk — your vitals are within healthy ranges" },
};

const RISK_MODELS = [
  { key: "heart" as const, label: "Heart Disease", color: ACCENT.coral, icon: HeartPulse },
  { key: "diabetes" as const, label: "Diabetes", color: ACCENT.amber, icon: Droplets },
  { key: "stroke" as const, label: "Stroke", color: ACCENT.purple, icon: Brain },
  { key: "ecg" as const, label: "ECG Signal", color: ACCENT.teal, icon: Activity },
  { key: "eeg" as const, label: "EEG Signal", color: ACCENT.cyan, icon: Waves },
  { key: "emg" as const, label: "EMG Signal", color: ACCENT.rose, icon: Zap },
];

function overallColor(cat: string) {
  if (cat === "Low") return ACCENT.teal;
  if (cat === "Moderate") return ACCENT.amber;
  if (cat === "High") return "#ff8c42";
  return ACCENT.coral;
}

function ncmRiskColor(cat: string) {
  const c = cat.toLowerCase();
  if (c === "low") return ACCENT.teal;
  if (c === "moderate") return ACCENT.amber;
  if (c === "high") return "#ff8c42";
  return ACCENT.coral;
}

/* ═══════════════════════════════════════════════════
   SVG Chart Components
   ═══════════════════════════════════════════════════ */

/* ── Pie Chart (Donut) ── */
function PieChart({ data, size = 180, label }: { data: { name: string; value: number; color: string }[]; size?: number; label?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  let cumAngle = -90;

  const slices = data.map((d) => {
    const pct = d.value / total;
    const startAngle = cumAngle;
    const sweep = pct * 360;
    cumAngle += sweep;
    const endAngle = startAngle + sweep;
    const largeArc = sweep > 180 ? 1 : 0;
    const rad1 = (startAngle * Math.PI) / 180;
    const rad2 = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad1), y1 = cy + r * Math.sin(rad1);
    const x2 = cx + r * Math.cos(rad2), y2 = cy + r * Math.sin(rad2);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...d, pct, path };
  });

  return (
    <div className="res-chart-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <motion.path key={i} d={s.path} fill={s.color} stroke="var(--bg-card)" strokeWidth="2"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px`, filter: `drop-shadow(0 0 6px ${s.color}44)` }} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.48} fill="var(--bg-card)" />
        {label && <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="var(--font-playfair, 'Playfair Display', serif)">{label}</text>}
      </svg>
      <div className="res-chart-legend">
        {slices.map((s, i) => (
          <div key={i} className="res-legend-item">
            <span className="res-legend-dot" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}55` }} />
            <span className="res-legend-label">{s.name}</span>
            <span className="res-legend-val" style={{ color: s.color }}>{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal Bar Chart ── */
function BarChart({ data, title, subtitle }: { data: { name: string; value: number; maxVal: number; color: string; unit?: string }[]; title: string; subtitle: string }) {
  return (
    <div className="res-bar-card">
      <div className="res-bar-header">
        <span className="res-bar-title">{title}</span>
        <span className="res-bar-sub">{subtitle}</span>
      </div>
      {data.map((d, i) => {
        const pct = d.maxVal > 0 ? Math.min((d.value / d.maxVal) * 100, 100) : 0;
        return (
          <div key={i} className="res-bar-row">
            <span className="res-bar-label">{d.name}</span>
            <div className="res-bar-track">
              <motion.div className="res-bar-fill"
                style={{ background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`, boxShadow: `0 0 12px ${d.color}33` }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} />
            </div>
            <span className="res-bar-val" style={{ color: d.color }}>
              {typeof d.value === "number" ? (d.value % 1 === 0 ? d.value : d.value.toFixed(2)) : d.value}
              {d.unit && <small style={{ color: "var(--text-faint)", marginLeft: 2 }}>{d.unit}</small>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Radar / Spider Chart ── */
function RadarChart({ data, size = 200 }: { data: { axis: string; value: number; color: string }[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 28, n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const levels = [0.25, 0.5, 0.75, 1];
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = Math.min(d.value, 1);
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), lx: cx + (r + 16) * Math.cos(angle), ly: cy + (r + 16) * Math.sin(angle), ...d };
  });
  return (
    <div className="res-chart-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {levels.map((l, i) => (
          <polygon key={i} points={Array.from({ length: n }, (_, j) => { const a = j * angleStep - Math.PI / 2; return `${cx + r * l * Math.cos(a)},${cy + r * l * Math.sin(a)}`; }).join(" ")} fill="none" stroke="var(--border)" strokeWidth="0.7" opacity="0.5" />
        ))}
        {data.map((_, i) => { const a = i * angleStep - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />; })}
        <motion.polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} fill={`${ACCENT.teal}18`} stroke={ACCENT.teal} strokeWidth="2"
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px`, filter: `drop-shadow(0 0 8px ${ACCENT.teal}44)` }} />
        {points.map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill={p.color} stroke="var(--bg-card)" strokeWidth="2"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.1, type: "spring" as const, stiffness: 300 }}
            style={{ filter: `drop-shadow(0 0 6px ${p.color}66)` }} />
        ))}
        {points.map((p, i) => <text key={`l${i}`} x={p.lx} y={p.ly + 3} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="600">{p.axis}</text>)}
      </svg>
    </div>
  );
}

/* ── Mini Gauge ── */
function MiniGauge({ value, max, color, label, desc }: { value: number; max: number; color: string; label: string; desc: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <motion.div className="res-mini-gauge" variants={stagger.item}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="5" opacity="0.25" />
        <motion.circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} transform="rotate(-90 40 40)"
          style={{ filter: `drop-shadow(0 0 6px ${color}44)` }} />
        <text x="40" y="38" textAnchor="middle" fill={color} fontSize="14" fontWeight="700" fontFamily="var(--font-playfair, 'Playfair Display', serif)">
          {typeof value === "number" ? (value < 1 ? (value * 100).toFixed(0) + "%" : value.toFixed(1)) : value}
        </text>
        <text x="40" y="50" textAnchor="middle" fill="var(--text-faint)" fontSize="7" fontWeight="600">{label}</text>
      </svg>
      <span className="res-mini-gauge-desc">{desc}</span>
    </motion.div>
  );
}

/* ── Heatmap Grid (risk intensity) ── */
function HeatmapGrid({ data }: { data: { label: string; value: number; color: string; icon: React.ReactNode }[] }) {
  return (
    <div className="res-heatmap-grid">
      {data.map((d, i) => {
        const opacity = Math.max(0.18, Math.min(d.value, 1));
        const hexOp = Math.round(opacity * 255).toString(16).padStart(2, "0");
        return (
          <motion.div key={i} className="res-heatmap-cell"
            style={{ background: `${d.color}${hexOp}`, borderColor: `${d.color}55` }}
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08, type: "spring" as const, stiffness: 250, damping: 20 }}
            whileHover={{ scale: 1.04, boxShadow: `0 4px 20px ${d.color}33` }}>
            <div className="res-heatmap-icon" style={{ color: d.color }}>{d.icon}</div>
            <span className="res-heatmap-val" style={{ color: d.color }}>
              {(d.value * 100).toFixed(1)}%
            </span>
            <span className="res-heatmap-label">{d.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════ */

export default function ResultsPage() {
  const { theme, toggle } = useTheme();

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<"dynamic" | "ncm">("dynamic");

  /* ── Dynamic state ── */
  const [dynResult, setDynResult] = useState<DynamicResult | null>(null);
  const [dynLoading, setDynLoading] = useState(false);
  const [dynError, setDynError] = useState<string | null>(null);

  /* ── NCM state ── */
  const [ncm, setNcm] = useState<NCMResult | null>(null);
  const [ncmLoading, setNcmLoading] = useState(false);
  const [ncmError, setNcmError] = useState<string | null>(null);

  /* ── Fetch Dynamic ── */
  const runDynamic = useCallback(async () => {
    setDynLoading(true); setDynError(null);
    try {
      const res = await fetch("/api/dynamic-predict");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dynamic analysis failed");
      setDynResult(data);
    } catch (err) { setDynError(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setDynLoading(false); }
  }, []);

  /* ── Fetch NCM ── */
  const runNCM = useCallback(async () => {
    setNcmLoading(true); setNcmError(null);
    try {
      const res = await fetch("/api/ncm-analyze");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `NCM analysis failed (${res.status})`);
      setNcm(data);
    } catch (err) { setNcmError(err instanceof Error ? err.message : "NCM analysis failed"); }
    finally { setNcmLoading(false); }
  }, []);

  /* Auto-fetch on tab switch */
  useEffect(() => { if (activeTab === "dynamic" && !dynResult && !dynLoading) runDynamic(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "ncm" && !ncm && !ncmLoading) runNCM(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ═════════ RENDER ═════════ */
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-base)" }}>

        {/* ── EKG Strip ── */}
        <div className="ekg-strip" aria-hidden="true">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* ── Top Bar ── */}
        <header className="prana-topbar">
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)", fontSize: "22px", fontWeight: 700, letterSpacing: "1px", background: "linear-gradient(135deg, var(--teal), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>Results</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={toggle} className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
          </div>
        </header>

        {/* ═══════ TAB SWITCHER ═══════ */}
        <div className="res-tab-bar">
          {(["dynamic", "ncm"] as const).map((tab) => (
            <button key={tab} className={`res-tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "dynamic" ? <><Activity className="w-4 h-4" /> Dynamic</> : <><Brain className="w-4 h-4" /> NCM</>}
              {activeTab === tab && <motion.div className="res-tab-indicator" layoutId="tabIndicator" transition={{ type: "spring" as const, stiffness: 350, damping: 30 }} />}
            </button>
          ))}
        </div>

        {/* ═══════ TAB CONTENT ═══════ */}
        <AnimatePresence mode="wait">

          {/* ──────────────────────────────────────────
              TAB 1: DYNAMIC — Multi-Disease Risk Prediction
              ────────────────────────────────────────── */}
          {activeTab === "dynamic" && (
            <motion.div key="dynamic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <motion.div variants={stagger.container} initial="hidden" animate="show" className="pb-6">

                {/* Error */}
                <AnimatePresence>
                  {dynError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="result-error-box" style={{ margin: "12px 20px" }}>
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--danger-text, #ff607a)" }} />
                      <div className="result-error-body">
                        <div className="result-error-title">Analysis Error</div>
                        <div className="result-error-desc">{dynError}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "6px" }}>
                          Ensure data is uploaded on the <strong>Dynamic</strong> page and ML server is running.
                        </div>
                      </div>
                      <button onClick={runDynamic} className="result-retry-btn"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading */}
                {dynLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4">
                      <Brain className="w-12 h-12" style={{ color: "var(--teal)" }} />
                    </motion.div>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Analyzing Health Data</h3>
                    <p style={{ color: "var(--text-body)", fontSize: "13px" }}>Running 6 ML models + meta fusion…</p>
                  </motion.div>
                )}

                {/* No Data */}
                {!dynResult && !dynLoading && !dynError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-6">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${ACCENT.teal}18`, border: `2px solid ${ACCENT.teal}44` }}>
                        <Activity className="w-10 h-10" style={{ color: ACCENT.teal }} />
                      </div>
                    </motion.div>
                    <div className="text-center">
                      <h3 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>Dynamic Health Analysis</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Upload vitals (BP, HR, Glucose, SpO2, Sleep, Steps) on the Dynamic page first</p>
                    </div>
                    <button onClick={runDynamic} className="result-rerun-btn"><RefreshCw className="w-4 h-4" /> Run Analysis</button>
                  </motion.div>
                )}

                {/* ── Dynamic Results ── */}
                {dynResult && !dynLoading && (() => {
                  const pred = dynResult.prediction;
                  const analysis = dynResult.analysis;
                  const vitals = dynResult.vitals;
                  const dInfo = pred ? (DISEASE_MAP[pred.final_diagnosis] || { color: "var(--text-muted)", icon: "?", desc: "Unknown condition" }) : null;
                  const confPct = pred ? Math.min(pred.confidence, 1) : 0;
                  const oColor = overallColor(analysis.overall.riskCategory);

                  return (
                    <>
                      {/* 1. DIAGNOSIS HERO — highlighted ML prediction */}
                      {pred && dInfo && (
                        <motion.div variants={stagger.item} className="res-diagnosis-card" style={{ borderColor: `${dInfo.color}44` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            {/* Confidence Ring */}
                            <div style={{ position: "relative", width: "100px", height: "100px", flexShrink: 0 }}>
                              <svg width="100" height="100" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="6" opacity="0.25" />
                                <motion.circle cx="50" cy="50" r="40" fill="none" stroke={dInfo.color} strokeWidth="6"
                                  strokeLinecap="round" strokeDasharray={2 * Math.PI * 40}
                                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                  animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - confPct) }}
                                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                                  transform="rotate(-90 50 50)"
                                  style={{ filter: `drop-shadow(0 0 8px ${dInfo.color}55)` }} />
                                <text x="50" y="47" textAnchor="middle" fill={dInfo.color} fontSize="18" fontWeight="700" fontFamily="var(--font-playfair, 'Playfair Display', serif)">
                                  {(confPct * 100).toFixed(0)}%
                                </text>
                                <text x="50" y="60" textAnchor="middle" fill="var(--text-faint)" fontSize="7" fontWeight="600">CONFIDENCE</text>
                              </svg>
                            </div>
                            {/* Disease info */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "4px" }}>AI Diagnosis</div>
                              <div className="res-diagnosis-name" style={{ color: dInfo.color }}>
                                <span style={{ fontSize: "20px", marginRight: "6px" }}>{dInfo.icon}</span>
                                {pred.final_diagnosis}
                              </div>
                              <div className="res-diagnosis-desc">{dInfo.desc}</div>
                            </div>
                          </div>
                          <button onClick={runDynamic} className="result-rerun-btn" style={{ marginTop: "12px" }}><RefreshCw className="w-3.5 h-3.5" /> Re-run Analysis</button>
                        </motion.div>
                      )}

                      {/* 2. RISK HEATMAP — 6 models color-intensity grid */}
                      {pred && (
                        <motion.div variants={stagger.item} className="res-section">
                          <div className="res-section-head">
                            <div className="res-section-title"><Target className="w-4 h-4" style={{ color: ACCENT.coral }} /> Risk Heatmap</div>
                            <div className="res-section-desc">Color intensity shows how likely each condition is — brighter means higher risk</div>
                          </div>
                          <HeatmapGrid data={RISK_MODELS.map((m) => ({
                            label: m.label,
                            value: pred.risk_breakdown[m.key],
                            color: m.color,
                            icon: <m.icon className="w-5 h-5" />,
                          }))} />
                        </motion.div>
                      )}

                      {/* 3. RISK BREAKDOWN PIE — proportional risk distribution */}
                      {pred && (
                        <motion.div variants={stagger.item} className="res-section">
                          <div className="res-section-head">
                            <div className="res-section-title"><Target className="w-4 h-4" style={{ color: ACCENT.purple }} /> Risk Distribution</div>
                            <div className="res-section-desc">Relative share of each model&apos;s risk signal in the overall assessment</div>
                          </div>
                          <PieChart label="Risk" data={RISK_MODELS.map((m) => ({
                            name: m.label,
                            value: pred.risk_breakdown[m.key],
                            color: m.color,
                          }))} />
                        </motion.div>
                      )}

                      {/* 4. MODEL PROBABILITIES BAR — exact numbers */}
                      {pred && (
                        <motion.div variants={stagger.item} className="res-section">
                          <BarChart
                            title="Model Probabilities"
                            subtitle="Exact probability each ML model assigns to detecting its condition"
                            data={RISK_MODELS.map((m) => ({
                              name: m.label,
                              value: +(pred.risk_breakdown[m.key] * 100).toFixed(1),
                              maxVal: 100,
                              color: m.color,
                              unit: "%",
                            }))}
                          />
                        </motion.div>
                      )}

                      {/* 5. VITAL SIGNS — input values used */}
                      <motion.div variants={stagger.item} className="res-section">
                        <div className="res-section-head">
                          <div className="res-section-title"><HeartPulse className="w-4 h-4" style={{ color: ACCENT.cyan }} /> Your Vital Signs</div>
                          <div className="res-section-desc">Averaged measurements from your uploaded data — used as input to all models</div>
                        </div>
                        <div className="res-features-grid">
                          {[
                            { icon: <TrendingUp className="w-5 h-5" />, label: "Blood Pressure", value: vitals.BP.toFixed(1), unit: "mmHg", color: ACCENT.coral, desc: "Systolic average" },
                            { icon: <HeartPulse className="w-5 h-5" />, label: "Heart Rate", value: vitals.HeartRate.toFixed(1), unit: "bpm", color: ACCENT.teal, desc: "Average pulse rate" },
                            { icon: <Droplets className="w-5 h-5" />, label: "Glucose", value: vitals.Glucose.toFixed(1), unit: "mg/dL", color: ACCENT.amber, desc: "Blood sugar level" },
                            { icon: <Wind className="w-5 h-5" />, label: "SpO2", value: vitals.SpO2.toFixed(1), unit: "%", color: ACCENT.cyan, desc: "Blood oxygen saturation" },
                            { icon: <BedDouble className="w-5 h-5" />, label: "Sleep", value: vitals.Sleep.toFixed(1), unit: "hrs", color: ACCENT.purple, desc: "Average nightly sleep" },
                            { icon: <Footprints className="w-5 h-5" />, label: "Steps", value: Math.round(vitals.Steps).toLocaleString(), unit: "", color: ACCENT.rose, desc: "Daily step count" },
                          ].map((f, i) => (
                            <motion.div key={i} className="res-feature-tile" style={{ borderLeftColor: f.color }}
                              whileHover={{ y: -3, scale: 1.02 }} transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}>
                              <div className="res-feature-tile-icon" style={{ color: f.color, background: `${f.color}14` }}>{f.icon}</div>
                              <div className="res-feature-tile-val" style={{ color: f.color }}>{f.value}<small style={{ color: "var(--text-faint)", marginLeft: 3, fontSize: "10px" }}>{f.unit}</small></div>
                              <div className="res-feature-tile-label">{f.label}</div>
                              <div className="res-feature-tile-desc">{f.desc}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* 6. HEALTH ANALYSIS — risk scores from healthEngine per parameter */}
                      {Object.keys(analysis.metrics).length > 0 && (
                        <motion.div variants={stagger.item} className="res-section">
                          <BarChart
                            title="Parameter Risk Scores"
                            subtitle="How each vital contributes to your overall health risk (computed by the analysis engine)"
                            data={Object.entries(analysis.metrics)
                              .filter(([, m]) => m.sampleCount > 0)
                              .sort(([, a], [, b]) => b.riskScore - a.riskScore)
                              .map(([key, m]) => ({
                                name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                                value: +(m.riskScore * 100).toFixed(1),
                                maxVal: 100,
                                color: m.riskScore > 0.6 ? ACCENT.coral : m.riskScore > 0.3 ? ACCENT.amber : ACCENT.teal,
                                unit: "%",
                              }))}
                          />
                        </motion.div>
                      )}

                      {/* 7. OVERALL ASSESSMENT */}
                      <motion.div variants={stagger.item} className="res-section">
                        <div className="res-overall-card" style={{ borderLeftColor: oColor }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ position: "relative", width: "60px", height: "60px", flexShrink: 0 }}>
                              <svg width="60" height="60" viewBox="0 0 60 60">
                                <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border)" strokeWidth="4" opacity="0.25" />
                                <motion.circle cx="30" cy="30" r="24" fill="none" stroke={oColor} strokeWidth="4"
                                  strokeLinecap="round" strokeDasharray={2 * Math.PI * 24}
                                  initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                                  animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - analysis.overall.overallRisk) }}
                                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                  transform="rotate(-90 30 30)"
                                  style={{ filter: `drop-shadow(0 0 6px ${oColor}55)` }} />
                                <text x="30" y="33" textAnchor="middle" fill={oColor} fontSize="12" fontWeight="700">
                                  {(analysis.overall.overallRisk * 100).toFixed(0)}%
                                </text>
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "2px" }}>Overall Risk</div>
                              <div style={{ fontSize: "18px", fontWeight: 700, color: oColor, fontFamily: "var(--font-syne, 'Syne', sans-serif)" }}>
                                {analysis.overall.riskCategory}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                {analysis.overall.parametersCount} parameters analyzed · Highest risk: <strong style={{ color: "var(--text-body)" }}>{analysis.overall.highestRiskParameter.replace(/_/g, " ")}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="res-data-pills" style={{ marginTop: "10px" }}>
                            <div className="res-data-pill" style={{ borderColor: `${oColor}44`, color: oColor }}>
                              <span className="res-data-pill-count">{dynResult.entries_count}</span>
                              <span className="res-data-pill-label">data entries</span>
                            </div>
                            <div className="res-data-pill" style={{ borderColor: `${ACCENT.cyan}44`, color: ACCENT.cyan }}>
                              <span className="res-data-pill-count">{(analysis.overall.overallInstability * 100).toFixed(0)}%</span>
                              <span className="res-data-pill-label">instability</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Disclaimer */}
                      <motion.div variants={stagger.item} className="result-disclaimer" style={{ marginTop: "20px" }}>
                        <strong style={{ color: "var(--text-primary)" }}>Disclaimer:</strong> This assessment uses multi-model AI fusion for informational purposes only. Please consult a healthcare professional for clinical advice.
                      </motion.div>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}

          {/* ──────────────────────────────────────────
              TAB 2: NCM — High-Frequency Biosignal Analysis
              ────────────────────────────────────────── */}
          {activeTab === "ncm" && (
            <motion.div key="ncm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <motion.div variants={stagger.container} initial="hidden" animate="show" className="pb-6">

                {/* Error */}
                <AnimatePresence>
                  {ncmError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="result-error-box" style={{ margin: "12px 20px" }}>
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--danger-text, #ff607a)" }} />
                      <div className="result-error-body">
                        <div className="result-error-title">NCM Analysis Error</div>
                        <div className="result-error-desc">{ncmError}</div>
                      </div>
                      <button onClick={runNCM} className="result-retry-btn"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading */}
                {ncmLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4">
                      <Zap className="w-12 h-12" style={{ color: ACCENT.purple }} />
                    </motion.div>
                    <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Running NCM Analysis</h3>
                    <p style={{ color: "var(--text-body)", fontSize: "13px" }}>Processing high-frequency biosignal data…</p>
                  </motion.div>
                )}

                {/* No Data */}
                {!ncm && !ncmLoading && !ncmError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-6">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${ACCENT.purple}18`, border: `2px solid ${ACCENT.purple}44` }}>
                        <Brain className="w-10 h-10" style={{ color: ACCENT.purple }} />
                      </div>
                    </motion.div>
                    <div className="text-center">
                      <h3 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>Neuro-Cardio-Muscular</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Analyze high-frequency ECG, EEG, and EMG biosignal data</p>
                    </div>
                    <button onClick={runNCM} className="result-rerun-btn" style={{ background: ACCENT.purple, color: "#fff", border: "none" }}>
                      <Zap className="w-4 h-4" /> Run NCM Analysis
                    </button>
                  </motion.div>
                )}

                {/* ── NCM Results ── */}
                {ncm && !ncmLoading && (() => {
                  const ncmColor = ncmRiskColor(ncm.risk_category);
                  const ncmPct = Math.min(ncm.ncm_index / 100, 1);

                  return (
                    <>
                      {/* 1. NCM Index Gauge */}
                      <motion.div variants={stagger.item} className="risk-gauge-wrap">
                        <div className="risk-gauge-container">
                          <svg className="risk-gauge-svg" viewBox="0 0 180 180">
                            <defs>
                              <linearGradient id="ncmGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={ncmColor} />
                                <stop offset="100%" stopColor={ncmColor} stopOpacity={0.5} />
                              </linearGradient>
                            </defs>
                            <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border)" strokeWidth="8" opacity="0.3" />
                            <motion.circle cx="90" cy="90" r="70" fill="none" stroke="url(#ncmGrad)" strokeWidth="8"
                              strokeLinecap="round" strokeDasharray={CIRCUMFERENCE}
                              initial={{ strokeDashoffset: CIRCUMFERENCE }}
                              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - ncmPct) }}
                              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                              transform="rotate(-90 90 90)" />
                          </svg>
                          <div className="risk-gauge-inner">
                            <div className="risk-gauge-class" style={{ color: ncmColor }}>{ncm.ncm_index.toFixed(1)}</div>
                            <div className="risk-gauge-label">NCM Index</div>
                          </div>
                        </div>
                        <div className="risk-gauge-desc">
                          Composite score fusing cardiac, neural, and muscular signals. Category: <strong style={{ color: ncmColor }}>{ncm.risk_category}</strong>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <span className="res-model-badge" style={{ color: ncm.model_source === "ml" ? ACCENT.teal : "var(--text-muted)", borderColor: ncm.model_source === "ml" ? `${ACCENT.teal}44` : "var(--border)" }}>
                            {ncm.model_source === "ml" ? "ML Model" : "Formula-Based"}
                          </span>
                          <button onClick={runNCM} className="result-rerun-btn"><RefreshCw className="w-3.5 h-3.5" /> Re-analyze</button>
                        </div>
                      </motion.div>

                      {/* 2. Radar Chart */}
                      <motion.div variants={stagger.item} className="res-section">
                        <div className="res-section-head">
                          <div className="res-section-title"><TrendingUp className="w-4 h-4" style={{ color: ACCENT.teal }} /> Signal Health Radar</div>
                          <div className="res-section-desc">Relative risk contribution from each biosignal system — lower is healthier</div>
                        </div>
                        <RadarChart data={[
                          { axis: "Cardiac", value: ncm.predictions.cardiac.probability, color: ACCENT.coral },
                          { axis: "Neural", value: ncm.predictions.stress.probability, color: ACCENT.purple },
                          { axis: "Muscular", value: ncm.predictions.muscle.probability, color: ACCENT.amber },
                        ]} />
                      </motion.div>

                      {/* 3. Mini Gauges */}
                      <motion.div variants={stagger.item} className="res-section">
                        <div className="res-section-head">
                          <div className="res-section-title"><Activity className="w-4 h-4" style={{ color: ACCENT.coral }} /> Signal Risk Scores</div>
                          <div className="res-section-desc">Individual probability of risk from each biosignal analysis</div>
                        </div>
                        <div className="res-gauges-row">
                          <MiniGauge value={ncm.predictions.cardiac.probability} max={1} color={ACCENT.coral} label="Cardiac" desc={ncm.predictions.cardiac.state} />
                          <MiniGauge value={ncm.predictions.stress.probability} max={1} color={ACCENT.purple} label="Neural" desc={ncm.predictions.stress.state} />
                          <MiniGauge value={ncm.predictions.muscle.probability} max={1} color={ACCENT.amber} label="Muscle" desc={ncm.predictions.muscle.state} />
                        </div>
                      </motion.div>

                      {/* 4. Pie Chart — NCM Composition */}
                      <motion.div variants={stagger.item} className="res-section">
                        <div className="res-section-head">
                          <div className="res-section-title"><Target className="w-4 h-4" style={{ color: ACCENT.purple }} /> NCM Composition</div>
                          <div className="res-section-desc">Weighted contribution of cardiac (40%), neural (35%), and muscular (25%) to overall score</div>
                        </div>
                        <PieChart label="NCM" data={[
                          { name: "Cardiac (40%)", value: ncm.predictions.cardiac.probability * 40, color: ACCENT.coral },
                          { name: "Neural (35%)", value: ncm.predictions.stress.probability * 35, color: ACCENT.purple },
                          { name: "Muscular (25%)", value: ncm.predictions.muscle.probability * 25, color: ACCENT.amber },
                        ]} />
                      </motion.div>

                      {/* 5. Raw Features Bar */}
                      <motion.div variants={stagger.item} className="res-section">
                        <BarChart title="Biosignal Measurements" subtitle="Raw physiological values extracted from your ECG, EEG, and EMG data"
                          data={[
                            { name: "Heart Rate", value: ncm.features.heart_rate, maxVal: 200, color: ACCENT.coral, unit: "bpm" },
                            { name: "HRV (SDNN)", value: ncm.features.hrv_sdnn, maxVal: 150, color: ACCENT.teal, unit: "ms" },
                            { name: "Stress Ratio", value: ncm.features.stress_ratio, maxVal: 5, color: ACCENT.purple, unit: "β/α" },
                            { name: "EMG RMS", value: ncm.features.emg_rms, maxVal: 2, color: ACCENT.amber, unit: "mV" },
                          ]} />
                      </motion.div>

                      {/* 6. Systemic Banner */}
                      <motion.div variants={stagger.item} className="res-section">
                        <div className="res-systemic-card" style={{ borderLeftColor: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral }}>
                          <div className="res-systemic-flag">
                            <Shield className="w-5 h-5" style={{ color: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral }} />
                            <span style={{ color: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral }}>{ncm.systemic_flag}</span>
                          </div>
                          <div className="res-systemic-desc">
                            {ncm.systemic_flag === "Stable"
                              ? "No cross-system risk patterns detected — your biosignals are within safe ranges"
                              : "Cross-system risk pattern detected — multiple biosignal systems show elevated stress"}
                          </div>
                        </div>
                      </motion.div>

                      {/* 7. Data Summary */}
                      {ncm.data_summary && (
                        <motion.div variants={stagger.item} className="res-section">
                          <div className="res-section-head">
                            <div className="res-section-title">Data Summary</div>
                            <div className="res-section-desc">Volume of biosignal samples used in this analysis</div>
                          </div>
                          <div className="res-data-pills">
                            {[
                              { label: "ECG", count: ncm.data_summary.ecg_samples, color: ACCENT.coral },
                              { label: "EEG", count: ncm.data_summary.eeg_samples, color: ACCENT.purple },
                              { label: "EMG", count: ncm.data_summary.emg_samples, color: ACCENT.amber },
                              { label: "HR", count: ncm.data_summary.heart_rate_samples, color: ACCENT.teal },
                            ].map((d, i) => (
                              <motion.div key={i} className="res-data-pill" style={{ borderColor: `${d.color}44`, color: d.color }}
                                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.08, type: "spring" as const, stiffness: 200 }}>
                                <span className="res-data-pill-count">{d.count.toLocaleString()}</span>
                                <span className="res-data-pill-label">{d.label} samples</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Disclaimer */}
                      <motion.div variants={stagger.item} className="result-disclaimer" style={{ marginTop: "20px" }}>
                        <strong style={{ color: "var(--text-primary)" }}>Disclaimer:</strong> NCM analysis is for informational purposes only. Consult a healthcare professional for clinical diagnosis.
                      </motion.div>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mantra Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mantra-banner" style={{ margin: "12px 20px 0" }}>
          <span className="mantra-symbol">ॐ</span>
          <div className="mantra-text">&ldquo;Āyurvedaḥ amṛtānāṃ&rdquo;</div>
          <div className="mantra-trans-text">Ayurveda is the science of longevity</div>
          <div className="mantra-src-text">— Charaka Saṃhitā</div>
        </motion.div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
