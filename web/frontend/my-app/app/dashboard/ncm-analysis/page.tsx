"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/icons/health-icons";
import { Spinner } from "@/components/ui/spinner";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { NCMGauge } from "@/components/dosha/ncm-gauge";
import { SignalCard } from "@/components/dosha/signal-card";
import { SystemicBanner } from "@/components/dosha/systemic-banner";
import { DataDetails } from "@/components/dosha/data-details";
import type { NCMResult } from "@/components/dosha/types";

export default function NCMAnalysisPage() {
  const router = useRouter();
  const [result, setResult] = useState<NCMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/ncm-analyze");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally { setLoading(false); }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Top Bar */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-border-soft bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dynamic")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
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
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:opacity-50">
            {Icons.refresh("w-4 h-4")} Re-analyze
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto px-6 sm:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Initial State */}
          {!result && !loading && !error && (
            <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent via-primary/50 to-primary/20 flex items-center justify-center shadow-[0_16px_48px_rgb(90_127_232_/_0.3)] border border-accent/50">
                  {Icons.activity("w-14 h-14 text-white")}
                </div>
              </motion.div>
              <div className="text-center max-w-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">NCM Health Analysis</h2>
                <p className="text-gray-500 text-lg leading-relaxed">
                  Analyze your ECG, EEG, and EMG data using machine learning to assess cardiac risk, neural stress, and muscle fatigue.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
                {[
                  { icon: Icons.ecg, label: "ECG", desc: "Heart Signal", color: "text-rose-500 bg-rose-50 border-rose-200" },
                  { icon: Icons.eeg, label: "EEG", desc: "Brain Activity", color: "text-violet-500 bg-violet-50 border-violet-200" },
                  { icon: Icons.emg, label: "EMG", desc: "Muscle Signal", color: "text-blue-500 bg-blue-50 border-blue-200" },
                ].map((s) => (
                  <div key={s.label} className={`flex flex-col items-center gap-2 rounded-2xl border-2 ${s.color} px-4 py-5`}>
                    <span>{s.icon("w-8 h-8")}</span>
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-xs opacity-60">{s.desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={runAnalysis}
                className="w-full max-w-lg py-4 rounded-2xl bg-primary hover:bg-secondary text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.99]">
                Analyze ECG · EEG · EMG
              </button>
              <p className="text-xs text-gray-400 text-center max-w-md">
                Data is fetched from your uploaded health records. Upload ECG, EEG, and EMG data from the Vitals Dashboard first.
              </p>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Spinner size="h-10 w-10" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">Running NCM Analysis...</p>
                <p className="text-sm text-gray-400 mt-2">Fetching biosignal data and computing predictions</p>
              </div>
              <div className="flex items-center gap-8 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">{Icons.ecg("w-4 h-4")} ECG</span>
                <span className="flex items-center gap-1.5">{Icons.eeg("w-4 h-4")} EEG</span>
                <span className="flex items-center gap-1.5">{Icons.emg("w-4 h-4")} EMG</span>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && !loading && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-500">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">Analysis Failed</p>
                <p className="text-sm text-red-500 mt-2 max-w-md">{error}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={runAnalysis} className="px-6 py-3 rounded-2xl bg-primary text-white font-medium hover:bg-secondary transition-colors">Try Again</button>
                <button onClick={() => router.push("/dynamic")} className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Upload Data First</button>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {result && !loading && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto flex flex-col gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="card flex flex-col items-center gap-4 py-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-6 rounded-full bg-primary" />
                  <h2 className="text-xl font-bold text-gray-900">NCM Health Index</h2>
                </div>
                <NCMGauge value={result.ncm_index} category={result.risk_category} />
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Composite score fusing cardiac (40%), neural stress (35%), and muscle fatigue (25%). Lower is healthier.
                </p>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${result.model_source === "ml" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"}`}>
                  {result.model_source === "ml" ? "ML Model Prediction" : "Formula-Based (ML offline)"}
                </span>
              </motion.div>

              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-primary" />
                <h2 className="text-xl font-bold text-gray-900">Signal Analysis</h2>
              </div>
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                <SignalCard title="ECG — Cardiac" subtitle="Heart rhythm & variability" icon={Icons.ecg}
                  prediction={result.predictions.cardiac} featureLabel="Heart Rate"
                  featureValue={result.features.heart_rate.toFixed(1)} featureUnit="bpm" delay={0.2} />
                <SignalCard title="EEG — Neural" subtitle="Brain stress indicators" icon={Icons.eeg}
                  prediction={result.predictions.stress} featureLabel="Stress Ratio"
                  featureValue={result.features.stress_ratio.toFixed(2)} featureUnit="β/α" delay={0.35} />
                <SignalCard title="EMG — Muscular" subtitle="Muscle fatigue detection" icon={Icons.emg}
                  prediction={result.predictions.muscle} featureLabel="EMG RMS"
                  featureValue={result.features.emg_rms.toFixed(3)} featureUnit="mV" delay={0.5} />
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
