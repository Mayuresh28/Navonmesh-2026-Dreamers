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
  const pranaClass = lvl === "low" ? "ok" : lvl === "moderate" ? "warn" : "bad";

  return (
    <div className={`prana-card ${pranaClass}`}>
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--teal-bg)", border: "1.5px solid var(--border)" }}>
              <span style={{ color: "var(--teal)" }}>
                {IconFn ? IconFn("w-6 h-6") : Icons.activity("w-6 h-6")}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{d.label}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{d.unit}</p>
            </div>
          </div>
          <span className={`prana-badge prana-badge-${pranaClass}`}>
            {riskLabel(m.riskScore)}
          </span>
        </div>
        <RiskBar score={m.riskScore} />
        <p className="text-sm mt-3" style={{ color: "var(--text-body)" }}>{riskDescription(m.riskScore)}</p>
      </div>

      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border)" }}>
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Average Value</p>
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {m.mean.toFixed(1)} <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>{d.unit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Readings</p>
          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{m.sampleCount}</p>
        </div>
      </div>
    </div>
  );
}
