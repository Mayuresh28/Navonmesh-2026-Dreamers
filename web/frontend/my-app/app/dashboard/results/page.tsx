"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Brain, Loader2, RefreshCw } from "lucide-react";
import { profileToModelInput, type PredictionResult } from "@/components/predict/types";
import { RiskCard } from "@/components/predict/risk-card";
import { ProbabilityBars } from "@/components/predict/probability-bars";
import { FeatureCards } from "@/components/predict/feature-cards";

export default function ResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading: profileLoading, hasProfile } = useProfileData(user?.uid);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPrediction = async () => {
    if (!profile) return;
    setPredicting(true);
    setError(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileToModelInput(profile)),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Prediction failed"); }
      setPrediction(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally { setPredicting(false); }
  };

  useEffect(() => { if (profile && !prediction && !predicting) runPrediction(); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  if (profileLoading) return (
    <ProtectedRoute><div className="min-h-screen bg-background pb-20 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" /><BottomNav />
    </div></ProtectedRoute>
  );

  if (!hasProfile()) return (
    <ProtectedRoute><div className="min-h-screen bg-background pb-20 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-status-mod/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-status-mod" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Profile Required</h2>
        <p className="text-text-secondary mb-6">Complete your health profile first so we can analyze your risk factors.</p>
        <button onClick={() => router.push("/dashboard/profile/setup")} className="btn-primary">Complete Profile</button>
      </motion.div>
      <BottomNav />
    </div></ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <main className="max-w-6xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Health Risk Assessment</h1>
            <p className="text-text-secondary text-lg">AI-powered risk prediction based on your health profile</p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-5 rounded-[20px] bg-status-high/10 border border-status-high/30 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-status-high shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-status-high font-medium mb-1">Prediction Error</p>
                  <p className="text-text-secondary text-sm">{error}</p>
                  <p className="text-text-secondary text-xs mt-2">
                    ML server: <code className="bg-card px-2 py-0.5 rounded text-xs">cd ml/static && python app.py</code>
                  </p>
                </div>
                <button onClick={runPrediction} className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-status-high/20 text-status-high text-sm font-medium">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {predicting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-6">
                <Brain className="w-16 h-16 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Analyzing Your Health Data</h3>
              <p className="text-text-secondary">Running ML model prediction...</p>
            </motion.div>
          )}

          {prediction && !predicting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <RiskCard prediction={prediction} onRerun={runPrediction} />
              <ProbabilityBars prediction={prediction} />
              <FeatureCards prediction={prediction} />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="p-5 rounded-[20px] bg-accent/10 border border-accent/20 text-center">
                <p className="text-text-secondary text-sm">
                  <strong className="text-text-primary">Disclaimer:</strong> This assessment is for informational purposes only. Please consult a healthcare professional for clinical advice.
                </p>
              </motion.div>
            </motion.div>
          )}
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
