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
import { BottomNav } from "@/components/navigation/bottom-nav";

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
        <div className="h-screen w-screen overflow-hidden flex flex-col"
          style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

            {/* ══ EKG STRIP ═══════════════════════════════════════════════════════ */}
            <div className="ekg-strip shrink-0">
              <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
                <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
              </svg>
            </div>

            {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
            <header className="shrink-0 h-16 px-6 sm:px-8 flex items-center justify-between gap-4"
              style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--teal-bg)", border: "1.5px solid var(--border-accent)" }}>
                        {Icons.logo("w-5 h-5")}
                    </div>
                    <div>
                        <span className="text-lg font-bold tracking-tight" style={{ color: "var(--teal)" }}>Dhanvantari</span>
                        <p className="text-xs font-medium hidden sm:block" style={{ color: "var(--text-muted)" }}>Health Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {view === "form" && (
                        <div className="flex items-center rounded-xl p-1"
                          style={{ background: "var(--bg-raised)", border: "1.5px solid var(--border)" }}>
                            {(["manual", "autosync"] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                                    style={{
                                      background: mode === m ? "var(--teal-bg)" : "transparent",
                                      color: mode === m ? "var(--teal)" : "var(--text-muted)",
                                      border: mode === m ? "1.5px solid var(--border-accent)" : "1.5px solid transparent",
                                    }}
                                >
                                    {m === "manual" ? "Upload Data" : "Auto Sync"}
                                </button>
                            ))}
                        </div>
                    )}

                    {view === "results" && (
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                              background: "var(--bg-card)",
                              border: "1.5px solid var(--border-strong)",
                              color: "var(--text-body)"
                            }}
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
                    <div className="prana-sh">
                        <h2 className="prana-sh-title">Detailed Results</h2>
                        <span className="prana-sh-tag">VITALS</span>
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
                <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10"
                  style={{ background: "rgba(6,13,24,0.7)" }}>
                    <div className="prana-vessel flex flex-col items-center gap-5 px-12 py-10">
                        <Spinner size="h-10 w-10" />
                        <div className="text-center">
                            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                                {mode === "manual" ? "Analyzing Your Health Data" : "Loading Your Report"}
                            </p>
                            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>This will only take a moment...</p>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
