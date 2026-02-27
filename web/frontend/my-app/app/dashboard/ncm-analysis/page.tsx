"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

interface Prediction {
    state: string;
    probability: number;
    risk_level: "high" | "low";
}

interface NCMResult {
    features: {
        heart_rate: number;
        hrv_sdnn: number;
        stress_ratio: number;
        emg_rms: number;
    };
    predictions: {
        cardiac: Prediction;
        stress: Prediction;
        muscle: Prediction;
    };
    ncm_index: number;
    systemic_flag: string;
    risk_category: string;
    model_source: "ml" | "formula";
    data_summary?: {
        ecg_samples: number;
        eeg_samples: number;
        emg_samples: number;
        heart_rate_samples: number;
        entries_analyzed: number;
    };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SVG ICONS (matching project design system)
   ═══════════════════════════════════════════════════════════════════════════════ */

const Icons = {
    ecg: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 12h4l1.5-3 2 6 2-6 1.5 3h7" />
        </svg>
    ),
    eeg: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
            <path d="M10 21h4" />
            <path d="M9 9h1.5l1 2 1-4 1 2H15" />
        </svg>
    ),
    emg: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a3 3 0 00-3-3H9a3 3 0 00-3 3v2a8 8 0 004 6.93V20h4v-3.07A8 8 0 0018 10V8z" />
            <path d="M6 12h2l1.5-2 2 4 2-4 1.5 2h2" />
        </svg>
    ),
    heart: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
        </svg>
    ),
    shield: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    activity: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    arrowLeft: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    ),
    refresh: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
    ),
    brain: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
            <path d="M10 21h4" />
        </svg>
    ),
    muscle: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a3 3 0 00-3-3H9a3 3 0 00-3 3v2a8 8 0 004 6.93V20h4v-3.07A8 8 0 0018 10V8z" />
        </svg>
    ),
};

/* ═══════════════════════════════════════════════════════════════════════════════
   RISK COLORS (matching project design system)
   ═══════════════════════════════════════════════════════════════════════════════ */

const RISK_STYLES = {
    Low: {
        bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
        bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800",
        gradient: "from-emerald-400 to-emerald-600",
    },
    Moderate: {
        bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
        bar: "bg-amber-500", badge: "bg-amber-100 text-amber-800",
        gradient: "from-amber-400 to-amber-600",
    },
    High: {
        bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700",
        bar: "bg-orange-500", badge: "bg-orange-100 text-orange-800",
        gradient: "from-orange-400 to-orange-600",
    },
    Critical: {
        bg: "bg-red-50", border: "border-red-200", text: "text-red-700",
        bar: "bg-red-500", badge: "bg-red-100 text-red-800",
        gradient: "from-red-400 to-red-600",
    },
};

function getRiskStyle(category: string) {
    return RISK_STYLES[category as keyof typeof RISK_STYLES] || RISK_STYLES.Low;
}

