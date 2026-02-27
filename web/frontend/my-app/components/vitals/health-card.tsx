"use client";

import { Icons } from "@/components/icons/health-icons";
import { RiskBar, riskLevel, riskLabel, riskDescription, RISK_COLORS } from "@/components/ui/risk-styles";
import { DISPLAY } from "./constants";
import type { ParameterMetrics } from "@/app/dynamic/healthEngine";

export function HealthCard({ eKey, m }: { eKey: string; m: ParameterMetrics }) {
  const d = DISPLAY[eKey] ?? { label: eKey, unit: "" };
  const lvl = riskLevel(m.riskScore);
  const colors = RISK_COLORS[lvl];
  const IconFn = Icons[eKey];

  return (
    <div className={`rounded-2xl bg-white border-l-4 ${colors.cardBorder} border border-gray-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}>
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center ${colors.icon}`}>
              {IconFn ? IconFn("w-6 h-6") : Icons.activity("w-6 h-6")}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{d.label}</h3>
              <p className="text-sm text-gray-400">{d.unit}</p>
            </div>
          </div>
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${colors.badge}`}>
            {riskLabel(m.riskScore)}
          </span>
        </div>
        <RiskBar score={m.riskScore} />
        <p className="text-sm text-gray-500 mt-3">{riskDescription(m.riskScore)}</p>
      </div>

      <div className={`px-5 py-3 ${colors.bg} border-t ${colors.border} flex items-center justify-between`}>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Average Value</p>
          <p className="text-lg font-bold text-gray-900">
            {m.mean.toFixed(1)} <span className="text-sm font-normal text-gray-400">{d.unit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-0.5">Readings</p>
          <p className="text-lg font-bold text-gray-900">{m.sampleCount}</p>
        </div>
      </div>
    </div>
  );
}
