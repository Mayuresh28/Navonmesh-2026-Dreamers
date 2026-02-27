"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { ProtectedRoute } from "@/lib/protected-route";
import { Navbar } from "@/lib/navbar";
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
  const { profile, loading: profileLoading, hasProfile, error: profileError } = useProfileData(user?.uid);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = profile ? validateProfileForPrediction(profile) : null;

  const runPrediction = async () => {
    if (!profile) return;

    setPredicting(true);
    setError(null);

    try {
      const modelInput = profileToModelInput(profile);

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelInput),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Prediction failed");
      }

      const result: PredictionResult = await response.json();
      setPrediction(result);
    } catch (err) {
      console.error("[Results] Prediction error:", err);
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  // Auto-predict when profile loads and is valid
  useEffect(() => {
    if (profile && !prediction && !predicting && validation?.valid) {
      runPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleTabChange = (tab: "dashboard" | "profile" | "results") => {
    if (tab === "dashboard") router.push("/dashboard");
    else if (tab === "profile") router.push("/dashboard/profile");
  };

  // ── Loading State ──
  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-transparent has-bottom-nav">
          <GlassmorphicBackground />
          <Navbar activeTab="results" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-text-secondary text-sm">Loading your health data...</p>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Profile Error State ──
  if (profileError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-transparent has-bottom-nav">
          <GlassmorphicBackground />
          <Navbar activeTab="results" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)] px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 rounded-full bg-status-high/10 flex items-center justify-center mx-auto mb-6 border border-status-high/20">
                <AlertCircle className="w-10 h-10 text-status-high" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Unable to Load Profile</h2>
              <p className="text-text-secondary mb-2 leading-relaxed">
                We encountered an error loading your health profile data.
              </p>
              <p className="text-sm text-text-secondary/70 mb-8 bg-background rounded-[12px] p-3 border border-border-soft">
                {profileError}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={() => router.push("/dashboard/profile")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Go to Profile
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── No Profile State ──
  if (!hasProfile()) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-transparent has-bottom-nav">
          <GlassmorphicBackground />
          <Navbar activeTab="results" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)] px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-accent/30 flex items-center justify-center mx-auto mb-6 border border-primary/15"
              >
                <UserCircle className="w-12 h-12 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Health Profile Required</h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                To generate your AI-powered risk assessment, we need your health profile data first.
                This only takes a couple of minutes.
              </p>
              <button
                onClick={() => router.push("/dashboard/profile/setup")}
                className="btn-primary inline-flex items-center gap-2 group"
              >
                Complete Your Profile
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Incomplete Profile Data State ──
  if (validation && !validation.valid) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-transparent has-bottom-nav">
          <GlassmorphicBackground />
          <Navbar activeTab="results" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)] px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg w-full"
            >
              <div className="card text-center">
                <div className="w-20 h-20 rounded-full bg-status-mod/10 flex items-center justify-center mx-auto mb-6 border border-status-mod/20">
                  <FileWarning className="w-10 h-10 text-status-mod" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">Incomplete Profile Data</h2>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  Your health profile is missing some required information needed for the risk assessment.
                </p>

                {/* Missing Fields */}
                <div className="bg-status-high/5 rounded-[16px] p-4 mb-4 border border-status-high/15 text-left">
                  <p className="text-sm font-semibold text-status-high mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Missing Required Fields
                  </p>
                  <ul className="space-y-1.5">
                    {validation.missingFields.map((field) => (
                      <li key={field} className="text-sm text-text-secondary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-high/60 shrink-0" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div className="bg-status-mod/5 rounded-[16px] p-4 mb-6 border border-status-mod/15 text-left">
                    <p className="text-sm font-semibold text-status-mod mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings
                    </p>
                    <ul className="space-y-1.5">
                      {validation.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-mod/60 shrink-0 mt-1.5" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => router.push("/dashboard/profile/setup")}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 group"
                >
                  Update Your Profile
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const riskColors = prediction ? getRiskColor(prediction.predicted_class) : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-transparent has-bottom-nav">
        <GlassmorphicBackground />
        <Navbar activeTab="results" onTabChange={handleTabChange} />

        <main className="max-w-5xl mx-auto px-6 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Risk Assessment</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Health Risk Assessment
            </h1>
            <p className="text-text-secondary">
              AI-powered risk prediction based on your health profile
            </p>
          </motion.div>

          {/* Warnings Banner */}
          {validation && validation.warnings.length > 0 && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-[16px] bg-status-mod/8 border border-status-mod/20 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-status-mod flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary mb-1">Data Warnings</p>
                {validation.warnings.map((w, i) => (
                  <p key={i} className="text-text-secondary text-xs">{w}</p>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-5 rounded-[20px] bg-status-high/8 border border-status-high/20 flex items-start gap-4"
              >
                <AlertTriangle className="w-6 h-6 text-status-high flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-status-high font-medium mb-1">Prediction Error</p>
                  <p className="text-text-secondary text-sm">{error}</p>
                  <p className="text-text-secondary text-xs mt-2">
                    Make sure the ML server is running: <code className="bg-background px-2 py-0.5 rounded-[8px] text-xs border border-border-soft">cd ml/static && python app.py</code>
                  </p>
                </div>
                <button
                  onClick={runPrediction}
                  className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-status-high/10 text-status-high hover:bg-status-high/20 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Predicting State */}
          {predicting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-6"
              >
                <Brain className="w-10 h-10 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Analyzing Your Health Data</h3>
              <p className="text-text-secondary text-sm">Running ML model prediction...</p>
            </motion.div>
          )}

          {/* Results */}
          {prediction && !predicting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Main Risk Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`relative overflow-hidden rounded-[24px] p-8 md:p-10 border ${riskColors?.border}/20 bg-card shadow-[0_4px_24px_rgb(126_166_247_/_0.08)]`}
              >
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full ${riskColors?.bg}/5 blur-3xl pointer-events-none`} />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  {/* Risk Icon & Level */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      className={`w-28 h-28 rounded-full ${riskColors?.bg}/15 flex items-center justify-center border-2 ${riskColors?.border}/30 mb-4`}
                    >
                      <span className={riskColors?.text}>
                        {getRiskIcon(prediction.predicted_class)}
                      </span>
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`text-3xl md:text-4xl font-bold ${riskColors?.text} tracking-tight`}
                    >
                      {prediction.predicted_class}
                    </motion.span>
                    <span className="text-text-secondary text-sm mt-1">Risk Level</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-text-primary mb-3">
                      {getRiskMessage(prediction.predicted_class)}
                    </h2>
                    <p className="text-text-secondary leading-relaxed text-sm">
                      This assessment is based on your BMI, genetic risk factors, age-adjusted risk,
                      and baseline health indicators analyzed by our Random Forest ML model.
                    </p>
                    <button
                      onClick={runPrediction}
                      className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Re-run Analysis
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Probability Bars */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <h3 className="section-title mb-6">
                  <Activity className="w-5 h-5 text-primary" />
                  Class Probabilities
                </h3>

                <div className="space-y-5">
                  {Object.entries(prediction.probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([label, percentage], idx) => {
                      const colors = getRiskColor(label);
                      const isMax = label === prediction.predicted_class;
                      return (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-medium text-sm ${isMax ? colors.text : "text-text-primary"} flex items-center gap-2`}>
                              {isMax && (
                                <span className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`} />
                              )}
                              {label}
                            </span>
                            <span className={`font-bold text-lg ${isMax ? colors.text : "text-text-secondary"}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-border-soft/50 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: 0.5 + idx * 0.1, ease: "easeOut" }}
                              className={`h-full rounded-full ${colors.bg} ${isMax ? "" : "opacity-60"}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>

              {/* Input Features + Engineered Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="card"
                >
                  <h3 className="section-title mb-6">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Model Input Features
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "BMI",
                        value: prediction.input_features.BMI.toFixed(1),
                        icon: <HeartPulse className="w-5 h-5" />,
                        color: "text-primary",
                        bgColor: "bg-primary/8",
                        borderColor: "border-primary/15",
                      },
                      {
                        label: "Genetic Risk",
                        value: prediction.input_features.Genetic_Risk.toFixed(2),
                        icon: <Dna className="w-5 h-5" />,
                        color: "text-status-high",
                        bgColor: "bg-status-high/8",
                        borderColor: "border-status-high/15",
                      },
                      {
                        label: "Age Risk",
                        value: prediction.input_features.Age_Risk_Multiplier.toFixed(2),
                        icon: <Clock className="w-5 h-5" />,
                        color: "text-status-mod",
                        bgColor: "bg-status-mod/8",
                        borderColor: "border-status-mod/15",
                      },
                      {
                        label: "Baseline Risk",
                        value: prediction.input_features.Baseline_Risk.toFixed(4),
                        icon: <Target className="w-5 h-5" />,
                        color: "text-secondary",
                        bgColor: "bg-secondary/8",
                        borderColor: "border-secondary/15",
                      },
                    ].map((feat, idx) => (
                      <motion.div
                        key={feat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        className={`p-4 rounded-[16px] ${feat.bgColor} border ${feat.borderColor} flex flex-col`}
                      >
                        <div className={`${feat.color} mb-2`}>{feat.icon}</div>
                        <span className="text-xs text-text-secondary mb-1">{feat.label}</span>
                        <span className={`text-xl font-bold ${feat.color}`}>{feat.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Engineered Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="card"
                >
                  <h3 className="section-title mb-6">
                    <Brain className="w-5 h-5 text-primary" />
                    Engineered Features
                  </h3>
                  <p className="text-text-secondary text-sm mb-5">
                    Computed internally by the model pipeline for enhanced prediction accuracy.
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        label: "Composite Risk",
                        value: prediction.engineered_features.Composite_Risk,
                        formula: "BMI×0.3 + GR×0.3 + ARM×0.2 + BR×0.2",
                        bgColor: "bg-primary/5",
                        borderColor: "border-primary/15",
                      },
                      {
                        label: "BMI × Genetic",
                        value: prediction.engineered_features.BMI_Genetic,
                        formula: "BMI × Genetic_Risk",
                        bgColor: "bg-status-high/5",
                        borderColor: "border-status-high/15",
                      },
                      {
                        label: "Age × Baseline",
                        value: prediction.engineered_features.Age_Baseline,
                        formula: "Age_Risk_Multiplier × Baseline_Risk",
                        bgColor: "bg-status-mod/5",
                        borderColor: "border-status-mod/15",
                      },
                    ].map((feat, idx) => (
                      <motion.div
                        key={feat.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.1 }}
                        className={`p-4 rounded-[16px] ${feat.bgColor} border ${feat.borderColor}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text-primary text-sm">{feat.label}</span>
                          <span className="text-lg font-bold text-text-primary">{feat.value.toFixed(4)}</span>
                        </div>
                        <span className="text-xs text-text-secondary font-mono">{feat.formula}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="p-5 rounded-[20px] bg-accent/10 border border-accent/20 text-center"
              >
                <p className="text-text-secondary text-sm">
                  <strong className="text-text-primary">Disclaimer:</strong> This risk assessment is generated by a machine learning model
                  trained on health data and is intended for informational purposes only. It is <em>not</em> a medical
                  diagnosis. Please consult a healthcare professional for clinical advice.
                </p>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
