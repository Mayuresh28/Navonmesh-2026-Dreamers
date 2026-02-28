"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Brain, RefreshCw, Activity, HeartPulse,
  Sun, Moon, Zap, Shield, Droplets, Wind, Footprints,
  BedDouble, Waves, ArrowRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type { NCMResult } from "@/components/dosha/types";

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

interface RiskBreakdown {
  heart: number; diabetes: number; stroke: number;
  ecg: number; eeg: number; emg: number;
}

interface DynamicPrediction {
  final_diagnosis: string; confidence: number; risk_breakdown: RiskBreakdown;
}

interface HealthMetrics {
  mean: number; slope: number; percentChange: number; variance: number;
  instabilityIndex: number; riskScore: number; sampleCount: number;
}

interface OverallAssessment {
  overallRisk: number; overallInstability: number;
  riskCategory: "Low" | "Moderate" | "High" | "Critical";
  parametersCount: number; highestRiskParameter: string;
}

interface DynamicAnalysis {
  metrics: Record<string, HealthMetrics>;
  overall: OverallAssessment; timestamp: string;
}

interface DynamicResult {
  prediction: DynamicPrediction | null;
  vitals: { BP: number; HeartRate: number; Glucose: number; SpO2: number; Sleep: number; Steps: number };
  analysis: DynamicAnalysis; entries_count: number;
}

/* ═══════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════ */

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

const ACCENT = {
  teal: "#0de5a8", cyan: "#4a9eff", purple: "#a78bfa",
  amber: "#ffb83f", coral: "#ff607a", rose: "#f472b6",
} as const;

const DISEASE_MAP: Record<string, { color: string; emoji: string; severity: string; advice: string }> = {
  "Coronary Heart Disease": { color: ACCENT.coral,  emoji: "🫀", severity: "High",     advice: "Consult a cardiologist. Monitor BP and cholesterol." },
  "Stroke":                 { color: ACCENT.purple,  emoji: "⚡", severity: "Critical", advice: "Seek immediate medical evaluation. Elevated cerebrovascular risk." },
  "Diabetes":               { color: ACCENT.amber,   emoji: "🩸", severity: "High",     advice: "Monitor glucose levels. Consider dietary changes and HbA1c test." },
  "Hypertension":           { color: "#ff8c42",      emoji: "📈", severity: "Moderate",  advice: "Reduce salt intake, regular exercise. Consider BP medication." },
  "Arrhythmia":             { color: ACCENT.rose,    emoji: "💗", severity: "Moderate",  advice: "ECG patterns suggest irregularity. Get a 24-hr Holter test." },
  "Metabolic Syndrome":     { color: "#e8a838",      emoji: "⚖️", severity: "Moderate",  advice: "Cluster of metabolic risk factors. Lifestyle changes recommended." },
  "General Neurological Disorder": { color: ACCENT.cyan, emoji: "🧠", severity: "Moderate", advice: "Mixed neurological signals. Consider EEG/neurologist consult." },
  "Epilepsy":               { color: "#c084fc",      emoji: "🔮", severity: "High",     advice: "Epileptiform patterns detected. Consult neurologist immediately." },
  "No Significant Disease":  { color: ACCENT.teal,   emoji: "✅", severity: "Low",      advice: "All clear! Your vitals are within healthy ranges. Keep it up." },
};

const RISK_MODELS: { key: keyof RiskBreakdown; label: string; color: string; emoji: string }[] = [
  { key: "heart",    label: "Heart",    color: ACCENT.coral,  emoji: "🫀" },
  { key: "diabetes", label: "Diabetes", color: ACCENT.amber,  emoji: "🩸" },
  { key: "stroke",   label: "Stroke",   color: ACCENT.purple, emoji: "⚡" },
  { key: "ecg",      label: "ECG",      color: ACCENT.teal,   emoji: "📈" },
  { key: "eeg",      label: "EEG",      color: ACCENT.cyan,   emoji: "🧠" },
  { key: "emg",      label: "EMG",      color: ACCENT.rose,   emoji: "💪" },
];

function sevColor(sev: string) {
  if (sev === "Low") return ACCENT.teal;
  if (sev === "Moderate") return ACCENT.amber;
  if (sev === "High") return ACCENT.coral;
  return "#e53e3e";
}

function ncmRiskColor(cat: string) {
  const c = cat.toLowerCase();
  if (c === "low") return ACCENT.teal;
  if (c === "moderate") return ACCENT.amber;
  if (c === "high") return "#ff8c42";
  return ACCENT.coral;
}

