"use client";

import { useCallback, useRef, useState } from "react";
import {
    AnalysisResult,
    generateAutoSyncData,
    OverallAssessment,
    ParameterMetrics,
    parseCSVColumns,
    parseCSVtoNumbers,
    processAllParameters,
} from "./healthEngine";

// ─── Parameter Definitions ────────────────────────────────────────────────────

interface ParamCard {
    key: string;          // engine key(s) driver
    label: string;
    unit: string;
    icon: string;
    optional?: boolean;
    isBP?: boolean;       // Blood Pressure requires two-column CSV
    isInput?: boolean;    // Direct number input instead of CSV
}

const LOW_FREQ: ParamCard[] = [
    { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: "🩸" },
    { key: "heart_rate", label: "Heart Rate", unit: "bpm", icon: "❤️" },
    { key: "glucose", label: "Blood Glucose", unit: "mg/dL", icon: "🍬" },
    { key: "spo2", label: "SpO₂", unit: "%", icon: "🫁" },
    { key: "sleep", label: "Sleep", unit: "hrs", icon: "😴", isInput: true },
    { key: "steps", label: "Steps", unit: "steps", icon: "👟", isInput: true },
];

const HI_FREQ: ParamCard[] = [
    { key: "eeg", label: "EEG Derived", unit: "μV", icon: "🧠", optional: true },
    { key: "emg", label: "EMG Derived", unit: "mV", icon: "💪", optional: true },
    { key: "ecg", label: "ECG Metrics", unit: "ms", icon: "📈", optional: true },
];

const ALL_PARAMS = [...LOW_FREQ, ...HI_FREQ];

// ─── Result display meta (maps engine key → display config) ──────────────────

const DISPLAY: Record<string, { label: string; unit: string; icon: string }> = {
    blood_pressure: { label: "Blood Pressure", unit: "mmHg", icon: "🩸" },
    heart_rate: { label: "Heart Rate", unit: "bpm", icon: "❤️" },
    glucose: { label: "Blood Glucose", unit: "mg/dL", icon: "🍬" },
    spo2: { label: "SpO₂", unit: "%", icon: "🫁" },
    sleep: { label: "Sleep", unit: "hrs", icon: "😴" },
    steps: { label: "Steps", unit: "steps", icon: "👟" },
    eeg: { label: "EEG Derived", unit: "μV", icon: "🧠" },
    emg: { label: "EMG Derived", unit: "mV", icon: "💪" },
    ecg: { label: "ECG Metrics", unit: "ms", icon: "📈" },
};

// Ordered list for the results panel
const RESULT_ORDER = [
    "blood_pressure",
    "heart_rate",
    "glucose",
    "spo2",
    "sleep",
    "steps",
    "eeg",
    "emg",
    "ecg",
];

// ─── Risk helpers ─────────────────────────────────────────────────────────────

type RiskLvl = "low" | "moderate" | "high" | "critical";

function riskLevel(s: number): RiskLvl {
    if (s < 0.25) return "low";
    if (s < 0.50) return "moderate";
    if (s < 0.75) return "high";
    return "critical";
}

const RISK = {
    low: { bar: "#22c55e", badge: "bg-emerald-100 text-emerald-700 border-emerald-300", text: "text-emerald-700", card: "border-emerald-200 bg-emerald-50/60" },
    moderate: { bar: "#f59e0b", badge: "bg-amber-100 text-amber-700 border-amber-300", text: "text-amber-700", card: "border-amber-200 bg-amber-50/60" },
    high: { bar: "#f97316", badge: "bg-orange-100 text-orange-700 border-orange-300", text: "text-orange-700", card: "border-orange-200 bg-orange-50/60" },
    critical: { bar: "#ef4444", badge: "bg-red-100 text-red-700 border-red-300", text: "text-red-700", card: "border-red-200 bg-red-50/60" },
};

const CAT_BADGE: Record<string, string> = {
    Low: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Moderate: "bg-amber-100   text-amber-700   border-amber-300",
    High: "bg-orange-100  text-orange-700  border-orange-300",
    Critical: "bg-red-100     text-red-700     border-red-300",
};

function f(v: number, d = 2) { return v.toFixed(d); }

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBar({ score }: { score: number }) {
    const pct = Math.min(score * 100, 100);
    return (
        <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: RISK[riskLevel(score)].bar }} />
        </div>
    );
}

