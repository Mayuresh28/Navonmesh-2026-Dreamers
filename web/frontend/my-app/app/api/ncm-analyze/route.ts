import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * NCM Analysis API Route
 * ======================
 * GET  — Fetch ECG/EEG/EMG from MongoDB dynamic_data, call Python ML API, return results
 * POST — Accept raw arrays directly and analyze
 *
 * Architecture:
 *   MongoDB (dynamic_data.rawData) → extract ecg/eeg/emg/heart_rate arrays
 *   → POST to Python ML API (localhost:8000/predict-raw)
 *   → return predictions
 *   → fallback to formula-based analysis if Python API unreachable
 */

const ML_API_URL = process.env.NCM_API_URL || "http://localhost:8000";

// ── Feature computation (fallback when Python API is down) ────────────────────

function mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
}

function computeHrvSdnn(hrArray: number[]): number {
    if (hrArray.length < 2) return 50;
    const rr = hrArray.map((hr) => 60000 / Math.max(hr, 30));
    return std(rr);
}

function computeEmgRms(emgArray: number[]): number {
    if (emgArray.length === 0) return 0.3;
    let rms = Math.sqrt(mean(emgArray.map((v) => v * v)));
    if (rms > 5) rms = rms / 25; // scale from raw mV
    return Math.max(0.05, Math.min(rms, 2.0));
}

function computeStressProxy(eegArray: number[]): number {
    if (eegArray.length < 2) return 1.0;
    const m = mean(eegArray);
    const s = std(eegArray);
    const ratio = m !== 0 ? (s / Math.abs(m)) * 5.0 : 1.0;
    return Math.max(0.05, Math.min(ratio, 50));
}

/** Formula-based NCM analysis (no ML models required) */
function formulaBasedNCM(
    heartRate: number,
    hrvSdnn: number,
    stressRatio: number,
    emgRms: number
) {
    // ECG risk: high HR or low HRV → high risk
    const hrNorm = Math.max(0, Math.min(1, (heartRate - 60) / 80)); // 60-140 → 0-1
    const hrvNorm = Math.max(0, Math.min(1, 1 - (hrvSdnn - 10) / 90)); // 10-100 → 1-0
    const ecgProb = hrNorm * 0.6 + hrvNorm * 0.4;

    // EEG risk: high stress ratio → high stress
    const eegProb = Math.max(0, Math.min(1, stressRatio / 5));

    // EMG risk: high RMS → fatigue
    const emgProb = Math.max(0, Math.min(1, (emgRms - 0.15) / 0.85));

    const ncmIndex = (0.4 * ecgProb + 0.35 * eegProb + 0.25 * emgProb) * 100;

    const cardiacState = ecgProb > 0.5 ? "High Cardiac Risk" : "Normal Cardiac";
    const stressState = eegProb > 0.5 ? "High Stress" : "Relaxed";
    const muscleState = emgProb > 0.5 ? "Muscle Fatigue" : "Normal Muscle";

    let systemicFlag = "Stable";
    if (ecgProb > 0.6 && eegProb > 0.6) systemicFlag = "Autonomic Overload Risk";
    if (eegProb > 0.7 && emgProb > 0.7) systemicFlag = "Chronic Stress + Fatigue Risk";

    const riskCategory =
        ncmIndex < 25 ? "Low" : ncmIndex < 50 ? "Moderate" : ncmIndex < 75 ? "High" : "Critical";

    return {
        features: {
            heart_rate: Math.round(heartRate * 100) / 100,
            hrv_sdnn: Math.round(hrvSdnn * 100) / 100,
            stress_ratio: Math.round(stressRatio * 10000) / 10000,
            emg_rms: Math.round(emgRms * 10000) / 10000,
        },
        predictions: {
            cardiac: {
                state: cardiacState,
                probability: Math.round(ecgProb * 10000) / 10000,
                risk_level: ecgProb > 0.5 ? "high" : "low",
            },
            stress: {
                state: stressState,
                probability: Math.round(eegProb * 10000) / 10000,
                risk_level: eegProb > 0.5 ? "high" : "low",
            },
            muscle: {
                state: muscleState,
                probability: Math.round(emgProb * 10000) / 10000,
                risk_level: emgProb > 0.5 ? "high" : "low",
            },
        },
        ncm_index: Math.round(ncmIndex * 100) / 100,
        systemic_flag: systemicFlag,
        risk_category: riskCategory,
        model_source: "formula" as const,
    };
}

