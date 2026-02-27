"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain,
  TrendingUp,
  Loader2,
  RefreshCw,
  HeartPulse,
  Dna,
  Clock,
  Target,
  UserCircle,
  AlertCircle,
  ArrowRight,
  FileWarning,
} from "lucide-react";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";
import { Navbar } from "@/lib/navbar";
import { RiskCard } from "@/components/predict/risk-card";
import { ProbabilityBars } from "@/components/predict/probability-bars";
import { FeatureCards } from "@/components/predict/feature-cards";

interface PredictionResult {
  predicted_class: string;
  probabilities: Record<string, number>;
  input_features: {
    BMI: number;
    Genetic_Risk: number;
    Age_Risk_Multiplier: number;
    Baseline_Risk: number;
  };
  engineered_features: {
    Composite_Risk: number;
    BMI_Genetic: number;
    Age_Baseline: number;
  };
}

// Check if profile has all required fields for prediction
function validateProfileForPrediction(profile: {
  bmi?: number;
  geneticRiskScore?: number;
  ageRiskMultiplier?: number;
  age?: number;
  height?: number;
  weight?: number;
  familyHistory?: string;
  existingConditions?: string[];
  smokingStatus?: string;
  alcoholUse?: string;
}): { valid: boolean; missingFields: string[]; warnings: string[] } {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (!profile.age || profile.age <= 0) missingFields.push("Age");
  if (!profile.height || profile.height <= 0) missingFields.push("Height");
  if (!profile.weight || profile.weight <= 0) missingFields.push("Weight");

  if (profile.bmi === undefined || profile.bmi === null || isNaN(profile.bmi)) {
    missingFields.push("BMI (computed from height & weight)");
  } else if (profile.bmi < 10 || profile.bmi > 60) {
    warnings.push(`BMI value of ${profile.bmi} seems unusual. Please verify your height and weight.`);
  }

  if (profile.geneticRiskScore === undefined || profile.geneticRiskScore === null) {
    missingFields.push("Genetic Risk Score");
  }

  if (profile.ageRiskMultiplier === undefined || profile.ageRiskMultiplier === null) {
    missingFields.push("Age Risk Multiplier");
  }

  if (!profile.smokingStatus) warnings.push("Smoking status is not set — defaulting to 'never'.");
  if (!profile.alcoholUse) warnings.push("Alcohol use is not set — defaulting to 'never'.");

  return {
    valid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

// Map user profile data to ML model input
function profileToModelInput(profile: {
  bmi: number;
  geneticRiskScore: number;
  ageRiskMultiplier: number;
  familyHistory: string;
  existingConditions: string[];
  smokingStatus: string;
  alcoholUse: string;
}) {
  let baselineRisk = 0.05;

  const highRiskConditions = ["Heart Disease", "Diabetes", "Cancer", "Kidney Disease"];
  const medRiskConditions = ["Hypertension", "Thyroid", "Liver Disease", "Asthma"];

  for (const cond of profile.existingConditions) {
    if (highRiskConditions.includes(cond)) baselineRisk += 0.1;
    else if (medRiskConditions.includes(cond)) baselineRisk += 0.05;
  }

  if (profile.familyHistory && profile.familyHistory.toLowerCase() !== "none" && profile.familyHistory.trim() !== "") {
    baselineRisk += 0.08;
  }

  if (profile.smokingStatus === "current") baselineRisk += 0.1;
  else if (profile.smokingStatus === "former") baselineRisk += 0.04;

  if (profile.alcoholUse === "heavy") baselineRisk += 0.08;
  else if (profile.alcoholUse === "moderate") baselineRisk += 0.04;
  else if (profile.alcoholUse === "occasional") baselineRisk += 0.01;

  baselineRisk = Math.min(0.6, Math.max(0.05, baselineRisk));

  return {
    BMI: profile.bmi,
    Genetic_Risk: profile.geneticRiskScore,
    Age_Risk_Multiplier: profile.ageRiskMultiplier,
    Baseline_Risk: parseFloat(baselineRisk.toFixed(4)),
  };
}

function getRiskColor(riskClass: string) {
  const lower = riskClass.toLowerCase();
  if (lower === "low") return { bg: "bg-status-low", text: "text-status-low", border: "border-status-low" };
  if (lower === "high") return { bg: "bg-status-high", text: "text-status-high", border: "border-status-high" };
  return { bg: "bg-status-mod", text: "text-status-mod", border: "border-status-mod" };
}

function getRiskIcon(riskClass: string) {
  const lower = riskClass.toLowerCase();
  if (lower === "low") return <CheckCircle className="w-10 h-10" />;
  if (lower === "high") return <AlertTriangle className="w-10 h-10" />;
  return <ShieldCheck className="w-10 h-10" />;
}

function getRiskMessage(riskClass: string) {
  const lower = riskClass.toLowerCase();
  if (lower === "low") return "Your health risk level is low. Keep up the great work!";
  if (lower === "high") return "Elevated risk detected. Please consult your doctor for further evaluation.";
  return "Your risk is within normal range. Maintain healthy habits for continued wellness.";
}

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
    <ProtectedRoute><div className="min-h-screen pb-20 flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--teal)" }} /><BottomNav />
    </div></ProtectedRoute>
  );

  if (!hasProfile()) return (
    <ProtectedRoute><div className="min-h-screen pb-20 flex items-center justify-center px-6" style={{ background: "var(--bg-base)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--warn-bg)", border: "2px solid var(--warn-border)" }}>
          <AlertTriangle className="w-10 h-10" style={{ color: "var(--warn-text)" }} />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Profile Required</h2>
        <p className="mb-6" style={{ color: "var(--text-body)" }}>Complete your health profile first so we can analyze your risk factors.</p>
        <button onClick={() => router.push("/dashboard/profile/setup")} className="btn-primary">Complete Profile</button>
      </motion.div>
      <BottomNav />
    </div></ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
        {/* EKG strip */}
        <div className="ekg-strip" />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Health Risk Assessment</h1>
            <p className="text-lg" style={{ color: "var(--text-body)" }}>AI-powered risk prediction based on your health profile</p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-5 rounded-[20px] flex items-start gap-4"
                style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
                <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: "var(--danger-text)" }} />
                <div className="flex-1">
                  <p className="font-medium mb-1" style={{ color: "var(--danger-text)" }}>Prediction Error</p>
                  <p className="text-sm" style={{ color: "var(--text-body)" }}>{error}</p>
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    ML server: <code className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--bg-card)" }}>cd ml/static && python app.py</code>
                  </p>
                </div>
                <button onClick={runPrediction} className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium"
                  style={{ background: "var(--danger-bg)", color: "var(--danger-text)", border: "1px solid var(--danger-border)" }}>
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {predicting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-6">
                <Brain className="w-16 h-16" style={{ color: "var(--teal)" }} />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Analyzing Your Health Data</h3>
              <p style={{ color: "var(--text-body)" }}>Running ML model prediction...</p>
            </motion.div>
          )}

          {prediction && !predicting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <RiskCard prediction={prediction} onRerun={runPrediction} />
              <ProbabilityBars prediction={prediction} />
              <FeatureCards prediction={prediction} />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="p-5 rounded-[20px] text-center"
                style={{ background: "var(--teal-bg)", border: "1px solid var(--border-accent)" }}>
                <p className="text-sm" style={{ color: "var(--text-body)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>Disclaimer:</strong> This assessment is for informational purposes only. Please consult a healthcare professional for clinical advice.
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
