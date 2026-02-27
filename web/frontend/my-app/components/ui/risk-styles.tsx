"use client";

/* ═══════════════════════════════════════════════════════════════════
   PRĀṆA OS — Risk Level Types, Helpers & Color Mappings
   Uses CSS custom properties for theme-aware colors.
   ═══════════════════════════════════════════════════════════════════ */

export type RiskLvl = "low" | "moderate" | "high" | "critical";

export function riskLevel(s: number): RiskLvl {
  if (s < 0.25) return "low";
  if (s < 0.5) return "moderate";
  if (s < 0.75) return "high";
  return "critical";
}

export function riskLabel(s: number): string {
  if (s < 0.25) return "Normal";
  if (s < 0.5) return "Needs Attention";
  if (s < 0.75) return "High Risk";
  return "Critical";
}

export function riskDescription(s: number): string {
  if (s < 0.25) return "Your readings look healthy";
  if (s < 0.5) return "Some values are slightly outside the normal range";
  if (s < 0.75) return "Please consult a healthcare professional";
  return "Seek medical attention soon";
}

/* barColor = literal hex used in SVGs (not theme-aware, always vivid) */
export const RISK_COLORS = {
  low: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    bar: "",           // now rendered via inline style
    barColor: "#0de5a8", // PRĀṆA ok / teal
    icon: "text-emerald-600",
    cardBorder: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
  },
  moderate: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    bar: "",
    barColor: "#f5c542", // PRĀṆA warn
    icon: "text-amber-600",
    cardBorder: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  high: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    bar: "",
    barColor: "#f97316", // orange
    icon: "text-orange-600",
    cardBorder: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800",
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    bar: "",
    barColor: "#ff4d6a", // PRĀṆA danger
    icon: "text-red-600",
    cardBorder: "border-l-red-500",
    badge: "bg-red-100 text-red-800",
  },
} as const;

export const CAT_LABEL: Record<string, string> = {
  Low: "Normal",
  Moderate: "Needs Attention",
  High: "High Risk",
  Critical: "Critical",
};

export const CAT_BADGE: Record<string, string> = {
  Low: "prana-badge prana-badge-ok",
  Moderate: "prana-badge prana-badge-warn",
  High: "prana-badge prana-badge-warn",
  Critical: "prana-badge prana-badge-bad",
};

export function RiskBar({ score }: { score: number }) {
  const pct = Math.min(score * 100, 100);
  const lvl = riskLevel(score);
  return (
    <div className="h-3 w-full rounded-full overflow-hidden"
      style={{ background: "var(--bg-raised)" }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: RISK_COLORS[lvl].barColor }}
      />
    </div>
  );
}
