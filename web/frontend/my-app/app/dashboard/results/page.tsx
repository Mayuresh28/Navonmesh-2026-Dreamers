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
                          <div className="rr-diag-top">
                            <span className="rr-diag-emoji">{dInfo.emoji}</span>
                            <div>
                              <div className="rr-diag-label">Predicted Condition</div>
                              <div className="rr-diag-name" style={{ color: dInfo.color }}>{pred.final_diagnosis}</div>
                            </div>
                          </div>

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
                        <h3 className="rr-card-title">Diabetes</h3>
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