function getPredictionStyle(riskLevel: string) {
    return riskLevel === "high" ? RISK_STYLES.High : RISK_STYLES.Low;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function Spinner({ size = "h-6 w-6" }: { size?: string }) {
    return (
        <svg className={`animate-spin ${size} text-current`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

/** Circular gauge for NCM Index (0-100) */
function NCMGauge({ value, category }: { value: number; category: string }) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / 100, 1);
    const offset = circumference * (1 - progress);
    const style = getRiskStyle(category);

    const gaugeColor =
        category === "Low" ? "#10b981" :
            category === "Moderate" ? "#f59e0b" :
                category === "High" ? "#f97316" : "#ef4444";

    return (
        <div className="relative w-56 h-56 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                {/* Background track */}
                <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="14" />
                {/* Filled arc */}
                <motion.circle
                    cx="100" cy="100" r={radius} fill="none"
                    stroke={gaugeColor} strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-4xl font-bold text-gray-900"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    {value.toFixed(1)}
                </motion.span>
                <span className="text-sm text-gray-500 font-medium mt-1">/ 100</span>
                <span className={`text-xs font-bold mt-2 px-3 py-1 rounded-full ${style.badge}`}>
                    {category === "Low" ? "Normal" : category}
                </span>
            </div>
        </div>
    );
}

/** Signal prediction card (ECG / EEG / EMG) */
function SignalCard({
    title,
    subtitle,
    icon,
    prediction,
    featureLabel,
    featureValue,
    featureUnit,
    delay = 0,
}: {
    title: string;
    subtitle: string;
    icon: (cls?: string) => React.ReactNode;
    prediction: Prediction;
    featureLabel: string;
    featureValue: string;
    featureUnit: string;
    delay?: number;
}) {
    const pStyle = getPredictionStyle(prediction.risk_level);
    const prob = prediction.probability * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`rounded-[20px] border-2 ${pStyle.border} ${pStyle.bg} p-6 flex flex-col gap-4`}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${pStyle.badge} flex items-center justify-center`}>
                        {icon("w-6 h-6")}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${pStyle.badge}`}>
                    {prediction.state}
                </span>
            </div>

            {/* Probability bar */}
            <div>
                <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-600">Risk Probability</span>
                    <span className={`text-sm font-bold ${pStyle.text}`}>{prob.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/80 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${pStyle.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${prob}%` }}
                        transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Feature value */}
            <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-500">{featureLabel}</span>
                <span className="ml-auto text-lg font-bold text-gray-800">{featureValue}</span>
                <span className="text-xs text-gray-400">{featureUnit}</span>
            </div>
        </motion.div>
    );
}

/** Systemic interpretation banner */
function SystemicBanner({ flag, ncmIndex }: { flag: string; ncmIndex: number }) {
    const isStable = flag === "Stable";
    const bgColor = isStable
        ? "bg-emerald-50 border-emerald-200"
        : "bg-red-50 border-red-200";
    const textColor = isStable ? "text-emerald-700" : "text-red-700";
    const iconColor = isStable ? "text-emerald-600" : "text-red-600";

    const advice = isStable
        ? "All biosignal systems appear coordinated. Continue maintaining your current health routine."
        : flag === "Autonomic Overload Risk"
            ? "Both cardiac and neural stress indicators are elevated. Consider stress-reduction activities and consult a healthcare professional if persistent."
            : flag === "Chronic Stress + Fatigue Risk"
                ? "Neural stress and muscle fatigue are both elevated. Prioritize rest, hydration, and recovery."
                : "An unusual pattern has been detected. Please consult with your healthcare provider.";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className={`rounded-[20px] border-2 ${bgColor} p-6`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isStable ? "bg-emerald-100" : "bg-red-100"}`}>
                    <span className={iconColor}>{Icons.shield("w-6 h-6")}</span>
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${textColor}`}>
                        Systemic Interpretation: {flag}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{advice}</p>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500">
                            NCM Fusion Index: <strong className="text-gray-700">{ncmIndex.toFixed(1)}/100</strong>
                        </span>
                        <span className="text-xs text-gray-400">
                            Weights: ECG 40% · EEG 35% · EMG 25%
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

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
        <div className="min-h-screen bg-background flex flex-col">
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
                        {Icons.refresh("w-4 h-4")}
                        Re-analyze
                    </button>
                )}
            </header>

            {/* ── Content ── */}
            <main className="flex-1 overflow-auto px-6 sm:px-8 py-8">
                <AnimatePresence mode="wait">
                    {/* ── Initial State ── */}
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

                            <div className="text-center max-w-lg">
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                    NCM Health Analysis
                                </h2>
                                <p className="text-gray-500 text-lg leading-relaxed">
                                    Analyze your ECG, EEG, and EMG data using machine learning to assess
                                    cardiac risk, neural stress, and muscle fatigue in one unified report.
                                </p>
                            </div>

                            {/* Signal cards preview */}
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

                            <button
                                onClick={runAnalysis}
                                className="w-full max-w-lg py-4 rounded-2xl bg-primary hover:bg-secondary text-white font-bold text-lg tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99]"
                            >
                                Analyze ECG · EEG · EMG
                            </button>

                            <p className="text-xs text-gray-400 text-center max-w-md">
                                Data is fetched from your uploaded health records stored in the database.
                                Make sure you have uploaded ECG, EEG, and EMG data from the Dynamic Dashboard first.
                            </p>
                        </motion.div>
                    )}

                    {/* ── Loading State ── */}
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
                        >
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

                    {/* ── Error State ── */}
                    {error && !loading && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
                        >
                            <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-500">
                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-800">Analysis Failed</p>
                                <p className="text-sm text-red-500 mt-2 max-w-md">{error}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={runAnalysis}
                                    className="px-6 py-3 rounded-2xl bg-primary text-white font-medium hover:bg-secondary transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => router.push("/dynamic")}
                                    className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Upload Data First
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Results ── */}
                    {result && !loading && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="max-w-5xl mx-auto flex flex-col gap-6"
                        >
                            {/* NCM Index Gauge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="card flex flex-col items-center gap-4 py-8"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-6 rounded-full bg-primary" />
                                    <h2 className="text-xl font-bold text-gray-900">NCM Health Index</h2>
                                </div>
                                <NCMGauge value={result.ncm_index} category={result.risk_category} />
                                <p className="text-sm text-gray-500 text-center max-w-md">
                                    Composite score fusing cardiac (40%), neural stress (35%), and
                                    muscle fatigue (25%) indicators. Lower is healthier.
                                </p>
                                {result.model_source === "ml" && (
                                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-violet-100 text-violet-700">
                                        ML Model Prediction
                                    </span>
                                )}
                                {result.model_source === "formula" && (
                                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                                        Formula-Based Analysis (ML server offline)
                                    </span>
                                )}
                            </motion.div>

                            {/* Signal Cards */}
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 rounded-full bg-primary" />
                                <h2 className="text-xl font-bold text-gray-900">Signal Analysis</h2>
                            </div>

                            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                                <SignalCard
                                    title="ECG — Cardiac"
                                    subtitle="Heart rhythm & variability"
                                    icon={Icons.ecg}
                                    prediction={result.predictions.cardiac}
                                    featureLabel="Heart Rate"
                                    featureValue={result.features.heart_rate.toFixed(1)}
                                    featureUnit="bpm"
                                    delay={0.2}
                                />
                                <SignalCard
                                    title="EEG — Neural"
                                    subtitle="Brain stress indicators"
                                    icon={Icons.eeg}
                                    prediction={result.predictions.stress}
                                    featureLabel="Stress Ratio"
                                    featureValue={result.features.stress_ratio.toFixed(2)}
                                    featureUnit="β/α"
                                    delay={0.35}
                                />
                                <SignalCard
                                    title="EMG — Muscular"
                                    subtitle="Muscle fatigue detection"
                                    icon={Icons.emg}
                                    prediction={result.predictions.muscle}
                                    featureLabel="EMG RMS"
                                    featureValue={result.features.emg_rms.toFixed(3)}
                                    featureUnit="mV"
                                    delay={0.5}
                                />
                            </div>

                            {/* Systemic Interpretation */}
                            <SystemicBanner
                                flag={result.systemic_flag}
                                ncmIndex={result.ncm_index}
                            />

                            {/* Data Summary */}
                            {result.data_summary && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 1 }}
                                    className="card"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-6 rounded-full bg-primary" />
                                        <h3 className="font-bold text-gray-900">Data Summary</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            { label: "ECG Samples", value: result.data_summary.ecg_samples, icon: Icons.ecg },
                                            { label: "EEG Samples", value: result.data_summary.eeg_samples, icon: Icons.eeg },
                                            { label: "EMG Samples", value: result.data_summary.emg_samples, icon: Icons.emg },
                                            { label: "HR Samples", value: result.data_summary.heart_rate_samples, icon: Icons.heart },
                                        ].map((d) => (
                                            <div key={d.label} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                                                <span className="text-gray-400">{d.icon("w-5 h-5")}</span>
                                                <div>
                                                    <p className="text-xs text-gray-500">{d.label}</p>
                                                    <p className="text-lg font-bold text-gray-800">{d.value.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        Analyzed {result.data_summary.entries_analyzed} database {result.data_summary.entries_analyzed === 1 ? "entry" : "entries"} ·
                                        HRV SDNN: {result.features.hrv_sdnn.toFixed(1)} ms
                                    </p>
                                </motion.div>
                            )}

                            {/* Feature Details Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1.1 }}
                                className="card"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 rounded-full bg-primary" />
                                    <h3 className="font-bold text-gray-900">Computed Features</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-2 px-3 text-gray-500 font-medium">Feature</th>
                                                <th className="text-right py-2 px-3 text-gray-500 font-medium">Value</th>
                                                <th className="text-left py-2 px-3 text-gray-500 font-medium">Unit</th>
                                                <th className="text-left py-2 px-3 text-gray-500 font-medium">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { name: "Heart Rate", val: result.features.heart_rate.toFixed(1), unit: "bpm", desc: "Mean resting heart rate from ECG/HR data" },
                                                { name: "HRV SDNN", val: result.features.hrv_sdnn.toFixed(1), unit: "ms", desc: "Standard deviation of R-R intervals (autonomic health)" },
                                                { name: "Stress Ratio", val: result.features.stress_ratio.toFixed(3), unit: "β/α", desc: "Beta-to-alpha EEG power ratio (cognitive stress)" },
                                                { name: "EMG RMS", val: result.features.emg_rms.toFixed(4), unit: "mV", desc: "Root mean square of EMG signal (muscle activation)" },
                                            ].map((f) => (
                                                <tr key={f.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                    <td className="py-3 px-3 font-medium text-gray-800">{f.name}</td>
                                                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">{f.val}</td>
                                                    <td className="py-3 px-3 text-gray-500">{f.unit}</td>
                                                    <td className="py-3 px-3 text-gray-400 text-xs">{f.desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
