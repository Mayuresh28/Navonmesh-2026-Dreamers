/**
 * NCM (Neuro-Cardio-Muscular) analysis engine.
 * Pure computation — no Next.js / route dependencies.
 */

const ML_API_URL = process.env.NCM_API_URL || "http://localhost:8000";

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function computeHrvSdnn(hrArray: number[]): number {
  if (hrArray.length < 2) return 50;
  const rr = hrArray.map((hr) => 60000 / Math.max(hr, 30));
  return std(rr);
}

export function computeEmgRms(emgArray: number[]): number {
  if (emgArray.length === 0) return 0.3;
  let rms = Math.sqrt(mean(emgArray.map((v) => v * v)));
  if (rms > 5) rms = rms / 25;
  return Math.max(0.05, Math.min(rms, 2.0));
}

export function computeStressProxy(eegArray: number[]): number {
  if (eegArray.length < 2) return 1.0;
  const m = mean(eegArray);
  const s = std(eegArray);
  const ratio = m !== 0 ? (s / Math.abs(m)) * 5.0 : 1.0;
  return Math.max(0.05, Math.min(ratio, 50));
}

/** Formula-based NCM analysis (no ML models required) */
export function formulaBasedNCM(heartRate: number, hrvSdnn: number, stressRatio: number, emgRms: number) {
  const hrNorm = Math.max(0, Math.min(1, (heartRate - 60) / 80));
  const hrvNorm = Math.max(0, Math.min(1, 1 - (hrvSdnn - 10) / 90));
  const ecgProb = hrNorm * 0.6 + hrvNorm * 0.4;
  const eegProb = Math.max(0, Math.min(1, stressRatio / 5));
  const emgProb = Math.max(0, Math.min(1, (emgRms - 0.15) / 0.85));
  const ncmIndex = (0.4 * ecgProb + 0.35 * eegProb + 0.25 * emgProb) * 100;

  const cardiacState = ecgProb > 0.5 ? "High Cardiac Risk" : "Normal Cardiac";
  const stressState = eegProb > 0.5 ? "High Stress" : "Relaxed";
  const muscleState = emgProb > 0.5 ? "Muscle Fatigue" : "Normal Muscle";

  let systemicFlag = "Stable";
  if (ecgProb > 0.6 && eegProb > 0.6) systemicFlag = "Autonomic Overload Risk";
  if (eegProb > 0.7 && emgProb > 0.7) systemicFlag = "Chronic Stress + Fatigue Risk";

  const riskCategory = ncmIndex < 25 ? "Low" : ncmIndex < 50 ? "Moderate" : ncmIndex < 75 ? "High" : "Critical";

  return {
    features: {
      heart_rate: Math.round(heartRate * 100) / 100,
      hrv_sdnn: Math.round(hrvSdnn * 100) / 100,
      stress_ratio: Math.round(stressRatio * 10000) / 10000,
      emg_rms: Math.round(emgRms * 10000) / 10000,
    },
    predictions: {
      cardiac: { state: cardiacState, probability: Math.round(ecgProb * 10000) / 10000, risk_level: ecgProb > 0.5 ? "high" as const : "low" as const },
      stress:  { state: stressState,  probability: Math.round(eegProb * 10000) / 10000, risk_level: eegProb > 0.5 ? "high" as const : "low" as const },
      muscle:  { state: muscleState,  probability: Math.round(emgProb * 10000) / 10000, risk_level: emgProb > 0.5 ? "high" as const : "low" as const },
    },
    ncm_index: Math.round(ncmIndex * 100) / 100,
    systemic_flag: systemicFlag,
    risk_category: riskCategory,
    model_source: "formula" as const,
  };
}

/** Call Python ML API with timeout + fallback */
export async function callMLApi(rawData: { heart_rate: number[]; ecg: number[]; eeg: number[]; emg: number[] }) {
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
    if (!res.ok) throw new Error(`ML API returned ${res.status}`);

    const raw = await res.json();

    return {
      features: {
        heart_rate: raw.heart_rate ?? (rawData.heart_rate.length > 0 ? mean(rawData.heart_rate) : 72),
        hrv_sdnn: raw.hrv_sdnn ?? 50,
        stress_ratio: raw.stress_ratio ?? 1,
        emg_rms: raw.emg_rms ?? 0.3,
      },
      predictions: {
        cardiac: { state: raw.cardiac_state ?? "Unknown", probability: raw.cardiac_prob ?? 0, risk_level: ((raw.cardiac_prob ?? 0) > 0.5 ? "high" : "low") as "high" | "low" },
        stress:  { state: raw.stress_state ?? "Unknown",  probability: raw.stress_prob ?? 0,  risk_level: ((raw.stress_prob ?? 0) > 0.5 ? "high" : "low") as "high" | "low" },
        muscle:  { state: raw.muscle_state ?? "Unknown",  probability: raw.fatigue_prob ?? 0, risk_level: ((raw.fatigue_prob ?? 0) > 0.5 ? "high" : "low") as "high" | "low" },
      },
      ncm_index: raw.ncm_index ?? 0,
      systemic_flag: raw.systemic_flag ?? "Stable",
      risk_category: raw.risk_category ?? "Low",
      model_source: "ml" as const,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
