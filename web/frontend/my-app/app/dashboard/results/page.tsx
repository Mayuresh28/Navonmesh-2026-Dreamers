"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Brain, RefreshCw, Activity, HeartPulse,
  Sun, Moon, Shield, Droplets, Wind, Footprints,
  BedDouble, Zap, Sparkles, TrendingUp, Heart, Stethoscope,
  ThermometerSun, CheckCircle2, AlertCircle, XCircle, ArrowRight,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type { NCMResult } from "@/components/dosha/types";

/* Types */
interface RiskBreakdown { heart: number; diabetes: number; stroke: number; ecg: number; eeg: number; emg: number; }
interface DynamicPrediction { final_diagnosis: string; confidence: number; risk_breakdown: RiskBreakdown; }
interface HealthMetrics { mean: number; slope: number; percentChange: number; variance: number; instabilityIndex: number; riskScore: number; sampleCount: number; }
interface OverallAssessment { overallRisk: number; overallInstability: number; riskCategory: "Low" | "Moderate" | "High" | "Critical"; parametersCount: number; highestRiskParameter: string; }
interface DynamicAnalysis { metrics: Record<string, HealthMetrics>; overall: OverallAssessment; timestamp: string; }
interface DynamicResult { prediction: DynamicPrediction | null; vitals: { BP: number; HeartRate: number; Glucose: number; SpO2: number; Sleep: number; Steps: number }; analysis: DynamicAnalysis; entries_count: number; }

const A = { teal: "#0de5a8", cyan: "#4a9eff", purple: "#a78bfa", amber: "#ffb83f", coral: "#ff607a", rose: "#f472b6" } as const;

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.07 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

const DISEASES: Record<string, { emoji: string; sev: "safe"|"mild"|"moderate"|"serious"|"critical"; meaning: string; reasons: string[]; advice: string[] }> = {
  "No Significant Disease": { emoji: "\u2705", sev: "safe", meaning: "Your body shows no concerning patterns. Everything looks healthy!", reasons: ["Your vitals are within ideal ranges", "No irregular heart, brain, or muscle signals"], advice: ["Keep up your healthy habits", "Regular exercise & balanced diet", "Annual health checkup recommended"] },
  "Coronary Heart Disease": { emoji: "\uD83E\uDEC0", sev: "serious", meaning: "Your heart may be under stress due to narrowed blood vessels.", reasons: ["Elevated blood pressure over time", "High cholesterol or glucose levels", "Family history or lifestyle factors"], advice: ["See a cardiologist soon", "Reduce salt, sugar, and fatty foods", "30 min of walking daily helps greatly"] },
  "Stroke": { emoji: "\u26A1", sev: "critical", meaning: "There are signs of high risk for brain blood supply issues.", reasons: ["Very high blood pressure episodes", "Irregular heart rhythm patterns (ECG)", "History of heart-related problems"], advice: ["Seek medical attention promptly", "Control blood pressure with medication", "Avoid smoking and excessive alcohol"] },
  "Diabetes": { emoji: "\uD83E\uDE78", sev: "serious", meaning: "Your blood sugar levels show patterns linked to diabetes.", reasons: ["Glucose readings above normal range", "Body weight may be a contributing factor", "Insulin resistance building over time"], advice: ["Get an HbA1c blood test done", "Reduce sugar and processed carbs", "Regular exercise helps control blood sugar"] },
  "Hypertension": { emoji: "\uD83D\uDCC8", sev: "moderate", meaning: "Your blood pressure is consistently higher than normal.", reasons: ["Multiple high BP readings detected", "Stress or sedentary lifestyle", "High salt intake or genetic factors"], advice: ["Reduce salt to under 5g/day", "Practice stress relief \u2014 yoga, meditation", "See a doctor for BP monitoring plan"] },
  "Arrhythmia": { emoji: "\uD83D\uDC97", sev: "moderate", meaning: "Your heartbeat shows irregular patterns that need attention.", reasons: ["ECG waveform irregularities", "Heart rate variability is unusual", "Could be caused by stress or caffeine"], advice: ["Get a 24-hour Holter monitor test", "Limit caffeine and energy drinks", "Consult a cardiologist for evaluation"] },
  "Metabolic Syndrome": { emoji: "\u2696\uFE0F", sev: "moderate", meaning: "Multiple metabolic markers are off \u2014 a cluster of risk factors.", reasons: ["High BP + high glucose together", "BMI or waist circumference elevated", "Low activity combined with poor diet"], advice: ["Start with 20 min of daily walking", "Eat more vegetables, less processed food", "Regular checkups every 3 months"] },
  "General Neurological Disorder": { emoji: "\uD83E\uDDE0", sev: "moderate", meaning: "Brain wave patterns suggest some neurological irregularity.", reasons: ["Unusual EEG signal patterns", "May indicate stress or sleep issues", "Could be early sign of neuro condition"], advice: ["Get enough sleep (7-8 hours)", "Visit a neurologist for EEG review", "Reduce screen time before bed"] },
  "Epilepsy": { emoji: "\uD83D\uDD2E", sev: "serious", meaning: "Brain signals show patterns commonly seen in epilepsy.", reasons: ["Epileptiform discharges in EEG", "Abnormal neural spike activity", "Can be genetic or injury-related"], advice: ["See a neurologist immediately", "Never stop medication without doctor", "Avoid triggers: sleep deprivation, flashing lights"] },
};

