"use client";

import { useCallback, useState } from "react";
import { AnalysisResult, parseCSVtoNumbers } from "./healthEngine";
import { Icons } from "@/components/icons/health-icons";
import { Spinner } from "@/components/ui/spinner";
import { ALL_PARAMS, RESULT_ORDER } from "@/components/vitals/constants";
import { ManualForm, FileState } from "@/components/vitals/manual-form";
import { AutosyncView } from "@/components/vitals/autosync-view";
import { HealthCard } from "@/components/vitals/health-card";
import { OverallSummary } from "@/components/vitals/overall-summary";

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

type Mode = "manual" | "autosync";
type View = "form" | "results";

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
        <div className="h-screen w-screen overflow-hidden bg-[#f8f9fc] flex flex-col" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

            {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
            <header className="shrink-0 bg-white border-b border-gray-200/80 h-16 px-6 sm:px-8 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                        {Icons.logo("w-5 h-5")}
                    </div>
                    <div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">Dhanvantari</span>
                        <p className="text-xs text-gray-400 font-medium hidden sm:block">Health Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {view === "form" && (
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            {(["manual", "autosync"] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
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
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all duration-200 shadow-sm"
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
                        <ManualForm files={files} onFileChange={setParamFile}
                            anyReady={anyReady} loading={loading} onAnalyze={handleAnalyze} />
                    )}
                    {mode === "autosync" && (
                        <AutosyncView loading={loading} autoProgress={autoProgress} onSync={handleAutoSync} />
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
                        <h2 className="text-xl font-bold text-gray-900">Detailed Results</h2>
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
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-5 bg-white rounded-3xl border border-gray-200/80 shadow-xl px-12 py-10">
                        <Spinner size="h-10 w-10" />
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-800">
                                {mode === "manual" ? "Analyzing Your Health Data" : "Loading Your Report"}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">This will only take a moment...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