// ── Call Python ML API ────────────────────────────────────────────────────────

async function callMLApi(rawData: {
    heart_rate: number[];
    ecg: number[];
    eeg: number[];
    emg: number[];
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(`${ML_API_URL}/predict-raw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rawData),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(`ML API returned ${res.status}`);
        }

        const result = await res.json();
        return { ...result, model_source: "ml" };
    } catch {
        clearTimeout(timeout);
        return null; // Fallback to formula-based
    }
}

// ── GET: Fetch from MongoDB and analyze ───────────────────────────────────────

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("dhanvantari");
        const collection = db.collection("dynamic_data");

        const allEntries = await collection.find({}).sort({ createdAt: -1 }).toArray();

        if (allEntries.length === 0) {
            return NextResponse.json(
                { error: "No data found. Upload ECG/EEG/EMG data first." },
                { status: 404 }
            );
        }

        // Merge rawData from all entries
        const merged: Record<string, number[]> = {};
        for (const entry of allEntries) {
            if (!entry.rawData) continue;
            for (const [param, values] of Object.entries(entry.rawData)) {
                if (!Array.isArray(values)) continue;
                if (!merged[param]) merged[param] = [];
                merged[param].push(...(values as number[]));
            }
        }

        const ecg = merged["ecg"] || [];
        const eeg = merged["eeg"] || [];
        const emg = merged["emg"] || [];
        const heartRate = merged["heart_rate"] || [];

        if (ecg.length === 0 && eeg.length === 0 && emg.length === 0) {
            return NextResponse.json(
                { error: "No ECG/EEG/EMG data found in database." },
                { status: 404 }
            );
        }

        const rawPayload = {
            heart_rate: heartRate,
            ecg,
            eeg,
            emg,
        };

        // Try ML API first, then fallback to formula-based
        const mlResult = await callMLApi(rawPayload);

        if (mlResult) {
            return NextResponse.json({
                ...mlResult,
                data_summary: {
                    ecg_samples: ecg.length,
                    eeg_samples: eeg.length,
                    emg_samples: emg.length,
                    heart_rate_samples: heartRate.length,
                    entries_analyzed: allEntries.length,
                },
            });
        }

        // Fallback: compute features in JS and use formula-based analysis
        const hrSource = heartRate.length > 0 ? heartRate : ecg;
        const hr = hrSource.length > 0 ? mean(hrSource) : 72;
        const hrv = computeHrvSdnn(hrSource);
        const stress = computeStressProxy(eeg);
        const emgRms = computeEmgRms(emg);

        const result = formulaBasedNCM(hr, hrv, stress, emgRms);

        return NextResponse.json({
            ...result,
            data_summary: {
                ecg_samples: ecg.length,
                eeg_samples: eeg.length,
                emg_samples: emg.length,
                heart_rate_samples: heartRate.length,
                entries_analyzed: allEntries.length,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("NCM API Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// ── POST: Accept raw arrays directly ──────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const ecg: number[] = body.ecg || [];
        const eeg: number[] = body.eeg || [];
        const emg: number[] = body.emg || [];
        const heartRate: number[] = body.heart_rate || [];

        const rawPayload = { heart_rate: heartRate, ecg, eeg, emg };

        // Try ML API first
        const mlResult = await callMLApi(rawPayload);
        if (mlResult) {
            return NextResponse.json(mlResult);
        }

        // Fallback
        const hrSource = heartRate.length > 0 ? heartRate : ecg;
        const hr = hrSource.length > 0 ? mean(hrSource) : 72;
        const hrv = computeHrvSdnn(hrSource);
        const stress = computeStressProxy(eeg);
        const emgRms = computeEmgRms(emg);

        return NextResponse.json(formulaBasedNCM(hr, hrv, stress, emgRms));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("NCM API Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