/* ── Animated progress bar ── */
function ProgressBar({ value, max, color, delay = 0 }: { value: number; max: number; color: string; delay?: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="rr-bar-track">
      <motion.div className="rr-bar-fill" style={{ background: color, boxShadow: `0 0 10px ${color}44` }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */

export default function ResultsPage() {
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<"dynamic" | "ncm">("dynamic");

  /* Dynamic */
  const [dynResult, setDynResult] = useState<DynamicResult | null>(null);
  const [dynLoading, setDynLoading] = useState(false);
  const [dynError, setDynError] = useState<string | null>(null);

  /* NCM */
  const [ncm, setNcm] = useState<NCMResult | null>(null);
  const [ncmLoading, setNcmLoading] = useState(false);
  const [ncmError, setNcmError] = useState<string | null>(null);

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

  const runNCM = useCallback(async () => {
    setNcmLoading(true); setNcmError(null);
    try {
      const res = await fetch("/api/ncm-analyze");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `NCM failed (${res.status})`);
      setNcm(data);
    } catch (err) { setNcmError(err instanceof Error ? err.message : "NCM analysis failed"); }
    finally { setNcmLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "dynamic" && !dynResult && !dynLoading) runDynamic(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "ncm" && !ncm && !ncmLoading) runNCM(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-28" style={{ background: "var(--bg-base)" }}>

        {/* EKG */}
        <div className="ekg-strip" aria-hidden="true">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* Top bar */}
        <header className="prana-topbar">
          <div className="flex items-center gap-2">
            <img src="/imgs/logo.png" alt="" width={28} height={28} className="prana-logo" />
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: "22px", fontWeight: 700, letterSpacing: "1px", background: "linear-gradient(135deg, var(--teal), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dhanvantari</span>
            <span style={{ fontSize: "9px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>Results</span>
          </div>
          <button onClick={toggle} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            {theme === "dark" ? <Sun className="w-4 h-4" style={{ color: "var(--warn-text)" }} /> : <Moon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
          </button>
        </header>

        {/* ─── Max-Width Container ─── */}
        <div className="rr-container">

          {/* Tab bar */}
          <div className="rr-tabs">
            {(["dynamic", "ncm"] as const).map((tab) => (
              <button key={tab} className={`rr-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "dynamic" ? <><Activity className="w-5 h-5" /> Dynamic Analysis</> : <><Brain className="w-5 h-5" /> NCM Analysis</>}
                {activeTab === tab && <motion.div className="rr-tab-line" layoutId="tabLine" transition={{ type: "spring" as const, stiffness: 350, damping: 30 }} />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════
                TAB 1 — DYNAMIC
               ══════════════════════════════════════════ */}
            {activeTab === "dynamic" && (
              <motion.div key="dyn" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}>

                {/* Error */}
                {dynError && (
                  <div className="rr-error">
                    <AlertTriangle className="w-5 h-5" style={{ color: ACCENT.coral, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="rr-error-title">Analysis Error</div>
                      <div className="rr-error-msg">{dynError}</div>
                      <div className="rr-error-hint">Upload vitals on the Dynamic page &amp; ensure ML server is running.</div>
                    </div>
                    <button onClick={runDynamic} className="rr-btn-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
                  </div>
                )}

                {/* Loading */}
                {dynLoading && (
                  <div className="rr-center-state">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Brain className="w-14 h-14" style={{ color: ACCENT.teal }} />
                    </motion.div>
                    <h3 className="rr-state-title">Analyzing your vitals…</h3>
                    <p className="rr-state-sub">Running 6 ML models + meta-fusion</p>
                  </div>
                )}

                {/* Empty */}
                {!dynResult && !dynLoading && !dynError && (
                  <div className="rr-center-state">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="rr-empty-icon" style={{ background: `${ACCENT.teal}14`, borderColor: `${ACCENT.teal}44` }}>
                        <Activity className="w-10 h-10" style={{ color: ACCENT.teal }} />
                      </div>
                    </motion.div>
                    <h3 className="rr-state-title">Dynamic Health Analysis</h3>
                    <p className="rr-state-sub">Upload vitals (BP, HR, Glucose, SpO2, Sleep, Steps) first</p>
                    <button onClick={runDynamic} className="rr-btn-primary"><RefreshCw className="w-4 h-4" /> Run Analysis</button>
                  </div>
                )}

                {/* ── Results ── */}
                {dynResult && !dynLoading && (() => {
                  const pred = dynResult.prediction;
                  const analysis = dynResult.analysis;
                  const vitals = dynResult.vitals;
                  const dInfo = pred ? (DISEASE_MAP[pred.final_diagnosis] || { color: "var(--text-muted)", emoji: "❓", severity: "Unknown", advice: "Consult your doctor." }) : null;
                  const confPct = pred ? Math.min(pred.confidence, 1) : 0;
                  const oCat = analysis.overall.riskCategory;
                  const oColor = sevColor(oCat);

                  return (
                    <div className="rr-results-stack">

                      {/* ── 1. DIAGNOSIS CARD — the hero ── */}
                      {pred && dInfo && (
                        <motion.div custom={0} variants={fade} initial="hidden" animate="show" className="rr-card rr-diagnosis-hero" style={{ borderTopColor: dInfo.color }}>
                          {/* Top row: emoji + title */}
                          <div className="rr-diag-top">
                            <span className="rr-diag-emoji">{dInfo.emoji}</span>
                            <div>
                              <div className="rr-diag-label">Predicted Condition</div>
                              <div className="rr-diag-name" style={{ color: dInfo.color }}>{pred.final_diagnosis}</div>
                            </div>
                          </div>

                          {/* Key numbers */}
                          <div className="rr-diag-stats">
                            <div className="rr-diag-stat">
                              <div className="rr-diag-stat-val" style={{ color: dInfo.color }}>{(confPct * 100).toFixed(0)}%</div>
                              <div className="rr-diag-stat-label">Confidence</div>
                            </div>
                            <div className="rr-diag-divider" />
                            <div className="rr-diag-stat">
                              <div className="rr-diag-stat-val" style={{ color: sevColor(dInfo.severity) }}>{dInfo.severity}</div>
                              <div className="rr-diag-stat-label">Severity</div>
                            </div>
                            <div className="rr-diag-divider" />
                            <div className="rr-diag-stat">
                              <div className="rr-diag-stat-val" style={{ color: oColor }}>{oCat}</div>
                              <div className="rr-diag-stat-label">Overall Risk</div>
                            </div>
                          </div>

                          {/* Advice */}
                          <div className="rr-diag-advice">
                            <ArrowRight className="w-4 h-4" style={{ color: dInfo.color, flexShrink: 0, marginTop: 2 }} />
                            <span>{dInfo.advice}</span>
                          </div>

                          <button onClick={runDynamic} className="rr-btn-sm" style={{ marginTop: 14 }}><RefreshCw className="w-4 h-4" /> Re-run</button>
                        </motion.div>
                      )}

                      {/* ── 2. MODEL RISK BREAKDOWN ── */}
                      {pred && (
                        <motion.div custom={1} variants={fade} initial="hidden" animate="show" className="rr-card">
                          <h3 className="rr-card-title">Model Risk Breakdown</h3>
                          <p className="rr-card-sub">Probability from each of the 6 ML models</p>
                          <div className="rr-model-list">
                            {RISK_MODELS.map((m, i) => {
                              const prob = pred.risk_breakdown[m.key];
                              const pctStr = (prob * 100).toFixed(1);
                              return (
                                <div key={m.key} className="rr-model-row">
                                  <span className="rr-model-emoji">{m.emoji}</span>
                                  <span className="rr-model-name">{m.label}</span>
                                  <div style={{ flex: 1 }}>
                                    <ProgressBar value={prob * 100} max={100} color={m.color} delay={0.12 + i * 0.08} />
                                  </div>
                                  <span className="rr-model-pct" style={{ color: m.color }}>{pctStr}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* ── 3. VITAL SIGNS ── */}
                      <motion.div custom={2} variants={fade} initial="hidden" animate="show" className="rr-card">
                        <h3 className="rr-card-title">Your Vital Signs</h3>
                        <p className="rr-card-sub">Averaged from uploaded data — inputs to all models</p>
                        <div className="rr-vitals-grid">
                          {[
                            { icon: <HeartPulse className="w-5 h-5" />, label: "Blood Pressure", val: vitals.BP.toFixed(0), unit: "mmHg", color: ACCENT.coral },
                            { icon: <Activity className="w-5 h-5" />,   label: "Heart Rate",     val: vitals.HeartRate.toFixed(0), unit: "bpm", color: ACCENT.teal },
                            { icon: <Droplets className="w-5 h-5" />,   label: "Glucose",        val: vitals.Glucose.toFixed(0), unit: "mg/dL", color: ACCENT.amber },
                            { icon: <Wind className="w-5 h-5" />,       label: "SpO2",           val: vitals.SpO2.toFixed(1), unit: "%", color: ACCENT.cyan },
                            { icon: <BedDouble className="w-5 h-5" />,  label: "Sleep",          val: vitals.Sleep.toFixed(1), unit: "hrs", color: ACCENT.purple },
                            { icon: <Footprints className="w-5 h-5" />, label: "Steps",          val: Math.round(vitals.Steps).toLocaleString(), unit: "/day", color: ACCENT.rose },
                          ].map((v, i) => (
                            <motion.div key={i} className="rr-vital" custom={3 + i * 0.3} variants={fade} initial="hidden" animate="show">
                              <div className="rr-vital-icon" style={{ color: v.color, background: `${v.color}12` }}>{v.icon}</div>
                              <div className="rr-vital-info">
                                <div className="rr-vital-label">{v.label}</div>
                                <div className="rr-vital-val">{v.val} <span className="rr-vital-unit">{v.unit}</span></div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* ── 4. PARAMETER RISK SCORES ── */}
                      {Object.keys(analysis.metrics).length > 0 && (
                        <motion.div custom={3} variants={fade} initial="hidden" animate="show" className="rr-card">
                          <h3 className="rr-card-title">Parameter Risk Scores</h3>
                          <p className="rr-card-sub">How each vital contributes to your overall health risk</p>
                          <div className="rr-model-list">
                            {Object.entries(analysis.metrics)
                              .filter(([, m]) => m.sampleCount > 0)
                              .sort(([, a], [, b]) => b.riskScore - a.riskScore)
                              .map(([key, m], i) => {
                                const pct = (m.riskScore * 100).toFixed(1);
                                const c = m.riskScore > 0.6 ? ACCENT.coral : m.riskScore > 0.3 ? ACCENT.amber : ACCENT.teal;
                                return (
                                  <div key={key} className="rr-model-row">
                                    <span className="rr-model-name" style={{ width: "auto", minWidth: "100px" }}>
                                      {key.replace(/_/g, " ").replace(/\b\w/g, ch => ch.toUpperCase())}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <ProgressBar value={m.riskScore * 100} max={100} color={c} delay={0.1 + i * 0.08} />
                                    </div>
                                    <span className="rr-model-pct" style={{ color: c }}>{pct}%</span>
                                  </div>
                                );
                              })}
                          </div>
                        </motion.div>
                      )}

                      {/* ── 5. OVERALL SUMMARY ── */}
                      <motion.div custom={4} variants={fade} initial="hidden" animate="show" className="rr-card rr-summary" style={{ borderLeftColor: oColor }}>
                        <div className="rr-summary-row">
                          <div>
                            <div className="rr-summary-label">Overall Risk</div>
                            <div className="rr-summary-cat" style={{ color: oColor }}>{oCat}</div>
                          </div>
                          <div className="rr-summary-ring">
                            <svg width="56" height="56" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border)" strokeWidth="4" opacity="0.3" />
                              <motion.circle cx="28" cy="28" r="22" fill="none" stroke={oColor} strokeWidth="4"
                                strokeLinecap="round" strokeDasharray={2 * Math.PI * 22}
                                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - analysis.overall.overallRisk) }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                transform="rotate(-90 28 28)" />
                              <text x="28" y="31" textAnchor="middle" fill={oColor} fontSize="13" fontWeight="700">
                                {(analysis.overall.overallRisk * 100).toFixed(0)}%
                              </text>
                            </svg>
                          </div>
                        </div>
                        <div className="rr-summary-meta">
                          <span>{analysis.overall.parametersCount} vitals analyzed</span>
                          <span>·</span>
                          <span>{dynResult.entries_count} data entries</span>
                          <span>·</span>
                          <span>Highest: <strong>{analysis.overall.highestRiskParameter.replace(/_/g, " ")}</strong></span>
                        </div>
                      </motion.div>

                      {/* Disclaimer */}
                      <motion.div custom={5} variants={fade} initial="hidden" animate="show" className="rr-disclaimer">
                        This assessment uses multi-model AI for informational purposes only. Consult a healthcare professional before taking any medical decisions.
                      </motion.div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ══════════════════════════════════════════
                TAB 2 — NCM
               ══════════════════════════════════════════ */}
            {activeTab === "ncm" && (
              <motion.div key="ncm" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>

                {ncmError && (
                  <div className="rr-error">
                    <AlertTriangle className="w-5 h-5" style={{ color: ACCENT.coral, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="rr-error-title">NCM Error</div>
                      <div className="rr-error-msg">{ncmError}</div>
                    </div>
                    <button onClick={runNCM} className="rr-btn-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
                  </div>
                )}

                {ncmLoading && (
                  <div className="rr-center-state">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Zap className="w-14 h-14" style={{ color: ACCENT.purple }} />
                    </motion.div>
                    <h3 className="rr-state-title">Analyzing biosignals…</h3>
                    <p className="rr-state-sub">Processing ECG, EEG &amp; EMG data</p>
                  </div>
                )}

                {!ncm && !ncmLoading && !ncmError && (
                  <div className="rr-center-state">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="rr-empty-icon" style={{ background: `${ACCENT.purple}14`, borderColor: `${ACCENT.purple}44` }}>
                        <Brain className="w-10 h-10" style={{ color: ACCENT.purple }} />
                      </div>
                    </motion.div>
                    <h3 className="rr-state-title">NCM Biosignal Analysis</h3>
                    <p className="rr-state-sub">Analyze your ECG, EEG, and EMG recordings</p>
                    <button onClick={runNCM} className="rr-btn-primary" style={{ background: ACCENT.purple }}><Zap className="w-4 h-4" /> Run Analysis</button>
                  </div>
                )}

                {ncm && !ncmLoading && (() => {
                  const nColor = ncmRiskColor(ncm.risk_category);
                  const signals = [
                    { label: "Cardiac Risk",  prob: ncm.predictions.cardiac.probability, state: ncm.predictions.cardiac.state, color: ACCENT.coral, emoji: "🫀" },
                    { label: "Neural Stress", prob: ncm.predictions.stress.probability,  state: ncm.predictions.stress.state,  color: ACCENT.purple, emoji: "🧠" },
                    { label: "Muscle Strain", prob: ncm.predictions.muscle.probability,  state: ncm.predictions.muscle.state,  color: ACCENT.amber, emoji: "💪" },
                  ];

                  return (
                    <div className="rr-results-stack">

                      {/* ── 1. NCM INDEX HERO ── */}
                      <motion.div custom={0} variants={fade} initial="hidden" animate="show" className="rr-card rr-diagnosis-hero" style={{ borderTopColor: nColor }}>
                        <div className="rr-diag-top">
                          <span className="rr-diag-emoji">{ncm.risk_category === "Low" ? "✅" : ncm.risk_category === "Moderate" ? "⚠️" : "🚨"}</span>
                          <div>
                            <div className="rr-diag-label">NCM Composite Score</div>
                            <div className="rr-diag-name" style={{ color: nColor }}>{ncm.ncm_index.toFixed(1)} / 100</div>
                          </div>
                        </div>

                        <div className="rr-diag-stats">
                          <div className="rr-diag-stat">
                            <div className="rr-diag-stat-val" style={{ color: nColor }}>{ncm.risk_category}</div>
                            <div className="rr-diag-stat-label">Risk Category</div>
                          </div>
                          <div className="rr-diag-divider" />
                          <div className="rr-diag-stat">
                            <div className="rr-diag-stat-val" style={{ color: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral }}>
                              {ncm.systemic_flag}
                            </div>
                            <div className="rr-diag-stat-label">System Status</div>
                          </div>
                          <div className="rr-diag-divider" />
                          <div className="rr-diag-stat">
                            <div className="rr-diag-stat-val" style={{ color: ncm.model_source === "ml" ? ACCENT.teal : "var(--text-muted)" }}>
                              {ncm.model_source === "ml" ? "ML" : "Formula"}
                            </div>
                            <div className="rr-diag-stat-label">Model Source</div>
                          </div>
                        </div>

                        <button onClick={runNCM} className="rr-btn-sm" style={{ marginTop: 14 }}><RefreshCw className="w-4 h-4" /> Re-analyze</button>
                      </motion.div>

                      {/* ── 2. SIGNAL SCORES ── */}
                      <motion.div custom={1} variants={fade} initial="hidden" animate="show" className="rr-card">
                        <h3 className="rr-card-title">Signal Scores</h3>
                        <p className="rr-card-sub">Individual risk from each biosignal system</p>
                        <div className="rr-signal-cards">
                          {signals.map((s, i) => (
                            <motion.div key={i} className="rr-signal-card" custom={1.5 + i * 0.3} variants={fade} initial="hidden" animate="show"
                              style={{ borderLeftColor: s.color }}>
                              <div className="rr-signal-top">
                                <span style={{ fontSize: "24px" }}>{s.emoji}</span>
                                <div>
                                  <div className="rr-signal-name">{s.label}</div>
                                  <div className="rr-signal-state" style={{ color: s.color }}>{s.state}</div>
                                </div>
                              </div>
                              <div className="rr-signal-prob">
                                <ProgressBar value={s.prob * 100} max={100} color={s.color} delay={0.3 + i * 0.1} />
                                <span className="rr-signal-pct" style={{ color: s.color }}>{(s.prob * 100).toFixed(1)}%</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* ── 3. RAW FEATURES ── */}
                      <motion.div custom={2} variants={fade} initial="hidden" animate="show" className="rr-card">
                        <h3 className="rr-card-title">Biosignal Measurements</h3>
                        <p className="rr-card-sub">Extracted from your ECG, EEG &amp; EMG recordings</p>
                        <div className="rr-vitals-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                          {[
                            { icon: <HeartPulse className="w-5 h-5" />, label: "Heart Rate",     val: ncm.features.heart_rate.toFixed(0),     unit: "bpm",  color: ACCENT.coral },
                            { icon: <Activity className="w-5 h-5" />,   label: "HRV (SDNN)",     val: ncm.features.hrv_sdnn.toFixed(1),       unit: "ms",   color: ACCENT.teal },
                            { icon: <Waves className="w-5 h-5" />,      label: "Stress Ratio",   val: ncm.features.stress_ratio.toFixed(2),   unit: "β/α",  color: ACCENT.purple },
                            { icon: <Zap className="w-5 h-5" />,        label: "EMG RMS",        val: ncm.features.emg_rms.toFixed(3),        unit: "mV",   color: ACCENT.amber },
                          ].map((v, i) => (
                            <div key={i} className="rr-vital">
                              <div className="rr-vital-icon" style={{ color: v.color, background: `${v.color}12` }}>{v.icon}</div>
                              <div className="rr-vital-info">
                                <div className="rr-vital-label">{v.label}</div>
                                <div className="rr-vital-val">{v.val} <span className="rr-vital-unit">{v.unit}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* ── 4. SYSTEMIC STATUS ── */}
                      <motion.div custom={3} variants={fade} initial="hidden" animate="show" className="rr-card rr-summary"
                        style={{ borderLeftColor: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Shield className="w-6 h-6" style={{ color: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral }} />
                          <div>
                            <div className="rr-summary-cat" style={{ color: ncm.systemic_flag === "Stable" ? ACCENT.teal : ACCENT.coral, fontSize: 18 }}>
                              {ncm.systemic_flag}
                            </div>
                            <div className="rr-summary-meta" style={{ marginTop: 4 }}>
                              {ncm.systemic_flag === "Stable"
                                ? "No cross-system risk patterns — your biosignals are within safe ranges."
                                : "Cross-system risk pattern detected — multiple systems show elevated stress."}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* ── 5. DATA SUMMARY ── */}
                      {ncm.data_summary && (
                        <motion.div custom={4} variants={fade} initial="hidden" animate="show" className="rr-card">
                          <h3 className="rr-card-title">Data Summary</h3>
                          <div className="rr-data-chips">
                            {[
                              { label: "ECG", count: ncm.data_summary.ecg_samples, color: ACCENT.coral },
                              { label: "EEG", count: ncm.data_summary.eeg_samples, color: ACCENT.purple },
                              { label: "EMG", count: ncm.data_summary.emg_samples, color: ACCENT.amber },
                              { label: "HR",  count: ncm.data_summary.heart_rate_samples, color: ACCENT.teal },
                            ].map((d, i) => (
                              <div key={i} className="rr-data-chip" style={{ borderColor: `${d.color}44`, color: d.color }}>
                                <span className="rr-chip-count">{d.count.toLocaleString()}</span>
                                <span className="rr-chip-label">{d.label} samples</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <motion.div custom={5} variants={fade} initial="hidden" animate="show" className="rr-disclaimer">
                        NCM analysis is for informational purposes only. Consult a healthcare professional for clinical decisions.
                      </motion.div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mantra */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mantra-banner" style={{ margin: "16px 24px 0" }}>
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
