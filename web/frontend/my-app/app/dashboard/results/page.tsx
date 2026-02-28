"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Brain, RefreshCw, Activity, HeartPulse, Dna, Clock, Target, Sun, Moon } from "lucide-react";
import { type PredictionResult, profileToModelInput } from "@/components/predict/types";
import { useTheme } from "@/lib/theme-context";

const CIRCUMFERENCE = 2 * Math.PI * 70; // ring radius 70

/* ── Stagger ── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } },
};

function riskColor(cls: string) {
  const l = cls.toLowerCase();
  if (l === "low") return { color: "#0de5a8", bg: "rgba(13,229,168,0.12)", border: "rgba(13,229,168,0.3)", label: "low" };
  if (l === "high") return { color: "#ff607a", bg: "rgba(255,96,122,0.12)", border: "rgba(255,96,122,0.3)", label: "high" };
  return { color: "#ffb83f", bg: "rgba(255,184,63,0.12)", border: "rgba(255,184,63,0.3)", label: "medium" };
}

function riskMessage(cls: string) {
  const l = cls.toLowerCase();
  if (l === "low") return "Your health risk is low — keep up the great work!";
  if (l === "high") return "Elevated risk detected. Consider consulting your doctor.";
  return "Moderate risk range. Maintain healthy habits for continued wellness.";
}

export default function ResultsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, toggle } = useTheme();
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

  /* Ring animation */
  const riskInfo = useMemo(() => prediction ? riskColor(prediction.predicted_class) : null, [prediction]);
  const maxProb = useMemo(() => {
    if (!prediction) return 0;
    return Math.max(...Object.values(prediction.probabilities));
  }, [prediction]);
  const [ringOffset, setRingOffset] = useState(CIRCUMFERENCE);
  useEffect(() => {
    if (maxProb > 0) {
      const t = setTimeout(() => setRingOffset(CIRCUMFERENCE * (1 - maxProb / 100)), 200);
      return () => clearTimeout(t);
    }
  }, [maxProb]);

  /* Sorted probabilities */
  const sortedProbs = useMemo(() => {
    if (!prediction) return [];
    return Object.entries(prediction.probabilities).sort(([, a], [, b]) => b - a);
  }, [prediction]);

  if (profileLoading) return (
    <ProtectedRoute><div className="min-h-screen pb-20 flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--teal)" }} />
      <BottomNav />
    </div></ProtectedRoute>
  );

  if (!hasProfile()) return (
    <ProtectedRoute><div className="min-h-screen pb-20 flex items-center justify-center px-6" style={{ background: "var(--bg-base)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--warn-bg)", border: "2px solid var(--warn-border)" }}>
          <AlertTriangle className="w-8 h-8" style={{ color: "var(--warn-text)" }} />
        </div>
        <h2 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Profile Required</h2>
        <p style={{ color: "var(--text-body)", fontSize: "13px", marginBottom: "16px" }}>Complete your health profile first so we can analyze your risk factors.</p>
        <button onClick={() => router.push("/dashboard/profile/setup")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "12px", background: "var(--teal-bg)", border: "1px solid var(--border-accent)", color: "var(--teal)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
          Complete Profile
        </button>
      </motion.div>
      <BottomNav />
    </div></ProtectedRoute>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-base)" }}>

        {/* ── EKG Strip ── */}
        <div className="ekg-strip" aria-hidden="true">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* ── Top Bar ── */}
        <header className="prana-topbar">
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)", fontSize: "22px", fontWeight: 700, letterSpacing: "1px", background: "linear-gradient(135deg, var(--teal), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>
              Results
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={toggle} className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="results-hero">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="results-hero-inner">
            <span style={{ fontSize: "40px", display: "block", marginBottom: "6px" }}>🧬</span>
            <h1 className="results-hero-title">Health Risk Assessment</h1>
            <p className="results-hero-sub">AI-powered prediction from your health profile</p>
          </motion.div>
        </section>

        {/* ── Main Content ── */}
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="pb-6">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="result-error-box" style={{ margin: "12px 20px" }}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--danger-text, #ff607a)" }} />
                <div className="result-error-body">
                  <div className="result-error-title">Prediction Error</div>
                  <div className="result-error-desc">{error}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "6px" }}>
                    ML server: <code style={{ padding: "2px 6px", borderRadius: "6px", background: "var(--bg-card)", fontSize: "10px" }}>cd ml/static && python app.py</code>
                  </div>
                </div>
                <button onClick={runPrediction} className="result-retry-btn">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          {predicting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-4">
                <Brain className="w-12 h-12" style={{ color: "var(--teal)" }} />
              </motion.div>
              <h3 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Analyzing Your Health Data</h3>
              <p style={{ color: "var(--text-body)", fontSize: "13px" }}>Running ML model prediction…</p>
            </motion.div>
          )}

          {/* ── Results ── */}
          {prediction && !predicting && riskInfo && (
            <>
              {/* Risk Gauge Ring */}
              <motion.div variants={stagger.item} className="risk-gauge-wrap">
                <div className="risk-gauge-container">
                  <svg className="risk-gauge-svg" viewBox="0 0 180 180">
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={riskInfo.color} />
                        <stop offset="100%" stopColor={riskInfo.color} stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border)" strokeWidth="8" opacity="0.3" />
                    <circle cx="90" cy="90" r="70" fill="none" stroke="url(#riskGrad)" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 90 90)"
                      style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }} />
                    <circle cx="90" cy="90" r="56" fill="none" stroke={riskInfo.color} strokeWidth="0.5" opacity="0.15" strokeDasharray="3 6" />
                  </svg>
                  <div className="risk-gauge-inner">
                    <div className="risk-gauge-class" style={{ color: riskInfo.color }}>{prediction.predicted_class}</div>
                    <div className="risk-gauge-label">Risk Level</div>
                  </div>
                </div>
                <div className="risk-gauge-desc">{riskMessage(prediction.predicted_class)}</div>
                <button onClick={runPrediction} className="result-rerun-btn">
                  <RefreshCw className="w-3.5 h-3.5" /> Re-run Analysis
                </button>
              </motion.div>

              {/* Section: Probabilities */}
              <motion.div variants={stagger.item} className="dash-sec" style={{ padding: "0 20px", marginTop: "16px" }}>
                <div className="dash-sec-title"><Activity className="w-4 h-4" style={{ color: "var(--teal)", display: "inline", verticalAlign: "middle", marginRight: "6px" }} />Class <em>Probabilities</em></div>
              </motion.div>

              <motion.div variants={stagger.item} className="result-prob-section" style={{ marginTop: "8px" }}>
                <div className="result-prob-card">
                  {sortedProbs.map(([label, pct]) => {
                    const rc = riskColor(label);
                    const isMax = label === prediction.predicted_class;
                    return (
                      <div key={label} className="result-prob-row">
                        <span className="result-prob-label" style={isMax ? { color: rc.color } : {}}>{label}</span>
                        <div className="result-prob-bar-track">
                          <motion.div className={`result-prob-bar-fill ${rc.label}`}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                            style={{ opacity: isMax ? 1 : 0.5 }} />
                        </div>
                        <span className="result-prob-pct" style={{ color: isMax ? rc.color : "var(--text-muted)" }}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Section: Input Features */}
              <motion.div variants={stagger.item} className="dash-sec" style={{ padding: "0 20px", marginTop: "20px" }}>
                <div className="dash-sec-title"><Brain className="w-4 h-4" style={{ color: "var(--teal)", display: "inline", verticalAlign: "middle", marginRight: "6px" }} />Model <em>Inputs</em></div>
              </motion.div>

              <motion.div variants={stagger.item} className="result-features-grid" style={{ marginTop: "8px" }}>
                <div className="result-feature-card blue">
                  <div className="result-feature-icon" style={{ background: "rgba(74,158,255,0.12)", color: "#4a9eff" }}>
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div className="result-feature-label">BMI</div>
                  <div className="result-feature-value">{prediction.input_features.BMI.toFixed(1)}</div>
                </div>
                <div className="result-feature-card coral">
                  <div className="result-feature-icon" style={{ background: "rgba(255,96,122,0.12)", color: "#ff607a" }}>
                    <Dna className="w-5 h-5" />
                  </div>
                  <div className="result-feature-label">Genetic Risk</div>
                  <div className="result-feature-value">{prediction.input_features.Genetic_Risk.toFixed(2)}</div>
                </div>
                <div className="result-feature-card amber">
                  <div className="result-feature-icon" style={{ background: "rgba(255,184,63,0.12)", color: "#ffb83f" }}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="result-feature-label">Age Risk Multiplier</div>
                  <div className="result-feature-value">{prediction.input_features.Age_Risk_Multiplier.toFixed(2)}</div>
                </div>
                <div className="result-feature-card teal">
                  <div className="result-feature-icon" style={{ background: "rgba(13,229,168,0.12)", color: "#0de5a8" }}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="result-feature-label">Baseline Risk</div>
                  <div className="result-feature-value">{prediction.input_features.Baseline_Risk.toFixed(4)}</div>
                </div>
              </motion.div>

              {/* Section: Engineered Features */}
              <motion.div variants={stagger.item} className="dash-sec" style={{ padding: "0 20px", marginTop: "20px" }}>
                <div className="dash-sec-title">Engineered <em>Features</em></div>
                <div className="dash-sec-tag">ML Pipeline</div>
              </motion.div>

              <motion.div variants={stagger.item} className="result-eng-card" style={{ marginTop: "8px" }}>
                <div className="result-eng-row">
                  <div>
                    <div className="result-eng-label">Composite Risk</div>
                    <div className="result-eng-formula">BMI×0.3 + GR×0.3 + ARM×0.2 + BR×0.2</div>
                  </div>
                  <div className="result-eng-value">{prediction.engineered_features.Composite_Risk.toFixed(4)}</div>
                </div>
                <div className="result-eng-row">
                  <div>
                    <div className="result-eng-label">BMI × Genetic</div>
                    <div className="result-eng-formula">BMI × Genetic_Risk</div>
                  </div>
                  <div className="result-eng-value">{prediction.engineered_features.BMI_Genetic.toFixed(4)}</div>
                </div>
                <div className="result-eng-row">
                  <div>
                    <div className="result-eng-label">Age × Baseline</div>
                    <div className="result-eng-formula">Age_Risk_Multiplier × Baseline_Risk</div>
                  </div>
                  <div className="result-eng-value">{prediction.engineered_features.Age_Baseline.toFixed(4)}</div>
                </div>
              </motion.div>

              {/* Disclaimer */}
              <motion.div variants={stagger.item} className="result-disclaimer" style={{ marginTop: "20px" }}>
                <strong style={{ color: "var(--text-primary)" }}>Disclaimer:</strong> This assessment is for informational purposes only. Please consult a healthcare professional for clinical advice.
              </motion.div>

              {/* Mantra Banner */}
              <motion.div variants={stagger.item} className="mantra-banner" style={{ margin: "20px 20px 0" }}>
                <span className="mantra-symbol">ॐ</span>
                <div className="mantra-text">
                  &ldquo;Āyurvedaḥ amṛtānāṃ&rdquo;
                </div>
                <div className="mantra-trans-text">
                  Ayurveda is the science of longevity
                </div>
                <div className="mantra-src-text">— Charaka Saṃhitā</div>
              </motion.div>
            </>
          )}
        </motion.div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
