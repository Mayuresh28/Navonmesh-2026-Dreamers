"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";
import { Icons } from "@/components/icons/health-icons";
import { NCMGauge } from "@/components/dosha/ncm-gauge";
import { SignalCard } from "@/components/dosha/signal-card";
import { SystemicBanner } from "@/components/dosha/systemic-banner";
import { DataDetails } from "@/components/dosha/data-details";
import { BottomNav } from "@/components/navigation/bottom-nav";
import type { NCMResult } from "@/components/dosha/types";

export default function NCMAnalysisPage() {
  const router = useRouter();
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

      {/* ── Top Bar ── */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-border-soft bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dynamic")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            {Icons.arrowLeft()}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              {Icons.activity("w-5 h-5")}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">NCM Analysis</h1>
              <p className="text-xs text-gray-500">Neuro-Cardio-Muscular Health Assessment</p>
            </div>
          </div>
        </div>
        {result && (
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:opacity-50"
          >
            {Icons.refresh("w-4 h-4")} Re-analyze
          </button>
        )}
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
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent via-primary/50 to-primary/20 flex items-center justify-center shadow-[0_16px_48px_rgb(90_127_232_/_0.3)] border border-accent/50">
                  {Icons.activity("w-14 h-14 text-white")}
                </div>
              </motion.div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">NCM Health Assessment</h2>
                <p className="text-gray-500 max-w-md">
                  Analyze your neuro-cardio-muscular health using biosignal data
                </p>
              </div>
              <button
                onClick={runAnalysis}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg"
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
              <div className="w-16 h-16 rounded-full border-4 border-border-soft border-t-primary animate-spin" />
              <p className="text-gray-500 font-medium">Running analysis...</p>
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
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                {Icons.alertTriangle("w-8 h-8 text-red-500")}
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Analysis Failed</h3>
                <p className="text-red-500">{error}</p>
              </div>
              <button
                onClick={runAnalysis}
                className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
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
                className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-card border border-border-soft"
              >
                <NCMGauge value={result.ncm_index} category={result.risk_category} />
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Composite score fusing cardiac (40%), neural stress (35%), and muscle fatigue (25%). Lower is healthier.
                </p>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    result.model_source === "ml"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {result.model_source === "ml" ? "ML Model Prediction" : "Formula-Based (ML offline)"}
                </span>
              </motion.div>

              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-primary" />
                <h2 className="text-xl font-bold text-gray-900">Signal Analysis</h2>
              </div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
