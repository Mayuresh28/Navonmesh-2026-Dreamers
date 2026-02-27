"use client";

import { useCallback, useRef, useState } from "react";
import {
    AnalysisResult,
    OverallAssessment,
    ParameterMetrics,
    parseCSVtoNumbers,
} from "./healthEngine";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";

/* ═══════════════════════════════════════════════════════════════════════════════
   SVG ICON COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const Icons: Record<string, (cls?: string) => React.ReactNode> = {
    blood_pressure: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21c-4.97 0-9-2.686-9-6V9c0-3.314 4.03-6 9-6s9 2.686 9 6v6c0 3.314-4.03 6-9 6z" />
            <path d="M12 3v18" />
            <path d="M3 12h4l2-3 2 6 2-6 2 3h4" />
        </svg>
    ),
    heart_rate: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            <path d="M3.5 12h4l1.5-3 2 6 2-6 1.5 3h4" />
        </svg>
    ),
    glucose: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />
        </svg>
    ),
    spo2: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
            <path d="M8 12h8" />
        </svg>
    ),
    sleep: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
    ),
    steps: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4v16" />
            <path d="M17 4v16" />
            <path d="M19 4H11a2 2 0 00-2 2v4a2 2 0 002 2h8" />
            <path d="M5 12h8a2 2 0 012 2v4a2 2 0 01-2 2H5" />
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
    ecg: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 12h4l1.5-3 2 6 2-6 1.5 3h7" />
        </svg>
    ),
    upload: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    image: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    ),
    sync: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
    ),
    check: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    alertTriangle: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    arrowLeft: (cls = "w-5 h-5") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    ),
    activity: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    database: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    logo: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    ),
    shield: (cls = "w-6 h-6") => (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PARAMETER DEFINITIONS  (user-friendly labels)
   ═══════════════════════════════════════════════════════════════════════════════ */

interface ParamCard {
    key: string;
    label: string;
    unit: string;
    description: string;
    optional?: boolean;
    isInput?: boolean;
}