/** Single parameter metric card */
function MetricCard({ eKey, m }: { eKey: string; m: ParameterMetrics }) {
    const d = DISPLAY[eKey] ?? { label: eKey, unit: "", icon: "📊" };
    const lvl = riskLevel(m.riskScore);
    const st = RISK[lvl];
    return (
        <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${st.card}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{d.icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{d.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${st.badge}`}>
                    {f(m.riskScore * 100, 0)}% risk
                </span>
            </div>
            <RiskBar score={m.riskScore} />
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-500">Mean</span>
                <span className="text-right font-mono text-gray-800">{f(m.mean)} <span className="text-gray-400 text-[10px]">{d.unit}</span></span>
                <span className="text-gray-500">Slope</span>
                <span className={`text-right font-mono font-semibold ${m.slope > 0 ? "text-red-500" : m.slope < 0 ? "text-emerald-600" : "text-gray-500"}`}>
                    {m.slope > 0 ? "▲" : m.slope < 0 ? "▼" : "─"} {f(Math.abs(m.slope), 3)}/day
                </span>
                <span className="text-gray-500">% Change</span>
                <span className={`text-right font-mono ${m.percentChange > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {m.percentChange >= 0 ? "+" : ""}{f(m.percentChange)}%
                </span>
                <span className="text-gray-500">Instability</span>
                <span className="text-right font-mono text-gray-700">{f(m.instabilityIndex * 100, 1)}%</span>
                <span className="text-gray-500">Samples</span>
                <span className="text-right font-mono text-gray-600">{m.sampleCount}</span>
            </div>
        </div>
    );
}

/**
 * Blood Pressure card — merges systolic_bp + diastolic_bp into one card.
 * Averaged risk score; shows both sub-values.
 */
function BPMetricCard({ sys, dia }: { sys: ParameterMetrics; dia: ParameterMetrics }) {
    const avgRisk = (sys.riskScore + dia.riskScore) / 2;
    const lvl = riskLevel(avgRisk);
    const st = RISK[lvl];
    return (
        <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${st.card}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🩸</span>
                    <span className="text-sm font-semibold text-gray-800">Blood Pressure</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${st.badge}`}>
                    {f(avgRisk * 100, 0)}% risk
                </span>
            </div>
            <RiskBar score={avgRisk} />
            {/* Systolic row */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <span className="text-gray-400 font-semibold col-span-2 text-[10px] uppercase tracking-wider mt-0.5">Systolic</span>
                <span className="text-gray-500">Mean</span>
                <span className="text-right font-mono text-gray-800">{f(sys.mean)} <span className="text-gray-400 text-[10px]">mmHg</span></span>
                <span className="text-gray-500">Slope</span>
                <span className={`text-right font-mono font-semibold ${sys.slope > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {sys.slope > 0 ? "▲" : "▼"} {f(Math.abs(sys.slope), 3)}/day
                </span>
                {/* Diastolic row */}
                <span className="text-gray-400 font-semibold col-span-2 text-[10px] uppercase tracking-wider mt-1">Diastolic</span>
                <span className="text-gray-500">Mean</span>
                <span className="text-right font-mono text-gray-800">{f(dia.mean)} <span className="text-gray-400 text-[10px]">mmHg</span></span>
                <span className="text-gray-500">Slope</span>
                <span className={`text-right font-mono font-semibold ${dia.slope > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {dia.slope > 0 ? "▲" : "▼"} {f(Math.abs(dia.slope), 3)}/day
                </span>
                <span className="text-gray-500">Samples</span>
                <span className="text-right font-mono text-gray-600">{sys.sampleCount}</span>
            </div>
        </div>
    );
}

function OverallBanner({ oa }: { oa: OverallAssessment }) {
    const pct = Math.min(oa.overallRisk * 100, 100);
    const lvl = riskLevel(oa.overallRisk);
    const color = RISK[lvl].bar;
    const dash = `${pct} ${100 - pct}`;
    const highLabel = DISPLAY[oa.highestRiskParameter]?.label ?? oa.highestRiskParameter;

    return (
        <div className="flex items-center gap-6 rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4">
            {/* Donut */}
            <div className="relative flex-shrink-0 w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={color}
                        strokeWidth="4" strokeDasharray={dash} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-gray-900">{pct.toFixed(0)}%</span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">risk</span>
                </div>
            </div>
            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Category</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${CAT_BADGE[oa.riskCategory]}`}>
                        {oa.riskCategory}
                    </span>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Overall Risk</p>
                    <p className="text-sm font-bold text-gray-800">{f(oa.overallRisk * 100, 1)}%</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Instability</p>
                    <p className="text-sm font-bold text-gray-800">{f(oa.overallInstability * 100, 1)}%</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Highest Risk</p>
                    <p className="text-sm font-bold text-red-600 truncate">{highLabel}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Upload Row (one parameter) ───────────────────────────────────────────────

interface UploadRowProps {
    cfg: ParamCard;
    csvFile: File | null;
    imgFile: File | null;
    status: "idle" | "ok" | "err";
    onCsv: (f: File | null) => void;
    onImg: (f: File | null) => void;
    inputValue?: string;
    onInputChange?: (v: string) => void;
}

function UploadRow({ cfg, csvFile, imgFile, status, onCsv, onImg, inputValue, onInputChange }: UploadRowProps) {
    const csvRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLInputElement>(null);

    const rowBg =
        status === "ok" ? "bg-emerald-50 border-emerald-300" :
            status === "err" ? "bg-red-50 border-red-300" :
                "bg-white border-gray-200";

    return (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${rowBg}`}>
            {/* Icon + label */}
            <span className="text-xl flex-shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                    {cfg.label}
                    {cfg.optional && <span className="ml-1 text-[10px] text-gray-400">(optional)</span>}
                </p>
                <p className="text-[10px] text-gray-400">
                    {cfg.unit}
                    {cfg.isBP && " · CSV col 1 = systolic, col 2 = diastolic"}
                </p>
            </div>

            {/* Status badge */}
            <div className="flex-shrink-0 w-14 text-center">
                {status === "ok" && <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>}
                {status === "err" && <span className="text-[10px] text-red-500 font-bold">⚠ Error</span>}
            </div>

            {/* Input logic */}
            {cfg.isInput ? (
                <div className="flex-shrink-0 flex items-center gap-2">
                    <input
                        type="number"
                        value={inputValue ?? ""}
                        onChange={(e) => onInputChange?.(e.target.value)}
                        placeholder={`Enter ${cfg.label}...`}
                        className="w-32 h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:border-blue-300 focus:bg-white focus:outline-none transition-all"
                    />
                </div>
            ) : (
                <>
                    {/* CSV upload */}
                    <button
                        onClick={() => csvRef.current?.click()}
                        className={`flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${csvFile ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                    >
                        📄 {csvFile ? csvFile.name.length > 14 ? csvFile.name.slice(0, 14) + "…" : csvFile.name : "CSV / Excel"}
                    </button>
                    <input ref={csvRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt"
                        onChange={e => onCsv(e.target.files?.[0] ?? null)} />
                </>
            )}

            {/* Image upload (only for non-input parameters) */}
            {!cfg.isInput && (
                <>
                    <button
                        onClick={() => imgRef.current?.click()}
                        className={`flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${imgFile ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-purple-300 hover:bg-purple-50"
                            }`}
                    >
                        🖼️ {imgFile ? imgFile.name.length > 10 ? imgFile.name.slice(0, 10) + "…" : imgFile.name : "Image"}
                    </button>
                    <input ref={imgRef} type="file" className="hidden" accept="image/*"
                        onChange={e => onImg(e.target.files?.[0] ?? null)} />
                </>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Mode = "manual" | "autosync";
type View = "form" | "results";
type FS = { csv: File | null; img: File | null; status: "idle" | "ok" | "err" };

export default function HealthDashboard() {
    const [mode, setMode] = useState<Mode>("manual");
    const [view, setView] = useState<View>("form");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [autoProgress, setAutoProgress] = useState(0);

    const [files, setFiles] = useState<Record<string, FS & { inputValue?: string }>>(() =>
        Object.fromEntries(ALL_PARAMS.map(p => [p.key, { csv: null, img: null, status: "idle" as const, inputValue: "" }]))
    );

    const setParamFile = useCallback((key: string, field: "csv" | "img" | "inputValue", val: File | string | null) => {
        setFiles(prev => ({ ...prev, [key]: { ...prev[key], [field]: val, status: "idle" } }));
    }, []);

    // ── Analyse (manual) ────────────────────────────────────────────────────────
    const handleAnalyze = useCallback(async () => {
        setLoading(true);
        const data: Record<string, number[]> = {};
        const updated = { ...files };

        for (const p of ALL_PARAMS) {
            const state = files[p.key];

            if (p.isInput) {
                if (state.inputValue && !isNaN(parseFloat(state.inputValue))) {
                    data[p.key] = [parseFloat(state.inputValue)];
                    updated[p.key] = { ...state, status: "ok" };
                }
                continue;
            }

            if (!state.csv) continue;
            try {
                const text = await state.csv.text();
                const nums = parseCSVtoNumbers(text);
                if (nums.length === 0) throw new Error("empty");
                data[p.key] = nums;
                updated[p.key] = { ...state, status: "ok" };
            } catch {
                updated[p.key] = { ...state, status: "err" };
            }
        }

        setFiles(updated);
        const hasData = Object.keys(data).length > 0;

        if (hasData) {
            try {
                // Add artificial processing delay
                await new Promise(r => setTimeout(r, 2000));

                const response = await fetch('/api/health-analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) throw new Error('Failed to save analysis');

                const resultData = await response.json();
                setResult(resultData);
                setView("results");
            } catch (err: any) {
                console.error(err);
                alert("Error during analysis: " + err.message);
            }
        }
        setLoading(false);
    }, [files]);

    // ── Auto sync ───────────────────────────────────────────────────────────────
    const handleAutoSync = useCallback(async () => {
        setLoading(true);
        setAutoProgress(0);
        let step = 0;
        const iv = setInterval(() => {
            step += 5;
            setAutoProgress(Math.min(step, 100));
            if (step >= 100) clearInterval(iv);
        }, 100);

        try {
            const response = await fetch('/api/health-analyze');
            if (!response.ok) throw new Error('No previous data found. Please run a Manual Analysis first to populate the database.');

            const resultData = await response.json();

            // Wait for progress bar to finish
            await new Promise(r => setTimeout(r, 2200));

            setResult(resultData);
            setView("results");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleBack = () => {
        setView("form");
        setResult(null);
        setAutoProgress(0);
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setView("form");
        setResult(null);
        setAutoProgress(0);
    };

    const anyReady = ALL_PARAMS.some(p =>
        (p.isInput && files[p.key].inputValue) || (!p.isInput && files[p.key].csv !== null)
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div
            className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col"
            style={{ fontFamily: "'Inter', 'Geist Sans', Arial, sans-serif" }}
        >
            {/* ══ Header ══════════════════════════════════════════════════════════ */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 h-14 px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-base">🏥</div>
                    <div>
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Dhanvantari</span>
                        <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-widest hidden sm:inline">
                            Preventive Health Monitor · Phase 1
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mode toggle */}
                    {view === "form" && (
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            {(["manual", "autosync"] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === m
                                        ? "bg-white shadow text-blue-700 border border-blue-200"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {m === "manual" ? "✏️ Manual" : "⚡ Auto Sync"}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Back button on results */}
                    {view === "results" && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                        >
                            ← New Analysis
                        </button>
                    )}

                    {result && view === "results" && (
                        <span className="text-[10px] text-gray-400 hidden md:block">
                            {new Date(result.timestamp).toLocaleString()}
                        </span>
                    )}
                </div>
            </header>

            {/* ══ FORM VIEW ═══════════════════════════════════════════════════════ */}
            {view === "form" && (
                <div className="flex-1 overflow-hidden flex flex-col">

                    {/* ── MANUAL ── */}
                    {mode === "manual" && (
                        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-3">
                            {/* Low-frequency */}
                            <div className="flex-1 flex flex-col gap-2 min-h-0">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Low-Frequency Dynamic Data · Collected Daily
                                </p>
                                <div className="flex-1 flex flex-col gap-2 min-h-0">
                                    {LOW_FREQ.map(cfg => (
                                        <UploadRow key={cfg.key} cfg={cfg}
                                            csvFile={files[cfg.key].csv} imgFile={files[cfg.key].img}
                                            status={files[cfg.key].status}
                                            onCsv={f => setParamFile(cfg.key, "csv", f)}
                                            onImg={f => setParamFile(cfg.key, "img", f)}
                                            inputValue={files[cfg.key].inputValue}
                                            onInputChange={v => setParamFile(cfg.key, "inputValue", v)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* High-frequency */}
                            <div className="flex flex-col gap-2">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    High-Frequency Dynamic Data · Advanced (Optional)
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {HI_FREQ.map(cfg => (
                                        <UploadRow key={cfg.key} cfg={cfg}
                                            csvFile={files[cfg.key].csv} imgFile={files[cfg.key].img}
                                            status={files[cfg.key].status}
                                            onCsv={f => setParamFile(cfg.key, "csv", f)}
                                            onImg={f => setParamFile(cfg.key, "img", f)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Analyse button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !anyReady}
                                className={`flex-shrink-0 w-full py-3 rounded-2xl text-sm font-extrabold tracking-wide transition-all ${!loading && anyReady
                                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-[0.99]"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Analysing…
                                    </span>
                                ) : !anyReady
                                    ? "Upload at least one CSV to Analyse"
                                    : "📊 Analyse Health Data"
                                }
                            </button>
                        </div>
                    )}

                    {/* ── AUTO SYNC ── */}
                    {mode === "autosync" && (
                        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-3xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-4xl mx-auto mb-4">⚡</div>
                                <h2 className="text-xl font-bold text-gray-800">Auto Sync Mode</h2>
                                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                    Fetches <strong>all stored entries</strong> from the database, merges every data point per parameter, and re-runs the full risk analysis on the complete dataset.
                                </p>
                            </div>

                            {/* Parameter grid preview */}
                            <div className="w-full max-w-2xl grid grid-cols-5 gap-2">
                                {ALL_PARAMS.map(p => (
                                    <div key={p.key}
                                        className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-center transition-all ${loading ? "border-blue-200 bg-blue-50 animate-pulse" : "border-gray-200 bg-white"
                                            }`}
                                    >
                                        <span className="text-xl">{p.icon}</span>
                                        <span className="text-[10px] font-medium text-gray-600 leading-tight">{p.label}</span>
                                        {p.optional && <span className="text-[8px] text-gray-400">optional</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Progress */}
                            {loading && (
                                <div className="w-full max-w-md">
                                    <div className="flex justify-between mb-1.5 text-xs text-gray-500">
                                        <span>Syncing & computing…</span>
                                        <span className="font-mono text-blue-600">{autoProgress}%</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${autoProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleAutoSync}
                                disabled={loading}
                                className="w-full max-w-md py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm tracking-wide shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Syncing…" : "⚡ Start Auto Sync"}
                            </button>

                            {/* Formula note */}
                            <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-4 text-[10px] text-gray-500 leading-5 grid grid-cols-2 gap-x-4">
                                <div>
                                    <p className="font-semibold text-gray-600 mb-1">Formulas used</p>
                                    <p>Mean = (1/n) Σ Xᵢ</p>
                                    <p>Slope = (nΣtᵢXᵢ − ΣtᵢΣXᵢ) / (nΣtᵢ² − (Σtᵢ)²)</p>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                    <p className="font-semibold text-gray-600 mb-1 sm:invisible">.</p>
                                    <p>%Δ = ((Last − First) / |First|) × 100</p>
                                    <p>Var = (1/n) Σ(Xᵢ − Mean)²</p>
                                    <p>Risk = base + instability + trendBoost ∈ [0,1]</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══ RESULTS VIEW ════════════════════════════════════════════════════ */}
            {view === "results" && result && (
                <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
                    {/* Overall banner */}
                    <OverallBanner oa={result.overall} />

                    {/* Parameter metric cards — only specified params, in order */}
                    <div className="flex-1 overflow-hidden">
                        <div className="h-full grid gap-3"
                            style={{
                                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                alignContent: "start",
                            }}
                        >
                            {RESULT_ORDER.map((id) => {
                                const m = result.metrics[id];
                                if (!m) return null;
                                return <MetricCard key={id} eKey={id} m={m} />;
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay for Manual Mode */}
            {loading && view === "form" && mode === "manual" && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">
                            Syncing with Database & Analyzing…
                        </p>
                        <p className="text-[10px] text-gray-400">Processing formula-based risks...</p>
                    </div>
                </div>
            )}

            {/* Loading overlay for Auto Sync */}
            {loading && view === "form" && mode === "autosync" && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">
                            Fetching All Entries from Database…
                        </p>
                        <p className="text-[10px] text-gray-400">Merging & analyzing all data from "dynamic_data"...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
