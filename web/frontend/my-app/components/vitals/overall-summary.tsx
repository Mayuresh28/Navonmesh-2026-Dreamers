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
    <div className="rounded-2xl bg-white border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Health Summary</h2>

        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Donut chart */}
          <div className="relative shrink-0 w-36 h-36">
            <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={color}
                strokeWidth="3" strokeDasharray={dash} strokeLinecap="round"
                className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{pct.toFixed(0)}%</span>
              <span className="text-xs text-gray-400 font-medium mt-0.5">Health Risk</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <span className={`inline-block text-base font-bold px-5 py-2 rounded-full mb-4 ${CAT_BADGE[oa.riskCategory]}`}>
              {friendlyCat}
            </span>
            <p className="text-base text-gray-600 leading-relaxed mb-4">
              {pct < 25
                ? "Great news! Your overall health readings are within normal range. Keep maintaining your healthy lifestyle."
                : pct < 50
                  ? "Some of your health readings need attention. Consider consulting your doctor for a routine check-up."
                  : pct < 75
                    ? "Several health parameters show elevated risk. We recommend scheduling an appointment with your healthcare provider."
                    : "Your readings indicate significant health concerns. Please consult a healthcare professional as soon as possible."}
            </p>
            {oa.highestRiskParameter && (
              <p className="text-sm text-gray-500">
                Focus area: <span className="font-semibold text-gray-800">{highLabel}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
