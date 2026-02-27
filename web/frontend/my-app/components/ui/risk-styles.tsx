"use client";

/* ═══════════════════════════════════════════════════════════════════
   Risk Level Types, Helpers & Color Mappings
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

export const RISK_COLORS = {
  low: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    barColor: "#10b981",
    icon: "text-emerald-600",
    cardBorder: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
  },
  moderate: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-500",
    barColor: "#f59e0b",
    icon: "text-amber-600",
    cardBorder: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  high: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    bar: "bg-orange-500",
    barColor: "#f97316",
    icon: "text-orange-600",
    cardBorder: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800",
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    bar: "bg-red-500",
    barColor: "#ef4444",
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
  Low: "bg-emerald-100 text-emerald-800",
  Moderate: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

export function RiskBar({ score }: { score: number }) {
  const pct = Math.min(score * 100, 100);
  const lvl = riskLevel(score);
  return (
    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${RISK_COLORS[lvl].bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