const LOW_FREQ: ParamCard[] = [
    { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", description: "Your blood pressure reading" },
    { key: "heart_rate", label: "Heart Rate", unit: "bpm", description: "Beats per minute" },
    { key: "glucose", label: "Blood Sugar", unit: "mg/dL", description: "Blood glucose level" },
    { key: "spo2", label: "Oxygen Level", unit: "%", description: "Blood oxygen saturation" },
    { key: "sleep", label: "Sleep Hours", unit: "hrs", description: "How many hours did you sleep?", isInput: true },
    { key: "steps", label: "Daily Steps", unit: "steps", description: "Steps walked today", isInput: true },
];

const HI_FREQ: ParamCard[] = [
    { key: "eeg", label: "Brain Activity", unit: "\u03BCV", description: "EEG brain wave data", optional: true },
    { key: "emg", label: "Muscle Activity", unit: "mV", description: "EMG muscle signal data", optional: true },
    { key: "ecg", label: "Heart Signal", unit: "ms", description: "ECG heart rhythm data", optional: true },
];

const ALL_PARAMS = [...LOW_FREQ, ...HI_FREQ];

const DISPLAY: Record<string, { label: string; unit: string }> = {
    blood_pressure: { label: "Blood Pressure", unit: "mmHg" },
    heart_rate: { label: "Heart Rate", unit: "bpm" },
    glucose: { label: "Blood Sugar", unit: "mg/dL" },
    spo2: { label: "Oxygen Level", unit: "%" },
    sleep: { label: "Sleep Hours", unit: "hrs" },
    steps: { label: "Daily Steps", unit: "steps" },
    eeg: { label: "Brain Activity", unit: "\u03BCV" },
    emg: { label: "Muscle Activity", unit: "mV" },
    ecg: { label: "Heart Signal", unit: "ms" },
};

const RESULT_ORDER = [
    "blood_pressure", "heart_rate", "glucose", "spo2",
    "sleep", "steps", "eeg", "emg", "ecg",
];

/* ═══════════════════════════════════════════════════════════════════════════════
   RISK STYLE SYSTEM  (simple, friendly)
   ═══════════════════════════════════════════════════════════════════════════════ */

type RiskLvl = "low" | "moderate" | "high" | "critical";

function riskLevel(s: number): RiskLvl {
    if (s < 0.25) return "low";
    if (s < 0.50) return "moderate";
    if (s < 0.75) return "high";
    return "critical";
}

function riskLabel(s: number): string {
    if (s < 0.25) return "Normal";
    if (s < 0.50) return "Needs Attention";
    if (s < 0.75) return "High Risk";
    return "Critical";
}

function riskDescription(s: number): string {
    if (s < 0.25) return "Your readings look healthy";
    if (s < 0.50) return "Some values are slightly outside the normal range";
    if (s < 0.75) return "Please consult a healthcare professional";
    return "Seek medical attention soon";
}

const RISK_COLORS = {
    low: {
        bg: "bg-status-low/10",
        border: "border-status-low/30",
        text: "text-status-low",
        bar: "bg-status-low",
        barColor: "#86E3A3",
        icon: "text-status-low",
        cardBorder: "border-l-status-low",
        badge: "bg-status-low/15 text-status-low",
    },
    moderate: {
        bg: "bg-status-mod/10",
        border: "border-status-mod/30",
        text: "text-status-mod",
        bar: "bg-status-mod",
        barColor: "#FFD580",
        icon: "text-status-mod",
        cardBorder: "border-l-status-mod",
        badge: "bg-status-mod/15 text-status-mod",
    },
    high: {
        bg: "bg-status-high/10",
        border: "border-status-high/30",
        text: "text-status-high",
        bar: "bg-status-high",
        barColor: "#FF9C9C",
        icon: "text-status-high",
        cardBorder: "border-l-status-high",
        badge: "bg-status-high/15 text-status-high",
    },
    critical: {
        bg: "bg-status-high/15",
        border: "border-status-high/40",
        text: "text-status-high",
        bar: "bg-status-high",
        barColor: "#FF9C9C",
        icon: "text-status-high",
        cardBorder: "border-l-status-high",
        badge: "bg-status-high/20 text-status-high font-bold",
    },
};

const CAT_LABEL: Record<string, string> = {
    Low: "Normal",
    Moderate: "Needs Attention",
    High: "High Risk",
    Critical: "Critical",
};

const CAT_BADGE: Record<string, string> = {
    Low: "bg-status-low/15 text-status-low",
    Moderate: "bg-status-mod/15 text-status-mod",
    High: "bg-status-high/15 text-status-high",
    Critical: "bg-status-high/20 text-status-high font-bold",
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function RiskBar({ score }: { score: number }) {
    const pct = Math.min(score * 100, 100);
    const lvl = riskLevel(score);
    return (
        <div className="h-3 w-full rounded-full bg-border-soft/50 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${RISK_COLORS[lvl].bar}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function Spinner({ size = "h-6 w-6" }: { size?: string }) {
    return (
        <svg className={`animate-spin ${size} text-current`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

/* ─── Health Card (simplified for general users) ───────────────────────────── */

function HealthCard({ eKey, m }: { eKey: string; m: ParameterMetrics }) {
    const d = DISPLAY[eKey] ?? { label: eKey, unit: "" };
    const lvl = riskLevel(m.riskScore);
    const colors = RISK_COLORS[lvl];
    const IconFn = Icons[eKey];
    const label = riskLabel(m.riskScore);
    const desc = riskDescription(m.riskScore);

    return (
        <div className={`rounded-[20px] bg-card border-l-4 ${colors.cardBorder} border border-border-soft shadow-[0_2px_16px_rgb(126_166_247_/_0.06)] hover:shadow-[0_4px_24px_rgb(126_166_247_/_0.12)] transition-all duration-300 overflow-hidden`}>
            {/* Top section */}
            <div className="p-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-[14px] ${colors.bg} ${colors.border} border flex items-center justify-center ${colors.icon}`}>
                            {IconFn ? IconFn("w-6 h-6") : Icons.activity("w-6 h-6")}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-primary">{d.label}</h3>
                            <p className="text-sm text-text-secondary">{d.unit}</p>
                        </div>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${colors.badge}`}>
                        {label}
                    </span>
                </div>

                {/* Risk bar */}
                <RiskBar score={m.riskScore} />
                <p className="text-sm text-text-secondary mt-3">{desc}</p>
            </div>

            {/* Bottom stats — only simple, useful info */}
            <div className={`px-5 py-3 ${colors.bg} border-t ${colors.border} flex items-center justify-between`}>
                <div>
                    <p className="text-xs text-text-secondary mb-0.5">Average Value</p>
                    <p className="text-lg font-bold text-text-primary">
                        {m.mean.toFixed(1)} <span className="text-sm font-normal text-text-secondary">{d.unit}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-text-secondary mb-0.5">Readings</p>
                    <p className="text-lg font-bold text-text-primary">{m.sampleCount}</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Overall Summary (simplified) ─────────────────────────────────────────── */

function OverallSummary({ oa }: { oa: OverallAssessment }) {
    const pct = Math.min(oa.overallRisk * 100, 100);
    const lvl = riskLevel(oa.overallRisk);
    const color = RISK_COLORS[lvl].barColor;
    const dash = `${pct} ${100 - pct}`;
    const highLabel = DISPLAY[oa.highestRiskParameter]?.label ?? oa.highestRiskParameter;
    const friendlyCat = CAT_LABEL[oa.riskCategory] ?? oa.riskCategory;

    return (
        <div className="rounded-[24px] bg-card border border-border-soft shadow-[0_2px_16px_rgb(126_166_247_/_0.06)] overflow-hidden">
            <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text-primary mb-6">Your Health Summary</h2>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* Donut chart */}
                    <div className="relative shrink-0 w-36 h-36">
                        <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E3EAF5" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke={color}
                                strokeWidth="3" strokeDasharray={dash} strokeLinecap="round"
                                className="transition-all duration-700 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-text-primary">{pct.toFixed(0)}%</span>
                            <span className="text-xs text-text-secondary font-medium mt-0.5">Health Risk</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                        <span className={`inline-block text-base font-bold px-5 py-2 rounded-full mb-4 ${CAT_BADGE[oa.riskCategory]}`}>
                            {friendlyCat}
                        </span>
                        <p className="text-base text-text-secondary leading-relaxed mb-4">
                            {pct < 25
                                ? "Great news! Your overall health readings are within normal range. Keep maintaining your healthy lifestyle."
                                : pct < 50
                                    ? "Some of your health readings need attention. Consider consulting your doctor for a routine check-up."
                                    : pct < 75
                                        ? "Several health parameters show elevated risk. We recommend scheduling an appointment with your healthcare provider."
                                        : "Your readings indicate significant health concerns. Please consult a healthcare professional as soon as possible."
                            }
                        </p>
                        {oa.highestRiskParameter && (
                            <p className="text-sm text-text-secondary">
                                Focus area: <span className="font-semibold text-text-primary">{highLabel}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Upload Row (bigger, friendlier) ──────────────────────────────────────── */

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
    const IconFn = Icons[cfg.key];

    const rowBg =
        status === "ok" ? "border-status-low/40 bg-status-low/5" :
            status === "err" ? "border-status-high/40 bg-status-high/5" :
                "border-border-soft bg-card hover:bg-background/50";

    return (
        <div className={`flex items-center gap-4 rounded-[20px] border-2 px-5 py-4 transition-all duration-200 hover:shadow-sm ${rowBg}`}>
            {/* Icon */}
            <div className="w-12 h-12 rounded-[14px] bg-background border border-border-soft flex items-center justify-center text-text-secondary shrink-0">
                {IconFn ? IconFn("w-6 h-6") : Icons.activity("w-6 h-6")}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-text-primary">
                    {cfg.label}
                    {cfg.optional && <span className="ml-2 text-xs text-text-secondary font-normal">(Optional)</span>}
                </p>
                <p className="text-sm text-text-secondary mt-0.5">{cfg.description}</p>
            </div>

            {/* Status */}
            <div className="shrink-0 w-20 flex justify-center">
                {status === "ok" && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-status-low font-semibold">
                        {Icons.check("w-4 h-4")} Ready
                    </span>
                )}
                {status === "err" && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-status-high font-semibold">
                        {Icons.alertTriangle("w-4 h-4")} Error
                    </span>
                )}
            </div>

            {/* Input / Upload */}
            {cfg.isInput ? (
                <input
                    type="number"
                    value={inputValue ?? ""}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    placeholder={`Enter ${cfg.unit}`}
                    className="input-field w-40 h-11"
                />
            ) : (
                <>
                    <button
                        onClick={() => csvRef.current?.click()}
                        className={`shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-[14px] border-2 text-sm font-semibold transition-all duration-200 ${csvFile
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-border-soft bg-background text-text-secondary hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                            }`}
                    >
                        {Icons.upload("w-4 h-4")}
                        <span>{csvFile ? (csvFile.name.length > 14 ? csvFile.name.slice(0, 14) + "\u2026" : csvFile.name) : "Upload File"}</span>
                    </button>
                    <input ref={csvRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt"
                        onChange={e => onCsv(e.target.files?.[0] ?? null)} />
                </>
            )}

            {/* Image upload */}
            {!cfg.isInput && (
                <>
                    <button
                        onClick={() => imgRef.current?.click()}
                        className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-[14px] border-2 text-sm font-semibold transition-all duration-200 ${imgFile
                            ? "border-secondary/30 bg-secondary/5 text-secondary"
                            : "border-border-soft bg-background text-text-secondary hover:border-secondary/20 hover:bg-secondary/5 hover:text-secondary"
                            }`}
                    >
                        {Icons.image("w-4 h-4")}
                        <span>{imgFile ? (imgFile.name.length > 10 ? imgFile.name.slice(0, 10) + "\u2026" : imgFile.name) : "Photo"}</span>
                    </button>
                    <input ref={imgRef} type="file" className="hidden" accept="image/*"
                        onChange={e => onImg(e.target.files?.[0] ?? null)} />
                </>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

type Mode = "manual" | "autosync";
type View = "form" | "results";
type FileState = { csv: File | null; img: File | null; status: "idle" | "ok" | "err"; inputValue: string };

export default function HealthDashboard() {
    const [mode, setMode] = useState<Mode>("manual");
    const [view, setView] = useState<View>("form");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [autoProgress, setAutoProgress] = useState(0);

    const [files, setFiles] = useState<Record<string, FileState>>(() =>
        Object.fromEntries(ALL_PARAMS.map(p => [p.key, { csv: null, img: null, status: "idle" as const, inputValue: "" }]))
    );

    const setParamFile = useCallback((key: string, field: "csv" | "img" | "inputValue", val: File | string | null) => {
        setFiles(prev => ({ ...prev, [key]: { ...prev[key], [field]: val, status: "idle" } }));
    }, []);

    /* ── Manual Analyse ────────────────────────────────────────────────────── */
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
        if (Object.keys(data).length > 0) {
            try {
                await new Promise(r => setTimeout(r, 2000));
                const response = await fetch('/api/health-analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Something went wrong. Please try again.');
                const resultData = await response.json();
                setResult(resultData);
                setView("results");
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Something went wrong';
                console.error(err);
                alert(msg);
            }
        }
        setLoading(false);
    }, [files]);

    /* ── Auto Sync ─────────────────────────────────────────────────────────── */
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
            if (!response.ok) throw new Error('No previous data found. Please upload your health data first.');
            const resultData = await response.json();
            await new Promise(r => setTimeout(r, 2200));
            setResult(resultData);
            setView("results");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Something went wrong';
            alert(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleBack = () => { setView("form"); setResult(null); setAutoProgress(0); };
    const switchMode = (m: Mode) => { setMode(m); setView("form"); setResult(null); setAutoProgress(0); };

    const anyReady = ALL_PARAMS.some(p =>
        (p.isInput && files[p.key].inputValue) || (!p.isInput && files[p.key].csv !== null)
    );

    /* ═══════════════════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════════════════ */
    return (
        <div className="h-screen w-screen overflow-hidden bg-transparent flex flex-col" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
            <GlassmorphicBackground />

            {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
            <header className="shrink-0 bg-card/80 backdrop-blur-md border-b border-border-soft h-16 px-6 sm:px-8 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgb(126_166_247_/_0.05)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[14px] bg-primary/15 flex items-center justify-center text-primary border border-primary/20">
                        {Icons.logo("w-5 h-5")}
                    </div>
                    <div>
                        <span className="text-lg font-bold text-text-primary tracking-tight">धन्वंतरी</span>
                        <p className="text-xs text-text-secondary font-medium hidden sm:block">Health Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {view === "form" && (
                        <div className="flex items-center bg-background rounded-[14px] p-1 border border-border-soft">
                            {(["manual", "autosync"] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200 ${mode === m
                                        ? "bg-card shadow-sm text-text-primary"
                                        : "text-text-secondary hover:text-text-primary"
                                        }`}
                                >
                                    {m === "manual" ? "Upload Data" : "Auto Sync"}
                                </button>
                            ))}
                        </div>
                    )}

                    {view === "results" && (
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] border-2 border-border-soft bg-card text-sm font-semibold text-text-secondary hover:border-primary/30 hover:text-primary transition-all duration-200 shadow-sm"
                        >
                            {Icons.arrowLeft("w-4 h-4")}
                            Back
                        </button>
                    )}
                </div>
            </header>

            {/* ══ FORM VIEW ═══════════════════════════════════════════════════════ */}
            {view === "form" && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    {mode === "manual" && (
                        <div className="flex-1 overflow-auto flex flex-col px-6 sm:px-8 py-6 gap-6">

                            {/* Welcome text */}
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">Upload Your Health Data</h1>
                                <p className="text-base text-text-secondary mt-1">
                                    Upload your health files or enter values below to get a personalized health report.
                                </p>
                            </div>

                            {/* Section: Basic Health */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 rounded-full bg-primary" />
                                    <h2 className="text-lg font-bold text-text-primary">Basic Health Data</h2>
                                </div>
                                <div className="flex flex-col gap-3">
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
                            </section>

                            {/* Section: Additional Tests */}
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 rounded-full bg-border-soft" />
                                    <h2 className="text-lg font-bold text-text-primary">
                                        Additional Tests
                                    </h2>
                                    <span className="text-sm text-text-secondary font-medium">(Optional)</span>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                    {HI_FREQ.map(cfg => (
                                        <UploadRow key={cfg.key} cfg={cfg}
                                            csvFile={files[cfg.key].csv} imgFile={files[cfg.key].img}
                                            status={files[cfg.key].status}
                                            onCsv={f => setParamFile(cfg.key, "csv", f)}
                                            onImg={f => setParamFile(cfg.key, "img", f)}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Analyse Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !anyReady}
                                className={`shrink-0 w-full py-4 rounded-[20px] text-lg font-bold tracking-wide transition-all duration-200 ${!loading && anyReady
                                    ? "bg-primary hover:bg-secondary text-white shadow-[0_4px_16px_rgb(126_166_247_/_0.35)] hover:shadow-[0_6px_24px_rgb(126_166_247_/_0.4)] active:scale-[0.99] cursor-pointer"
                                    : "bg-border-soft text-text-secondary cursor-not-allowed"
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <Spinner />
                                        Analyzing your data...
                                    </span>
                                ) : !anyReady
                                    ? "Upload at least one file to get started"
                                    : "Analyze My Health"
                                }
                            </button>
                        </div>
                    )}
                    {mode === "autosync" && (
                        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
                            <div className="text-center max-w-lg">
                                <div className="w-20 h-20 rounded-[20px] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary mx-auto mb-6">
                                    {Icons.shield("w-10 h-10")}
                                </div>
                                <h1 className="text-2xl font-bold text-text-primary">Auto Sync</h1>
                                <p className="text-base text-text-secondary mt-3 leading-relaxed">
                                    Automatically sync and analyze all your health data in one click.
                                    This combines everything you have uploaded so far to give you the
                                    most accurate picture of your health.
                                </p>
                            </div>

                            {/* Parameter overview */}
                            <div className="w-full max-w-2xl grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {ALL_PARAMS.map(p => {
                                    const PIcon = Icons[p.key];
                                    return (
                                        <div key={p.key}
                                            className={`flex flex-col items-center gap-2 rounded-[16px] border-2 px-3 py-4 text-center transition-all duration-200 ${loading
                                                ? "border-primary/30 bg-primary/5 animate-pulse"
                                                : "border-border-soft bg-card hover:border-primary/20 hover:shadow-sm"
                                                }`}
                                        >
                                            <div className="text-text-secondary">
                                                {PIcon ? PIcon("w-6 h-6") : Icons.activity("w-6 h-6")}
                                            </div>
                                            <span className="text-xs font-semibold text-text-secondary leading-tight">{p.label}</span>
                                            {p.optional && <span className="text-[10px] text-text-secondary/60 -mt-0.5">Optional</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Progress */}
                            {loading && (
                                <div className="w-full max-w-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-text-secondary font-medium">Loading your health data...</span>
                                        <span className="text-sm font-bold text-primary">{autoProgress}%</span>
                                    </div>
                                    <div className="h-3 bg-border-soft/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                                            style={{ width: `${autoProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleAutoSync}
                                disabled={loading}
                                className="w-full max-w-lg py-4 rounded-[20px] bg-primary hover:bg-secondary text-white font-bold text-lg tracking-wide shadow-[0_4px_16px_rgb(126_166_247_/_0.35)] hover:shadow-[0_6px_24px_rgb(126_166_247_/_0.4)] transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <Spinner /> Loading Report...
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-3">
                                        {Icons.sync("w-5 h-5")} Start Auto Sync
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ══ RESULTS VIEW ════════════════════════════════════════════════════ */}
            {view === "results" && result && (
                <div className="flex-1 overflow-auto flex flex-col px-6 sm:px-8 py-6 gap-6">
                    {/* Overall summary */}
                    <OverallSummary oa={result.overall} />

                    {/* Section header */}
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full bg-primary" />
                        <h2 className="text-xl font-bold text-text-primary">Detailed Results</h2>
                    </div>

                    {/* Health cards */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                        {RESULT_ORDER.map((id) => {
                            const m = result.metrics[id];
                            if (!m) return null;
                            return <HealthCard key={id} eKey={id} m={m} />;
                        })}
                    </div>
                </div>
            )}

            {/* ── Loading Overlay ── */}
            {loading && view === "form" && (
                <div className="absolute inset-0 bg-card/70 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-5 bg-card rounded-[24px] border border-border-soft shadow-[0_8px_32px_rgb(126_166_247_/_0.15)] px-12 py-10">
                        <Spinner size="h-10 w-10" />
                        <div className="text-center">
                            <p className="text-lg font-bold text-text-primary">
                                {mode === "manual" ? "Analyzing Your Health Data" : "Loading Your Report"}
                            </p>
                            <p className="text-sm text-text-secondary mt-2">This will only take a moment...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
