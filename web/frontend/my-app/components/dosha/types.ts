/* NCM Analysis types and style helpers */

export interface Prediction {
  state: string;
  probability: number;
  risk_level: "high" | "low";
}

export interface NCMResult {
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

export const NCM_RISK_STYLES = {
  Low:      { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800", gradient: "from-emerald-400 to-emerald-600" },
  Moderate: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   bar: "bg-amber-500",   badge: "bg-amber-100 text-amber-800",   gradient: "from-amber-400 to-amber-600" },
  High:     { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  bar: "bg-orange-500",  badge: "bg-orange-100 text-orange-800",  gradient: "from-orange-400 to-orange-600" },
  Critical: { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     bar: "bg-red-500",     badge: "bg-red-100 text-red-800",     gradient: "from-red-400 to-red-600" },
} as const;

export function getRiskStyle(category: string) {
  return NCM_RISK_STYLES[category as keyof typeof NCM_RISK_STYLES] || NCM_RISK_STYLES.Low;
}

export function getPredictionStyle(riskLevel: string) {
  return riskLevel === "high" ? NCM_RISK_STYLES.High : NCM_RISK_STYLES.Low;
}
