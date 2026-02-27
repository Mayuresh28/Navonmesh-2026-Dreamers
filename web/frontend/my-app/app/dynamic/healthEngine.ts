/**
 * Client-Side Health Data Processing Engine
 * ==========================================
 * Parameters:
 *   Low-Frequency  : heart_rate, systolic_bp, diastolic_bp, glucose, spo2, sleep, steps
 *   High-Frequency : eeg, emg, ecg  (optional advanced)
 *
 * Uses ONLY mathematical formulas — no AI / ML models.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParameterMetrics {
    mean: number;
    slope: number;
    percentChange: number;
    variance: number;
    instabilityIndex: number;
    riskScore: number;
    sampleCount: number;
}

export interface OverallAssessment {
    overallRisk: number;
    overallInstability: number;
    riskCategory: "Low" | "Moderate" | "High" | "Critical";
    parametersCount: number;
    highestRiskParameter: string;
}

export interface AnalysisResult {
    metrics: Record<string, ParameterMetrics>;
    overall: OverallAssessment;
    timestamp: string;
}

// ─── Clinical Thresholds ─────────────────────────────────────────────────────
// inverse=false → higher value = higher risk
// inverse=true  → lower value  = higher risk

interface Threshold {
    low: number;
    high: number;
    inverse: boolean;
    varianceScale: number;
    trendThreshold: number;
}

export const THRESHOLDS: Record<string, Threshold> = {
    heart_rate: { low: 70, high: 110, inverse: false, varianceScale: 50, trendThreshold: 2.0 },
    systolic_bp: { low: 120, high: 180, inverse: false, varianceScale: 100, trendThreshold: 3.0 },
    diastolic_bp: { low: 80, high: 120, inverse: false, varianceScale: 50, trendThreshold: 2.0 },
    glucose: { low: 100, high: 200, inverse: false, varianceScale: 200, trendThreshold: 5.0 },
    spo2: { low: 90, high: 95, inverse: true, varianceScale: 2, trendThreshold: -0.5 },
    sleep: { low: 4, high: 8, inverse: true, varianceScale: 1, trendThreshold: -0.2 },
    steps: { low: 2000, high: 10000, inverse: true, varianceScale: 1_000_000, trendThreshold: -200 },
    eeg: { low: 5, high: 30, inverse: false, varianceScale: 50, trendThreshold: 2.0 },
    emg: { low: 0, high: 100, inverse: false, varianceScale: 200, trendThreshold: 5.0 },
    ecg: { low: 70, high: 120, inverse: false, varianceScale: 100, trendThreshold: 3.0 },
};

// ─── Core Formula Functions ───────────────────────────────────────────────────

/** Formula: Mean_X = (1/n) × Σ Xᵢ */
export function calcMean(v: number[]): number {
    if (v.length === 0) return 0;
    return v.reduce((a, x) => a + x, 0) / v.length;
}

/**
 * Linear Regression Slope (OLS closed-form, no library).
 * slope = (n ΣtᵢXᵢ − ΣtᵢΣXᵢ) / (n Σtᵢ² − (Σtᵢ)²)
 * tᵢ = 0,1,…,n-1
 */
export function calcSlope(v: number[]): number {
    const n = v.length;
    if (n < 2) return 0;
    let sumT = 0, sumX = 0, sumTX = 0, sumT2 = 0;
    for (let i = 0; i < n; i++) {
        sumT += i;
        sumX += v[i];
        sumTX += i * v[i];
        sumT2 += i * i;
    }
    const denom = n * sumT2 - sumT * sumT;
    if (Math.abs(denom) < 1e-10) return 0;
    return (n * sumTX - sumT * sumX) / denom;
}

/** Formula: %Δ = ((Last − First) / |First|) × 100 */
export function calcPercentChange(v: number[]): number {
    if (v.length < 2) return 0;
    const b = v[0];
    if (Math.abs(b) < 1e-10) return 0;
    return ((v[v.length - 1] - b) / Math.abs(b)) * 100;
}

/** Formula: Var = (1/n) Σ (Xᵢ − Mean)² */
export function calcVariance(v: number[]): number {
    if (v.length <= 1) return 0;
    const m = calcMean(v);
    return v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length;
}