function getDInfo(name: string) {
  return DISEASES[name] || { emoji: "\u2753", sev: "moderate" as const, meaning: "Our AI detected a health pattern worth investigating.", reasons: ["Unusual readings in multiple areas"], advice: ["Consult your doctor for detailed evaluation"] };
}

const SEV_MAP = {
  safe:     { color: A.teal,   label: "All Clear",  Icon: CheckCircle2 },
  mild:     { color: A.cyan,   label: "Mild",       Icon: AlertCircle },
  moderate: { color: A.amber,  label: "Moderate",   Icon: AlertCircle },
  serious:  { color: A.coral,  label: "Serious",    Icon: AlertTriangle },
  critical: { color: "#e53e3e", label: "Critical",  Icon: XCircle },
} as const;

function vitalStatus(key: string, val: number): { status: "good"|"warn"|"bad"; note: string } {
  switch (key) {
    case "BP":        return val < 90 ? { status: "warn", note: "Low" } : val <= 120 ? { status: "good", note: "Normal" } : val <= 140 ? { status: "warn", note: "Elevated" } : { status: "bad", note: "High" };
    case "HeartRate": return val < 60 ? { status: "warn", note: "Low" } : val <= 100 ? { status: "good", note: "Normal" } : { status: "bad", note: "High" };
    case "Glucose":   return val < 70 ? { status: "warn", note: "Low" } : val <= 100 ? { status: "good", note: "Normal" } : val <= 126 ? { status: "warn", note: "Pre-diabetic" } : { status: "bad", note: "High" };
    case "SpO2":      return val >= 95 ? { status: "good", note: "Healthy" } : val >= 90 ? { status: "warn", note: "Low" } : { status: "bad", note: "Critical" };
    case "Sleep":     return val >= 7 ? { status: "good", note: "Enough" } : val >= 5 ? { status: "warn", note: "Insufficient" } : { status: "bad", note: "Very Low" };
    case "Steps":     return val >= 8000 ? { status: "good", note: "Active" } : val >= 4000 ? { status: "warn", note: "Moderate" } : { status: "bad", note: "Sedentary" };
    default:          return { status: "good", note: "" };
  }
}
const STATUS_COLOR = { good: A.teal, warn: A.amber, bad: A.coral } as const;

function RiskRing({ value, color, size = 88, stroke = 5 }: { value: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2; const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} opacity={0.25} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - value) }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize="16" fontWeight="700">{(value * 100).toFixed(0)}%</text>
    </svg>
  );
}

function Bar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div className="rr-bar-track">
      <motion.div className="rr-bar-fill" style={{ background: color, boxShadow: `0 0 10px ${color}44` }}
        initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Theme CSS — injected as a <style> tag
   dark  → [data-theme="dark"]  on <html>
   light → [data-theme="light"] on <html>
   ═══════════════════════════════════════════════════ */
