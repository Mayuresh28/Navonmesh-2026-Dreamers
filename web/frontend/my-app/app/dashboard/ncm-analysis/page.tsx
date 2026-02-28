"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";
import { Icons } from "@/components/icons/health-icons";
import { NCMGauge } from "@/components/dosha/ncm-gauge";
import { SignalCard } from "@/components/dosha/signal-card";
import { SystemicBanner } from "@/components/dosha/systemic-banner";
import { DataDetails } from "@/components/dosha/data-details";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type { NCMResult } from "@/components/dosha/types";

export default function NCMAnalysisPage() {
  const { theme, toggle } = useTheme();
  const [result, setResult] = useState<NCMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ncm-analyze");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <GlassmorphicBackground />

      {/* ── EKG Strip ── */}
      <div className="ekg-strip shrink-0">
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
            NCM
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {result && (
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{ background: "var(--bg-card)", border: "1.5px solid var(--border-strong)", color: "var(--text-body)" }}
            >
              {Icons.refresh("w-4 h-4")} Re-analyze
            </button>
          )}
          <button onClick={toggle}
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} />
              : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-auto px-6 sm:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Initial State */}
          {!result && !loading && !error && (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--teal), var(--cyan))", boxShadow: "0 16px 48px rgba(13,229,168,0.25)", border: "1px solid var(--border-accent)" }}>
                  {Icons.activity("w-14 h-14 text-white")}
                </div>
              </motion.div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Neuro-Cardio-Muscular Assessment</h2>
                <p style={{ color: "var(--text-muted)" }} className="max-w-md">
                  Analyze your neuro-cardio-muscular health using biosignal data
                </p>
              </div>
              <button
                onClick={runAnalysis}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all"
                style={{ background: "var(--teal)", color: "#fff" }}
              >
                {Icons.activity("w-5 h-5")} Run Analysis
              </button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
            >
              <div className="w-16 h-16 rounded-full border-4 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--teal)" }} />
              <p className="font-medium" style={{ color: "var(--text-muted)" }}>Running analysis...</p>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--danger-bg)" }}>
                {Icons.alertTriangle("w-8 h-8")}
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Analysis Failed</h3>
                <p style={{ color: "var(--danger-text)" }}>{error}</p>
              </div>
              <button
                onClick={runAnalysis}
                className="px-6 py-3 rounded-xl font-semibold transition-all"
                style={{ background: "var(--teal)", color: "#fff" }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 p-8 rounded-3xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <NCMGauge value={result.ncm_index} category={result.risk_category} />
                <p className="text-sm text-center max-w-md" style={{ color: "var(--text-muted)" }}>
                  Composite score fusing cardiac (40%), neural stress (35%), and muscle fatigue (25%). Lower is healthier.
                </p>
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    background: result.model_source === "ml" ? "var(--teal-bg)" : "var(--bg-raised)",
                    color: result.model_source === "ml" ? "var(--teal)" : "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {result.model_source === "ml" ? "ML Model Prediction" : "Formula-Based (ML offline)"}
                </span>
              </motion.div>

              <div className="prana-sh text-xl">Signal Analysis</div>
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                <SignalCard
                  title="ECG — Cardiac" subtitle="Heart rhythm & variability" icon={Icons.ecg}
                  prediction={result.predictions.cardiac} featureLabel="Heart Rate"
                  featureValue={result.features.heart_rate.toFixed(1)} featureUnit="bpm" delay={0.2}
                />
                <SignalCard
                  title="EEG — Neural" subtitle="Brain stress indicators" icon={Icons.eeg}
                  prediction={result.predictions.stress} featureLabel="Stress Ratio"
                  featureValue={result.features.stress_ratio.toFixed(2)} featureUnit="β/α" delay={0.35}
                />
                <SignalCard
                  title="EMG — Muscular" subtitle="Muscle fatigue detection" icon={Icons.emg}
                  prediction={result.predictions.muscle} featureLabel="EMG RMS"
                  featureValue={result.features.emg_rms.toFixed(3)} featureUnit="mV" delay={0.5}
                />
              </div>

              <SystemicBanner flag={result.systemic_flag} ncmIndex={result.ncm_index} />
              <DataDetails result={result} />

              {/* Mantra Banner */}
              <div className="mantra-banner mt-4">
                <span className="mantra-symbol">&#x0950;</span>
                <div className="mantra-text">
                  &ldquo;Nidrā svasthasya rogāṇāṃ praśamanaṃ&rdquo;
                </div>
                <div className="mantra-trans-text">
                  Proper rest brings relief from all ailments
                </div>
                <div className="mantra-src-text">— Suśruta Saṃhitā</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