function clip(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

function baseRisk(param: string, mean: number): number {
    const cfg = THRESHOLDS[param];
    if (!cfg) return 0;
    const { low, high, inverse } = cfg;
    const span = high - low;
    if (span <= 0) return 0;
    if (inverse) {
        if (mean >= high) return 0;
        if (mean <= low) return 1;
        return (high - mean) / span;
    }
    if (mean <= low) return 0;
    if (mean >= high) return 1;
    return (mean - low) / span;
}

export function calcInstabilityIndex(param: string, variance: number): number {
    const s = THRESHOLDS[param]?.varianceScale ?? 100;
    return clip(variance / s, 0, 1);
}

export function calcRiskScore(
    param: string, mean: number, variance: number, slope: number, boost = true
): number {
    const cfg = THRESHOLDS[param];
    if (!cfg) return 0;
    const base = baseRisk(param, mean);
    const instab = clip(variance / cfg.varianceScale / 5, 0, 0.20);
    let tBoost = 0;
    if (boost) {
        const bad = (!cfg.inverse && slope > cfg.trendThreshold) ||
            (cfg.inverse && slope < cfg.trendThreshold);
        if (bad) tBoost = 0.10;
    }
    return clip(base + instab + tBoost, 0, 1);
}

// ─── Process ──────────────────────────────────────────────────────────────────

export function processParameter(param: string, values: number[]): ParameterMetrics {
    if (values.length === 0)
        return { mean: 0, slope: 0, percentChange: 0, variance: 0, instabilityIndex: 0, riskScore: 0, sampleCount: 0 };

    const mean = calcMean(values);
    const slope = calcSlope(values);
    const percentChange = calcPercentChange(values);
    const variance = calcVariance(values);
    const instabilityIndex = calcInstabilityIndex(param, variance);
    const riskScore = calcRiskScore(param, mean, variance, slope);

    return {
        mean: +mean.toFixed(2),
        slope: +slope.toFixed(4),
        percentChange: +percentChange.toFixed(2),
        variance: +variance.toFixed(4),
        instabilityIndex: +instabilityIndex.toFixed(4),
        riskScore: +riskScore.toFixed(4),
        sampleCount: values.length,
    };
}

export function processAllParameters(data: Record<string, number[]>): AnalysisResult {
    const metrics: Record<string, ParameterMetrics> = {};
    for (const [p, v] of Object.entries(data)) {
        metrics[p] = processParameter(p, v);
    }
    const riskScores = Object.values(metrics).map(m => m.riskScore);
    const instabScores = Object.values(metrics).map(m => m.instabilityIndex);
    const overallRisk = riskScores.length ? calcMean(riskScores) : 0;
    const overallInstab = instabScores.length ? calcMean(instabScores) : 0;

    let highest = "none", highestVal = -1;
    for (const [p, m] of Object.entries(metrics)) {
        if (m.riskScore > highestVal) { highestVal = m.riskScore; highest = p; }
    }
    const cat: OverallAssessment["riskCategory"] =
        overallRisk < 0.25 ? "Low" : overallRisk < 0.50 ? "Moderate" : overallRisk < 0.75 ? "High" : "Critical";

    return {
        metrics,
        overall: {
            overallRisk: +overallRisk.toFixed(4),
            overallInstability: +overallInstab.toFixed(4),
            riskCategory: cat,
            parametersCount: riskScores.length,
            highestRiskParameter: highest,
        },
        timestamp: new Date().toISOString(),
    };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/**
 * Parse a CSV / TSV into arrays of numbers.
 * Returns { col0: number[], col1: number[] } for up to 2 columns.
 * Used for Blood Pressure which has systolic (col0) and diastolic (col1).
 */
export function parseCSVColumns(text: string): number[][] {
    const cols: number[][] = [[], []];
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim() !== "");
    for (const line of lines) {
        const cells = line.split(/[,;\t]/);
        let colIdx = 0;
        for (const cell of cells) {
            const n = parseFloat(cell.trim());
            if (!isNaN(n) && isFinite(n)) {
                if (colIdx < 2) cols[colIdx].push(n);
                colIdx++;
            }
        }
    }
    return cols;
}

/** Parse CSV into flat number array (first numeric value per row). */
export function parseCSVtoNumbers(text: string): number[] {
    return parseCSVColumns(text)[0];
}

// ─── Auto-Sync Generator ─────────────────────────────────────────────────────

/** Deterministic formula-based series: base + linear drift + sinusoidal variation */
function series(base: number, drift: number, amp: number, period: number, n: number) {
    return Array.from({ length: n }, (_, i) => {
        const trend = drift * (i / n);
        const wave = amp * Math.sin((2 * Math.PI * i) / period);
        const noise = amp * 0.3 * Math.sin((2 * Math.PI * i * 7) / period);
        return +(base + trend + wave + noise).toFixed(2);
    });
}

export function generateAutoSyncData(n = 100): Record<string, number[]> {
    return {
        heart_rate: series(72, 13, 4, 14, n),
        systolic_bp: series(125, 20, 5, 10, n),
        diastolic_bp: series(82, 10, 3, 10, n),
        glucose: series(95, 15, 6, 7, n),
        spo2: series(97, -2, 0.8, 12, n),
        sleep: series(7, -2, 0.5, 14, n),
        steps: series(8000, -4800, 500, 10, n),
        eeg: series(12, 3, 2, 8, n),
        emg: series(40, 15, 5, 9, n),
        ecg: series(80, 15, 4, 12, n),
    };
}
