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
} from "lucide-react";

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
  // Baseline_Risk: compute from conditions + lifestyle (0.05 to 0.6 range)
  let baselineRisk = 0.05;

  // Conditions add risk
  const highRiskConditions = ["Heart Disease", "Diabetes", "Cancer", "Kidney Disease"];
  const medRiskConditions = ["Hypertension", "Thyroid", "Liver Disease", "Asthma"];

  for (const cond of profile.existingConditions) {
    if (highRiskConditions.includes(cond)) baselineRisk += 0.1;
    else if (medRiskConditions.includes(cond)) baselineRisk += 0.05;
  }

  // Family history adds risk
  if (profile.familyHistory && profile.familyHistory.toLowerCase() !== "none" && profile.familyHistory.trim() !== "") {
    baselineRisk += 0.08;
  }

  // Smoking adds risk
  if (profile.smokingStatus === "current") baselineRisk += 0.1;
  else if (profile.smokingStatus === "former") baselineRisk += 0.04;

  // Alcohol adds risk
  if (profile.alcoholUse === "heavy") baselineRisk += 0.08;
  else if (profile.alcoholUse === "moderate") baselineRisk += 0.04;
  else if (profile.alcoholUse === "occasional") baselineRisk += 0.01;

  // Clamp
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
      const modelInput = profileToModelInput(profile);
      console.log("[Results] Model input:", modelInput);

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
      console.log("[Results] Prediction result:", result);
      setPrediction(result);
    } catch (err) {
      console.error("[Results] Prediction error:", err);
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  // Auto-predict when profile loads
  useEffect(() => {
    if (profile && !prediction && !predicting) {
      runPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleTabChange = (tab: "dashboard" | "profile" | "results") => {
    if (tab === "dashboard") router.push("/dashboard");
    else if (tab === "profile") router.push("/dashboard/profile");
    // results = current page
  };

  // Loading state
  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar activeTab="results" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-text-secondary">Loading your health data...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // No profile state
  if (!hasProfile()) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar activeTab="results" onTabChange={handleTabChange} />
          <div className="flex items-center justify-center h-[calc(100vh-80px)] px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 rounded-full bg-status-mod/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-status-mod" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Profile Required</h2>
              <p className="text-text-secondary mb-6">
                Complete your health profile first so we can analyze your risk factors.
              </p>
              <button
                onClick={() => router.push("/dashboard/profile/setup")}
                className="btn-primary"
              >
                Complete Profile
              </button>
            </motion.div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const riskColors = prediction ? getRiskColor(prediction.predicted_class) : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar activeTab="results" onTabChange={handleTabChange} />

        <main className="max-w-6xl mx-auto px-6 py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Health Risk Assessment
            </h1>
            <p className="text-text-secondary text-lg">
              AI-powered risk prediction based on your health profile
            </p>
          </motion.div>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 p-5 rounded-[20px] bg-status-high/10 border border-status-high/30 flex items-start gap-4"
              >
                <AlertTriangle className="w-6 h-6 text-status-high flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-status-high font-medium mb-1">Prediction Error</p>
                  <p className="text-text-secondary text-sm">{error}</p>
                  <p className="text-text-secondary text-xs mt-2">
                    Make sure the ML server is running: <code className="bg-card px-2 py-0.5 rounded text-xs">cd ml/static && python app.py</code>
                  </p>
                </div>
                <button
                  onClick={runPrediction}
                  className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-status-high/20 text-status-high hover:bg-status-high/30 transition-colors text-sm font-medium"
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
                className="mb-6"
              >
                <Brain className="w-16 h-16 text-primary" />
              </motion.div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Analyzing Your Health Data</h3>
              <p className="text-text-secondary">Running ML model prediction...</p>
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
                className={`relative overflow-hidden rounded-[28px] p-8 md:p-10 border ${riskColors?.border}/30 bg-gradient-to-br from-card to-card/80 shadow-lg`}
              >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-transparent ${riskColors?.bg}/5 -z-0 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  {/* Risk Icon & Level */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      className={`w-28 h-28 rounded-full ${riskColors?.bg}/20 flex items-center justify-center border-2 ${riskColors?.border}/40 mb-4`}
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
                    <p className="text-text-secondary leading-relaxed">
                      This assessment is based on your BMI, genetic risk factors, age-adjusted risk,
                      and baseline health indicators analyzed by our Random Forest ML model.
                    </p>
                    <button
                      onClick={runPrediction}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
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
                <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
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
                            <span className={`font-medium ${isMax ? colors.text : "text-text-primary"} flex items-center gap-2`}>
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
                              className={`h-full rounded-full ${colors.bg} ${isMax ? "shadow-sm" : "opacity-60"}`}
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
                  <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
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
                        bgColor: "bg-primary/10",
                        borderColor: "border-primary/20",
                      },
                      {
                        label: "Genetic Risk",
                        value: prediction.input_features.Genetic_Risk.toFixed(2),
                        icon: <Dna className="w-5 h-5" />,
                        color: "text-status-high",
                        bgColor: "bg-status-high/10",
                        borderColor: "border-status-high/20",
                      },
                      {
                        label: "Age Risk Multiplier",
                        value: prediction.input_features.Age_Risk_Multiplier.toFixed(2),
                        icon: <Clock className="w-5 h-5" />,
                        color: "text-status-mod",
                        bgColor: "bg-status-mod/10",
                        borderColor: "border-status-mod/20",
                      },
                      {
                        label: "Baseline Risk",
                        value: prediction.input_features.Baseline_Risk.toFixed(4),
                        icon: <Target className="w-5 h-5" />,
                        color: "text-secondary",
                        bgColor: "bg-secondary/10",
                        borderColor: "border-secondary/20",
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
                  <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Engineered Features
                  </h3>
                  <p className="text-text-secondary text-sm mb-5">
                    These features are computed internally by the model pipeline for enhanced prediction accuracy.
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        label: "Composite Risk",
                        value: prediction.engineered_features.Composite_Risk,
                        formula: "BMI×0.3 + GR×0.3 + ARM×0.2 + BR×0.2",
                        color: "from-primary/20 to-accent/20",
                        borderColor: "border-primary/20",
                      },
                      {
                        label: "BMI × Genetic",
                        value: prediction.engineered_features.BMI_Genetic,
                        formula: "BMI × Genetic_Risk",
                        color: "from-status-high/20 to-status-mod/20",
                        borderColor: "border-status-high/20",
                      },
                      {
                        label: "Age × Baseline",
                        value: prediction.engineered_features.Age_Baseline,
                        formula: "Age_Risk_Multiplier × Baseline_Risk",
                        color: "from-status-mod/20 to-status-low/20",
                        borderColor: "border-status-mod/20",
                      },
                    ].map((feat, idx) => (
                      <motion.div
                        key={feat.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + idx * 0.1 }}
                        className={`p-4 rounded-[16px] bg-gradient-to-r ${feat.color} border ${feat.borderColor}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text-primary">{feat.label}</span>
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
