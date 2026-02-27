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
    <div className="min-h-screen flex flex-col pb-20" style={{ background: "var(--bg-base)" }}>
      {/* EKG strip */}
      <div className="ekg-strip" />

      {/* Top Bar */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dynamic")} className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--text-muted)" }}>
            {Icons.arrowLeft()}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--teal-bg)", border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--teal)" }}>{Icons.activity("w-5 h-5")}</span>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>NCM Analysis</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Neuro-Cardio-Muscular Health Assessment</p>
            </div>
          </div>
        </div>
        {result && (
          <button onClick={runAnalysis} disabled={loading}
            className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
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
                <div className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--teal), var(--cyan))", boxShadow: "0 16px 48px rgba(13,229,168,0.3)", border: "1px solid var(--border)" }}>
                  {Icons.activity("w-14 h-14 text-white")}
                </div>
              </motion.div>
              <div className="text-center max-w-lg">
                <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>NCM Health Analysis</h2>
                <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Analyze your ECG, EEG, and EMG data using machine learning to assess cardiac risk, neural stress, and muscle fatigue.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-lg w-full">
                {[
                  { icon: Icons.ecg, label: "ECG", desc: "Heart Signal", color: "var(--ok)" },
                  { icon: Icons.eeg, label: "EEG", desc: "Brain Activity", color: "var(--cyan)" },
                  { icon: Icons.emg, label: "EMG", desc: "Muscle Signal", color: "var(--blue)" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5"
                    style={{ borderColor: s.color, background: `color-mix(in srgb, ${s.color} 8%, transparent)`, color: s.color }}>
                    <span>{s.icon("w-8 h-8")}</span>
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-xs opacity-60">{s.desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={runAnalysis}
                className="btn-primary w-full max-w-lg py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.99]">
                Analyze ECG · EEG · EMG
              </button>
              <p className="text-xs text-center max-w-md" style={{ color: "var(--text-muted)" }}>
                Data is fetched from your uploaded health records. Upload ECG, EEG, and EMG data from the Vitals Dashboard first.
              </p>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "var(--teal-bg)", color: "var(--teal)" }}>
                <Spinner size="h-10 w-10" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Running NCM Analysis...</p>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Fetching biosignal data and computing predictions</p>
              </div>
              <div className="flex items-center gap-8 text-xs" style={{ color: "var(--text-muted)" }}>
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
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "var(--danger-bg)", border: "2px solid var(--danger)", color: "var(--danger)" }}>
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Analysis Failed</p>
                <p className="text-sm mt-2 max-w-md" style={{ color: "var(--danger)" }}>{error}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={runAnalysis} className="btn-primary px-6 py-3 rounded-2xl font-medium transition-colors">Try Again</button>
                <button onClick={() => router.push("/dynamic")} className="btn-secondary px-6 py-3 rounded-2xl font-medium transition-colors">Upload Data First</button>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {result && !loading && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto flex flex-col gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="prana-vessel flex flex-col items-center gap-4 py-8">
                <div className="prana-sh text-xl">NCM Health Index</div>
                <NCMGauge value={result.ncm_index} category={result.risk_category} />
                <p className="text-sm text-center max-w-md" style={{ color: "var(--text-muted)" }}>
                  Composite score fusing cardiac (40%), neural stress (35%), and muscle fatigue (25%). Lower is healthier.
                </p>
                <span className="text-xs font-medium px-3 py-1 rounded-full"
                  style={result.model_source === "ml"
                    ? { background: "var(--cyan-bg, rgba(24,216,245,0.1))", color: "var(--cyan)", border: "1px solid var(--border)" }
                    : { background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                  }>
                  {result.model_source === "ml" ? "ML Model Prediction" : "Formula-Based (ML offline)"}
                </span>
              </motion.div>

              <div className="prana-sh text-xl">Signal Analysis</div>
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