const THEME_STYLES = `
  /* ── Shared accent palette ── */
  :root {
    --teal:   #0de5a8;
    --cyan:   #4a9eff;
    --purple: #a78bfa;
    --amber:  #ffb83f;
    --coral:  #ff607a;
    --rose:   #f472b6;
  }

  /* ── DARK theme ── */
  [data-theme="dark"] {
    --bg-base:        #0b0f1a;
    --bg-raised:      #111827;
    --bg-card:        #141c2e;
    --bg-card2:       #0f172a;
    --border:         rgba(255,255,255,0.08);
    --border-mid:     rgba(255,255,255,0.13);
    --text-main:      #e8edf5;
    --text-muted:     #8b97b1;
    --text-faint:     #4a5568;
    --warn-text:      #ffb83f;
    --tag-bg:         rgba(13,229,168,0.10);
    --tag-border:     rgba(13,229,168,0.25);
    --tag-text:       #0de5a8;
    --input-bg:       #0f172a;
    --tab-active-bg:  rgba(13,229,168,0.12);
    --pill-bg:        rgba(255,255,255,0.05);
    --pill-border:    rgba(255,255,255,0.10);
    --ekg-color:      rgba(13,229,168,0.40);
    --card-shadow:    0 4px 24px rgba(0,0,0,0.40);
    --summary-bg:     rgba(13,229,168,0.05);
    --disclaimer-bg:  rgba(255,255,255,0.03);
    --disclaimer-clr: #4a5568;
    --error-bg:       rgba(255,96,122,0.08);
    --error-border:   rgba(255,96,122,0.25);
  }

  /* ── LIGHT theme ── */
  [data-theme="light"] {
    --bg-base:        #f0f7f4;
    --bg-raised:      #e4f0ea;
    --bg-card:        #ffffff;
    --bg-card2:       #f7fdf9;
    --border:         rgba(0,100,70,0.10);
    --border-mid:     rgba(0,100,70,0.18);
    --text-main:      #1a2e25;
    --text-muted:     #4a6b5a;
    --text-faint:     #8aab98;
    --warn-text:      #b45309;
    --tag-bg:         rgba(13,160,110,0.10);
    --tag-border:     rgba(13,160,110,0.28);
    --tag-text:       #0a9e72;
    --input-bg:       #ffffff;
    --tab-active-bg:  rgba(13,160,110,0.10);
    --pill-bg:        rgba(0,80,50,0.06);
    --pill-border:    rgba(0,80,50,0.14);
    --ekg-color:      rgba(13,160,110,0.35);
    --card-shadow:    0 2px 16px rgba(0,80,50,0.08);
    --summary-bg:     rgba(13,160,110,0.05);
    --disclaimer-bg:  rgba(0,80,50,0.03);
    --disclaimer-clr: #8aab98;
    --error-bg:       rgba(220,38,38,0.06);
    --error-border:   rgba(220,38,38,0.20);
  }

  /* ══════════════════════════════════════════
     EKG strip
     ══════════════════════════════════════════ */
  .ekg-strip {
    width: 100%; height: 44px; overflow: hidden;
    background: linear-gradient(90deg, var(--bg-base), var(--bg-raised), var(--bg-base));
  }
  .ekg-mover {
    width: 200%; height: 100%;
    animation: ekgScroll 6s linear infinite;
  }
  @keyframes ekgScroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ══════════════════════════════════════════
     Top bar
     ══════════════════════════════════════════ */
  .prana-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px 10px;
    position: sticky; top: 0; z-index: 40;
    background: var(--bg-base);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
    transition: background 0.3s ease;
  }
  .prana-logo { border-radius: 8px; }

  /* ══════════════════════════════════════════
     Container
     ══════════════════════════════════════════ */
  .rr-container {
    max-width: 720px; margin: 0 auto; padding: 20px 16px;
  }

  /* ══════════════════════════════════════════
     Tabs
     ══════════════════════════════════════════ */
  .rr-tabs {
    display: flex; gap: 4px;
    background: var(--bg-raised);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 4px;
    margin-bottom: 20px;
  }
  .rr-tab {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 7px; padding: 10px 14px; border-radius: 10px; border: none;
    background: transparent; cursor: pointer; font-size: 14px; font-weight: 500;
    color: var(--text-faint); position: relative;
    transition: color 0.2s, background 0.2s;
    font-family: inherit;
  }
  .rr-tab.active {
    color: var(--teal); background: var(--tab-active-bg);
  }
  [data-theme="light"] .rr-tab.active { color: #0a9e72; }
  .rr-tab-line {
    position: absolute; bottom: -1px; left: 12px; right: 12px;
    height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, var(--teal), var(--cyan));
  }

  /* ══════════════════════════════════════════
     Cards
     ══════════════════════════════════════════ */
  .rr-results-stack { display: flex; flex-direction: column; gap: 16px; }

  .rr-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px; padding: 20px;
    box-shadow: var(--card-shadow);
    transition: background 0.3s, box-shadow 0.3s;
  }
  .rr-card-title {
    font-size: 15px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;
  }
  .rr-card-sub {
    font-size: 12px; color: var(--text-faint); margin-bottom: 16px;
  }

  /* ── Diagnosis hero card ── */
  .rr-diagnosis-hero {
    border-top: 3px solid transparent;
    transition: border-top-color 0.3s, background 0.3s;
  }
  .rr-diag-top {
    display: flex; align-items: center; gap: 14px; margin-bottom: 18px;
  }
  .rr-diag-emoji { font-size: 36px; line-height: 1; }
  .rr-diag-label {
    font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-faint); margin-bottom: 4px;
  }
  .rr-diag-name { font-size: 20px; font-weight: 700; line-height: 1.2; }

  .rr-diag-stats {
    display: flex; align-items: center;
    background: var(--bg-card2); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px; gap: 0; margin-bottom: 16px;
  }
  .rr-diag-stat { flex: 1; text-align: center; }
  .rr-diag-stat-val { font-size: 22px; font-weight: 700; line-height: 1; }
  .rr-diag-stat-label { font-size: 11px; color: var(--text-faint); margin-top: 4px; }
  .rr-diag-divider {
    width: 1px; height: 36px; background: var(--border); margin: 0 8px;
  }

  .rr-diag-advice {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: var(--text-muted); line-height: 1.55;
    background: var(--bg-card2); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px;
  }

  /* ── Model list / progress bars ── */
  .rr-model-list { display: flex; flex-direction: column; gap: 12px; }
  .rr-model-row {
    display: flex; align-items: center; gap: 10px;
  }
  .rr-model-emoji { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
  .rr-model-name {
    width: 68px; font-size: 13px; font-weight: 500; color: var(--text-muted); flex-shrink: 0;
  }
  .rr-model-pct {
    width: 44px; text-align: right; font-size: 13px; font-weight: 600; flex-shrink: 0;
  }

  .rr-bar-track {
    height: 6px; border-radius: 3px;
    background: var(--border); overflow: hidden;
  }
  .rr-bar-fill { height: 100%; border-radius: 3px; }

  /* ── Vitals grid ── */
  .rr-vitals-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .rr-vital {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg-card2); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px;
  }
  .rr-vital-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rr-vital-label { font-size: 11px; color: var(--text-faint); margin-bottom: 2px; }
  .rr-vital-val   { font-size: 16px; font-weight: 700; color: var(--text-main); }
  .rr-vital-unit  { font-size: 11px; font-weight: 400; color: var(--text-faint); }

  /* ── Summary card ── */
  .rr-summary {
    border-left: 3px solid transparent;
    background: var(--summary-bg) !important;
  }
  .rr-summary-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px;
  }
  .rr-summary-label { font-size: 11px; color: var(--text-faint); margin-bottom: 4px; }
  .rr-summary-cat   { font-size: 22px; font-weight: 700; }
  .rr-summary-ring  { flex-shrink: 0; }
  .rr-summary-meta  {
    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
    font-size: 12px; color: var(--text-faint);
  }
  .rr-summary-meta strong { color: var(--text-muted); font-weight: 600; }

  /* ── NCM signal cards ── */
  .rr-signal-cards { display: flex; flex-direction: column; gap: 12px; }
  .rr-signal-card {
    background: var(--bg-card2); border: 1px solid var(--border);
    border-left: 3px solid transparent; border-radius: 12px; padding: 14px;
  }
  .rr-signal-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .rr-signal-name  { font-size: 14px; font-weight: 600; color: var(--text-main); }
  .rr-signal-state { font-size: 12px; margin-top: 2px; font-weight: 500; }
  .rr-signal-prob  { display: flex; align-items: center; gap: 10px; }
  .rr-signal-prob > div { flex: 1; }
  .rr-signal-pct   { font-size: 13px; font-weight: 600; width: 44px; text-align: right; }

  /* ── Data chips ── */
  .rr-data-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .rr-data-chip {
    display: flex; flex-direction: column; align-items: center;
    border: 1px solid; border-radius: 12px; padding: 10px 16px; min-width: 80px;
    background: var(--bg-card2);
  }
  .rr-chip-count { font-size: 18px; font-weight: 700; line-height: 1; }
  .rr-chip-label { font-size: 11px; margin-top: 4px; color: var(--text-faint); }

  /* ── Empty / loading states ── */
  .rr-center-state {
    display: flex; flex-direction: column; align-items: center;
    padding: 48px 24px; gap: 14px; text-align: center;
  }
  .rr-empty-icon {
    width: 72px; height: 72px; border-radius: 50%; border: 2px solid;
    display: flex; align-items: center; justify-content: center;
  }
  .rr-state-title { font-size: 17px; font-weight: 600; color: var(--text-main); }
  .rr-state-sub   { font-size: 13px; color: var(--text-faint); }

  /* ── Error box ── */
  .rr-error {
    display: flex; align-items: flex-start; gap: 12px;
    background: var(--error-bg); border: 1px solid var(--error-border);
    border-radius: 12px; padding: 16px; margin-bottom: 16px;
  }
  .rr-error-title { font-size: 14px; font-weight: 600; color: var(--coral); margin-bottom: 4px; }
  .rr-error-msg   { font-size: 13px; color: var(--text-muted); }
  .rr-error-hint  { font-size: 12px; color: var(--text-faint); margin-top: 4px; }

  /* ── Buttons ── */
  .rr-btn-sm {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--bg-raised); color: var(--text-muted);
    font-size: 13px; font-weight: 500; cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    font-family: inherit;
  }
  .rr-btn-sm:hover { border-color: var(--teal); color: var(--teal); }

  .rr-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 22px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, var(--teal), var(--cyan));
    color: #0b0f1a; font-size: 14px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s; font-family: inherit;
  }
  .rr-btn-primary:hover { opacity: 0.88; }

  /* ── Disclaimer ── */
  .rr-disclaimer {
    font-size: 12px; color: var(--disclaimer-clr); text-align: center;
    padding: 12px 16px; border-radius: 10px;
    background: var(--disclaimer-bg); border: 1px solid var(--border);
    line-height: 1.6;
  }

  /* ── Mantra banner ── */
  .mantra-banner {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 14px; padding: 16px 20px; text-align: center;
  }
  .mantra-symbol    { font-size: 22px; color: var(--teal); display: block; margin-bottom: 6px; }
  .mantra-text      { font-size: 14px; color: var(--text-muted); font-style: italic; }
  .mantra-trans-text{ font-size: 12px; color: var(--text-faint); margin-top: 2px; }
  .mantra-src-text  { font-size: 11px; color: var(--text-faint); margin-top: 2px; letter-spacing: 0.5px; }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .rr-vitals-grid { grid-template-columns: 1fr; }
    .rr-diag-stats  { flex-wrap: wrap; gap: 12px; }
    .rr-diag-stat   { flex: 0 0 calc(50% - 10px); }
    .rr-diag-divider{ display: none; }
  }
`;

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */

export default function ResultsPage() {
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<"dynamic" | "ncm">("dynamic");
  const [dynResult, setDynResult] = useState<DynamicResult | null>(null);
  const [dynLoading, setDynLoading] = useState(false);
  const [dynError, setDynError] = useState<string | null>(null);
  const [ncm, setNcm] = useState<NCMResult | null>(null);
  const [ncmLoading, setNcmLoading] = useState(false);
  const [ncmError, setNcmError] = useState<string | null>(null);

  const runDynamic = useCallback(async () => {
    setDynLoading(true); setDynError(null);
    try { const res = await fetch("/api/dynamic-predict"); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Analysis failed"); setDynResult(data); }
    catch (err) { setDynError(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setDynLoading(false); }
  }, []);

  const runNCM = useCallback(async () => {
    setNcmLoading(true); setNcmError(null);
    try { const res = await fetch("/api/ncm-analyze"); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Analysis failed"); setNcm(data); }
    catch (err) { setNcmError(err instanceof Error ? err.message : "Analysis failed"); }
    finally { setNcmLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === "dynamic" && !dynResult && !dynLoading) runDynamic(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "ncm" && !ncm && !ncmLoading) runNCM(); }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProtectedRoute>
      {/* ── Inject theme CSS once ── */}
      <style dangerouslySetInnerHTML={{ __html: THEME_STYLES }} />

      <div className="min-h-screen pb-28" style={{ background: "var(--bg-base)", transition: "background 0.3s ease" }}>

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

        <div className="rr-container">
          {/* Tabs */}
          <div className="rr-tabs">
            {(["dynamic", "ncm"] as const).map((tab) => (
              <button key={tab} className={`rr-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "dynamic" ? <><Stethoscope className="w-4.5 h-4.5" /> Health Check</> : <><Brain className="w-4.5 h-4.5" /> Body Signals</>}
                {activeTab === tab && <motion.div className="rr-tab-line" layoutId="tabLine" transition={{ type: "spring" as const, stiffness: 350, damping: 30 }} />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* TAB 1 — HEALTH CHECK */}
            {activeTab === "dynamic" && (
              <motion.div key="dyn" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.22 }}>

                {dynError && (
                  <div className="rr-error">
                    <AlertTriangle className="w-5 h-5" style={{ color: A.coral, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="rr-error-title">Could not analyze</div>
                      <div className="rr-error-msg">{dynError}</div>
                      <div className="rr-error-hint">Make sure you&apos;ve uploaded health data on the Dynamic page first.</div>
                    </div>
                    <button onClick={runDynamic} className="rr-btn-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
                  </div>
                )}

                {dynLoading && (
                  <div className="rr-center-state">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-14 h-14" style={{ color: A.teal }} />
                    </motion.div>
                    <h3 className="rr-state-title">Checking your health...</h3>
                    <p className="rr-state-sub">We&apos;re analyzing your vital readings with our AI models</p>
                  </div>
                )}

                {!dynResult && !dynLoading && !dynError && (
                  <div className="rr-center-state">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="rr-empty-icon" style={{ background: `${A.teal}14`, borderColor: `${A.teal}44` }}>
                        <Activity className="w-10 h-10" style={{ color: A.teal }} />
                      </div>
                    </motion.div>
                    <h3 className="rr-state-title">No Health Data Yet</h3>
                    <p className="rr-state-sub">Upload your vitals on the Dynamic page first, then come back here to see your results.</p>
                    <button onClick={runDynamic} className="rr-btn-primary"><RefreshCw className="w-4 h-4" /> Check Now</button>
                  </div>
                )}

                {dynResult && !dynLoading && (() => {
                  const pred = dynResult.prediction;
                  const vitals = dynResult.vitals;
                  const analysis = dynResult.analysis;
                  const dInfo = pred ? getDInfo(pred.final_diagnosis) : null;
                  const sev = dInfo ? SEV_MAP[dInfo.sev] : SEV_MAP.moderate;
                  const oRisk = analysis.overall.overallRisk;
                  const oCat = analysis.overall.riskCategory;
                  const oColor = oCat === "Low" ? A.teal : oCat === "Moderate" ? A.amber : oCat === "High" ? A.coral : "#e53e3e";

                  return (
                    <div className="rr-stack">

                      {/* 1. HERO */}
                      {pred && dInfo && (
                        <motion.div custom={0} variants={fade} initial="hidden" animate="show" className="rr-card rr-diagnosis-hero" style={{ borderTopColor: sev.color }}>
                          <div className="rr-diag-top">
                            <span className="rr-diag-emoji">{dInfo.emoji}</span>
                            <div>
                              <div className="rr-diag-label">Predicted Condition</div>
                              <div className="rr-diag-name" style={{ color: sev.color }}>{pred.final_diagnosis}</div>
                            </div>
                          </div>

                          <div className="rr-diag-stats">
                            <div className="rr-diag-stat">
                              <div className="rr-diag-stat-val" style={{ color: sev.color }}>{(pred.confidence * 100).toFixed(0)}%</div>
                              <div className="rr-diag-stat-label">Confidence</div>
                            </div>
                            <div className="rr-ring-box">
                              <RiskRing value={oRisk} color={oColor} />
                              <span className="rr-ring-label">Overall Risk</span>
                            </div>
                          </div>

                          <div className="rr-diag-advice">
                            <ArrowRight className="w-4 h-4" style={{ color: sev.color, flexShrink: 0, marginTop: 2 }} />
                            <span>{dInfo.advice}</span>
                          </div>

                          <button onClick={runDynamic} className="rr-btn-sm" style={{ marginTop: 14 }}><RefreshCw className="w-4 h-4" /> Re-run</button>
                        </motion.div>
                      )}

                      {/* 2. WHY */}
                      {pred && dInfo && (
                        <motion.div custom={1} variants={fade} initial="hidden" animate="show" className="rr-card">
                          <div className="rr-card-head">
                            <TrendingUp className="w-5 h-5" style={{ color: A.amber }} />
                            <h3>Why this was detected</h3>
                          </div>
                          <p className="rr-card-sub">Based on your readings, here are possible reasons</p>
                          <ul className="rr-reason-list">
                            {dInfo.reasons.map((r, i) => (
                              <motion.li key={i} custom={1.5 + i * 0.2} variants={fade} initial="hidden" animate="show" className="rr-reason">
                                <span className="rr-reason-dot" style={{ background: sev.color }} />
                                {r}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {/* 3. ADVICE */}
                      {pred && dInfo && (
                        <motion.div custom={2} variants={fade} initial="hidden" animate="show" className="rr-card rr-advice-card">
                          <div className="rr-card-head">
                            <Heart className="w-5 h-5" style={{ color: A.teal }} />
                            <h3>What you should do</h3>
                          </div>
                          <div className="rr-advice-list">
                            {dInfo.advice.map((a, i) => (
                              <motion.div key={i} custom={2.5 + i * 0.2} variants={fade} initial="hidden" animate="show" className="rr-advice-item">
                                <span className="rr-advice-num" style={{ background: `${A.teal}18`, color: A.teal }}>{i + 1}</span>
                                <span>{a}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* ── 3. VITAL SIGNS ── */}
                      <motion.div custom={2} variants={fade} initial="hidden" animate="show" className="rr-card">
                        <h3 className="rr-card-title">Diabetes</h3>
                        <h3 className="rr-card-title">Your Vital Signs</h3>
                        <p className="rr-card-sub">Averaged from uploaded data — inputs to all models</p>
                        <div className="rr-vitals-grid">
                          {([
                            { key: "BP",        icon: <HeartPulse className="w-5 h-5" />, label: "Blood Pressure", val: vitals.BP.toFixed(0),  unit: "mmHg", accent: A.coral },
                            { key: "HeartRate", icon: <Activity className="w-5 h-5" />,   label: "Heart Rate",     val: vitals.HeartRate.toFixed(0), unit: "bpm", accent: A.teal },
                            { key: "Glucose",   icon: <Droplets className="w-5 h-5" />,   label: "Blood Sugar",    val: vitals.Glucose.toFixed(0), unit: "mg/dL", accent: A.amber },
                            { key: "SpO2",      icon: <Wind className="w-5 h-5" />,       label: "Oxygen Level",   val: vitals.SpO2.toFixed(1), unit: "%", accent: A.cyan },
                            { key: "Sleep",     icon: <BedDouble className="w-5 h-5" />,  label: "Sleep",          val: vitals.Sleep.toFixed(1), unit: "hrs", accent: A.purple },
                            { key: "Steps",     icon: <Footprints className="w-5 h-5" />, label: "Daily Steps",    val: Math.round(vitals.Steps).toLocaleString(), unit: "/day", accent: A.rose },
                          ] as const).map((v, i) => {
                            const st = vitalStatus(v.key, Number(v.val.replace(/,/g, "")));
                            return (
                              <motion.div key={i} className="rr-vital" custom={3.5 + i * 0.15} variants={fade} initial="hidden" animate="show">
                                <div className="rr-vital-icon" style={{ color: v.accent, background: `${v.accent}12` }}>{v.icon}</div>
                                <div className="rr-vital-body">
                                  <div className="rr-vital-label">{v.label}</div>
                                  <div className="rr-vital-row">
                                    <span className="rr-vital-val">{v.val} <small>{v.unit}</small></span>
                                    <span className="rr-vital-tag" style={{ color: STATUS_COLOR[st.status], background: `${STATUS_COLOR[st.status]}14` }}>{st.note}</span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>

                      {/* 5. RISK BY AREA */}
                      {pred && (
                        <motion.div custom={4} variants={fade} initial="hidden" animate="show" className="rr-card">
                          <div className="rr-card-head">
                            <Shield className="w-5 h-5" style={{ color: A.purple }} />
                            <h3>Risk by Body Area</h3>
                          </div>
                          <p className="rr-card-sub">Higher bar = more attention needed</p>
                          <div className="rr-risk-bars">
                            {([
                              { key: "heart" as const,    label: "Heart",         emoji: "\uD83E\uDEC0", color: A.coral },
                              { key: "diabetes" as const, label: "Blood Sugar",   emoji: "\uD83E\uDE78", color: A.amber },
                              { key: "stroke" as const,   label: "Brain (Stroke)", emoji: "\u26A1", color: A.purple },
                              { key: "ecg" as const,      label: "Heart Rhythm",  emoji: "\uD83D\uDCC8", color: A.teal },
                              { key: "eeg" as const,      label: "Brain Signals", emoji: "\uD83E\uDDE0", color: A.cyan },
                              { key: "emg" as const,      label: "Muscles",       emoji: "\uD83D\uDCAA", color: A.rose },
                            ]).map((m, i) => {
                              const pct = (pred.risk_breakdown[m.key] || 0) * 100;
                              const riskLabel = pct < 30 ? "Low" : pct < 60 ? "Moderate" : "High";
                              return (
                                <div key={m.key} className="rr-risk-row">
                                  <span className="rr-risk-emoji">{m.emoji}</span>
                                  <div className="rr-risk-info">
                                    <div className="rr-risk-top">
                                      <span className="rr-risk-name">{m.label}</span>
                                      <span className="rr-risk-pct" style={{ color: m.color }}>{pct.toFixed(0)}% {riskLabel}</span>
                                    </div>
                                    <Bar pct={pct} color={m.color} delay={0.15 + i * 0.07} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* 6. OVERALL */}
                      <motion.div custom={5} variants={fade} initial="hidden" animate="show" className="rr-summary" style={{ borderColor: oColor }}>
                        <div className="rr-summary-left">
                          <RiskRing value={oRisk} color={oColor} size={72} stroke={5} />
                        </div>
                        <div className="rr-summary-right">
                          <div className="rr-summary-cat" style={{ color: oColor }}>{oCat} Risk</div>
                          <div className="rr-summary-meta">
                            Based on {analysis.overall.parametersCount} health parameters from {dynResult.entries_count} data sessions. Highest concern: <strong>{analysis.overall.highestRiskParameter.replace(/_/g, " ")}</strong>.
                          </div>
                        </div>
                      </motion.div>

                      <motion.div custom={6} variants={fade} initial="hidden" animate="show" className="rr-disclaimer">
                        <Shield className="w-4 h-4" style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                        <span>This is an AI-based assessment for informational purposes. Always consult a qualified doctor before making medical decisions.</span>
                      </motion.div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* TAB 2 — BODY SIGNALS (NCM) */}
            {activeTab === "ncm" && (
              <motion.div key="ncm" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.22 }}>

                {ncmError && (
                  <div className="rr-error">
                    <AlertTriangle className="w-5 h-5" style={{ color: A.coral, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="rr-error-title">Signal analysis failed</div>
                      <div className="rr-error-msg">{ncmError}</div>
                    </div>
                    <button onClick={runNCM} className="rr-btn-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
                  </div>
                )}

                {ncmLoading && (
                  <div className="rr-center-state">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}>
                      <Zap className="w-14 h-14" style={{ color: A.purple }} />
                    </motion.div>
                    <h3 className="rr-state-title">Reading your body signals...</h3>
                    <p className="rr-state-sub">Analyzing heart, brain, and muscle recordings</p>
                  </div>
                )}

                {!ncm && !ncmLoading && !ncmError && (
                  <div className="rr-center-state">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="rr-empty-icon" style={{ background: `${A.purple}14`, borderColor: `${A.purple}44` }}>
                        <Brain className="w-10 h-10" style={{ color: A.purple }} />
                      </div>
                    </motion.div>
                    <h3 className="rr-state-title">No Signal Data</h3>
                    <p className="rr-state-sub">Upload ECG, EEG, or EMG recordings to analyze your body signals.</p>
                    <button onClick={runNCM} className="rr-btn-primary" style={{ background: A.purple }}><Zap className="w-4 h-4" /> Analyze</button>
                  </div>
                )}

                {ncm && !ncmLoading && (() => {
                  const nColor = ncm.risk_category === "Low" ? A.teal : ncm.risk_category === "Moderate" ? A.amber : ncm.risk_category === "High" ? "#ff8c42" : A.coral;
                  const signals = [
                    { label: "Heart Health", prob: ncm.predictions.cardiac.probability, state: ncm.predictions.cardiac.state, color: A.coral, emoji: "\uD83E\uDEC0",
                      what: ncm.predictions.cardiac.risk_level === "high" ? "Your heart rhythm shows some irregularities" : "Your heart rhythm looks normal and steady" },
                    { label: "Brain Activity", prob: ncm.predictions.stress.probability, state: ncm.predictions.stress.state, color: A.purple, emoji: "\uD83E\uDDE0",
                      what: ncm.predictions.stress.risk_level === "high" ? "Brain signals suggest elevated stress or irregularity" : "Brain wave patterns appear healthy and balanced" },
                    { label: "Muscle Condition", prob: ncm.predictions.muscle.probability, state: ncm.predictions.muscle.state, color: A.amber, emoji: "\uD83D\uDCAA",
                      what: ncm.predictions.muscle.risk_level === "high" ? "Muscle signals show unusual strain or weakness" : "Muscle activity looks normal with good tone" },
                  ];

                  return (
                    <div className="rr-stack">
                      {/* NCM HERO */}
                      <motion.div custom={0} variants={fade} initial="hidden" animate="show" className="rr-hero" style={{ "--accent": nColor } as React.CSSProperties}>
                        <div className="rr-hero-badge" style={{ background: `${nColor}14`, borderColor: `${nColor}44`, color: nColor }}>
                          {ncm.risk_category === "Low" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {ncm.risk_category} Risk
                        </div>
                        <div className="rr-hero-emoji">{ncm.risk_category === "Low" ? "\u2705" : ncm.risk_category === "Moderate" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"}</div>
                        <h2 className="rr-hero-name" style={{ color: nColor }}>Body Signal Score: {ncm.ncm_index.toFixed(0)}/100</h2>
                        <p className="rr-hero-meaning">
                          {ncm.risk_category === "Low"
                            ? "Your body signals are within healthy ranges. Great job taking care of yourself!"
                            : ncm.risk_category === "Moderate"
                              ? "Some signals need attention. Consider lifestyle adjustments and a doctor visit."
                              : "Multiple body systems show stress. Please consult a healthcare professional soon."}
                        </p>
                        <div className="rr-hero-rings">
                          <div className="rr-ring-box">
                            <RiskRing value={ncm.ncm_index / 100} color={nColor} />
                            <span className="rr-ring-label">Signal Score</span>
                          </div>
                        </div>
                        <button onClick={runNCM} className="rr-btn-ghost"><RefreshCw className="w-4 h-4" /> Re-analyze</button>
                      </motion.div>

                      {/* SIGNAL CARDS */}
                      {signals.map((s, i) => (
                        <motion.div key={i} custom={1 + i * 0.5} variants={fade} initial="hidden" animate="show"
                          className="rr-signal-card" style={{ "--accent": s.color } as React.CSSProperties}>
                          <div className="rr-signal-head">
                            <span className="rr-signal-emoji">{s.emoji}</span>
                            <div>
                              <h4 className="rr-signal-name">{s.label}</h4>
                              <span className="rr-signal-state" style={{ color: s.color }}>{s.state}</span>
                            </div>
                            <span className="rr-signal-pct" style={{ color: s.color }}>{(s.prob * 100).toFixed(0)}%</span>
                          </div>
                          <Bar pct={s.prob * 100} color={s.color} delay={0.3 + i * 0.1} />
                          <p className="rr-signal-what">{s.what}</p>
                        </motion.div>
                      ))}

                      {/* MEASUREMENTS */}
                      <motion.div custom={3} variants={fade} initial="hidden" animate="show" className="rr-card">
                        <div className="rr-card-head">
                          <Activity className="w-5 h-5" style={{ color: A.teal }} />
                          <h3>Your Measurements</h3>
                        </div>
                        <div className="rr-vitals-grid rr-vitals-2col">
                          {([
                            { icon: <HeartPulse className="w-5 h-5" />, label: "Heart Rate",    val: ncm.features.heart_rate.toFixed(0),   unit: "bpm", accent: A.coral },
                            { icon: <Activity className="w-5 h-5" />,   label: "Heart Rhythm",  val: ncm.features.hrv_sdnn.toFixed(1),     unit: "ms",  accent: A.teal },
                            { icon: <Brain className="w-5 h-5" />,      label: "Brain Stress",  val: ncm.features.stress_ratio.toFixed(2), unit: "ratio", accent: A.purple },
                            { icon: <Zap className="w-5 h-5" />,        label: "Muscle Signal", val: ncm.features.emg_rms.toFixed(3),      unit: "mV",  accent: A.amber },
                          ]).map((v, i) => (
                            <div key={i} className="rr-vital">
                              <div className="rr-vital-icon" style={{ color: v.accent, background: `${v.accent}12` }}>{v.icon}</div>
                              <div className="rr-vital-body">
                                <div className="rr-vital-label">{v.label}</div>
                                <div className="rr-vital-val">{v.val} <small>{v.unit}</small></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* SYSTEM STATUS */}
                      <motion.div custom={4} variants={fade} initial="hidden" animate="show"
                        className="rr-summary" style={{ borderColor: ncm.systemic_flag === "Stable" ? A.teal : A.coral }}>
                        <Shield className="w-7 h-7" style={{ color: ncm.systemic_flag === "Stable" ? A.teal : A.coral, flexShrink: 0 }} />
                        <div className="rr-summary-right">
                          <div className="rr-summary-cat" style={{ color: ncm.systemic_flag === "Stable" ? A.teal : A.coral }}>
                            System: {ncm.systemic_flag}
                          </div>
                          <div className="rr-summary-meta">
                            {ncm.systemic_flag === "Stable"
                              ? "All body systems are working together smoothly. No cross-system warning signs."
                              : "Multiple body systems are showing stress at the same time. This pattern needs medical review."}
                          </div>
                        </div>
                      </motion.div>

                      {/* Data chips */}
                      {ncm.data_summary && (
                        <motion.div custom={5} variants={fade} initial="hidden" animate="show" className="rr-chip-row">
                          {([
                            { label: "Heart recordings",  count: ncm.data_summary.ecg_samples, color: A.coral },
                            { label: "Brain recordings",  count: ncm.data_summary.eeg_samples, color: A.purple },
                            { label: "Muscle recordings", count: ncm.data_summary.emg_samples, color: A.amber },
                          ]).map((d, i) => (
                            <div key={i} className="rr-chip" style={{ borderColor: `${d.color}44`, color: d.color }}>
                              <span className="rr-chip-num">{d.count.toLocaleString()}</span>
                              <span className="rr-chip-text">{d.label}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      <motion.div custom={6} variants={fade} initial="hidden" animate="show" className="rr-disclaimer">
                        <Shield className="w-4 h-4" style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                        <span>Signal analysis is for informational purposes only. Consult a healthcare professional for clinical decisions.</span>
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
          <span className="mantra-symbol">&#x0950;</span>
          <div className="mantra-text">&ldquo;Ayurvedah amritanam&rdquo;</div>
          <div className="mantra-trans-text">Ayurveda is the science of longevity</div>
          <div className="mantra-src-text">&mdash; Charaka Samhita</div>
        </motion.div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}