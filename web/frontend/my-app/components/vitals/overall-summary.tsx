"use client";

import { riskLevel, RISK_COLORS, CAT_LABEL, CAT_BADGE } from "@/components/ui/risk-styles";
import { DISPLAY } from "./constants";
import type { OverallAssessment } from "@/app/dynamic/healthEngine";

export function OverallSummary({ oa }: { oa: OverallAssessment }) {
  const pct = Math.min(oa.overallRisk * 100, 100);
  const lvl = riskLevel(oa.overallRisk);
  const color = RISK_COLORS[lvl].barColor;
  const dash = `${pct} ${100 - pct}`;
  const highLabel = DISPLAY[oa.highestRiskParameter]?.label ?? oa.highestRiskParameter;
  const friendlyCat = CAT_LABEL[oa.riskCategory] ?? oa.riskCategory;

  return (
    <div className="prana-vessel overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="prana-sh text-xl mb-6">Your Health Summary</h2>

        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Donut chart */}
          <div className="relative shrink-0 w-36 h-36">
            <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-strong)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={color}
                strokeWidth="3" strokeDasharray={dash} strokeLinecap="round"
                className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>{pct.toFixed(0)}%</span>
              <span className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>Health Risk</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <span className={`inline-block text-base font-bold px-5 py-2 rounded-full mb-4 ${CAT_BADGE[oa.riskCategory]}`}>
              {friendlyCat}
            </span>
            <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-body)" }}>
              {pct < 25
                ? "Great news! Your overall health readings are within normal range. Keep maintaining your healthy lifestyle."
                : pct < 50
                  ? "Some of your health readings need attention. Consider consulting your doctor for a routine check-up."
                  : pct < 75
                    ? "Several health parameters show elevated risk. We recommend scheduling an appointment with your healthcare provider."
                    : "Your readings indicate significant health concerns. Please consult a healthcare professional as soon as possible."}
            </p>
            {oa.highestRiskParameter && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Focus area: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{highLabel}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
