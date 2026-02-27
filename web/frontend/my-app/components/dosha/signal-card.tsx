"use client";

import { motion } from "framer-motion";
import type { Prediction } from "./types";
import { getPredictionStyle } from "./types";

interface SignalCardProps {
  title: string;
  subtitle: string;
  icon: (cls?: string) => React.ReactNode;
  prediction: Prediction;
  featureLabel: string;
  featureValue: string;
  featureUnit: string;
  delay?: number;
}

export function SignalCard({ title, subtitle, icon, prediction, featureLabel, featureValue, featureUnit, delay = 0 }: SignalCardProps) {
  const pStyle = getPredictionStyle(prediction.risk_level);
  const prob = prediction.probability * 100;

  /* Map risk_level to PRĀṆA color tokens */
  const isLow  = prediction.risk_level === "low";
  const isHigh = prediction.risk_level === "high";
  const tone   = isLow ? "ok" : isHigh ? "bad" : "warn";

  const borderColor = isLow  ? "rgba(13,229,168,0.30)"   : isHigh ? "rgba(255,96,122,0.28)"   : "rgba(255,184,63,0.30)";
  const iconBg      = isLow  ? "rgba(13,229,168,0.10)"   : isHigh ? "rgba(255,96,122,0.10)"   : "rgba(255,184,63,0.12)";
  const iconBorder  = isLow  ? "rgba(13,229,168,0.28)"   : isHigh ? "rgba(255,96,122,0.28)"   : "rgba(255,184,63,0.30)";
  const iconColor   = isLow  ? "#0de5a8"                 : isHigh ? "#ff607a"                  : "#ffb83f";
  const badgeColor  = iconColor;
  const badgeBg     = iconBg;
  const badgeBorder = iconBorder;
  const barGradient = isLow  ? "linear-gradient(90deg,#09b885,#0de5a8)" : isHigh ? "linear-gradient(90deg,#c4102e,#ff607a)" : "linear-gradient(90deg,#d4820a,#ffb83f)";
  const accentLine  = isLow  ? "linear-gradient(90deg,#09b885,#0de5a8)" : isHigh ? "linear-gradient(90deg,#c4102e,#ff607a)" : "linear-gradient(90deg,#d4820a,#ffb83f)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Syne+Mono&family=Playfair+Display:ital,wght@0,400;0,700&display=swap');

        .prana-signal-card {
          font-family: 'Syne', sans-serif;
          background: #132240;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.40), 0 1px 3px rgba(0,0,0,0.30);
        }
        .prana-signal-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }

        /* Top row */
        .psc-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .psc-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .psc-icon {
          width: 46px; height: 46px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .psc-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 700;
          color: #eef5ff; margin-bottom: 3px;
        }
        .psc-subtitle {
          font-family: 'Syne Mono', monospace;
          font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;
          color: #6a8aac;
        }
        .psc-state-badge {
          font-family: 'Syne Mono', monospace;
          font-size: 8px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700;
          padding: 5px 11px; border-radius: 9px;
          white-space: nowrap; flex-shrink: 0;
        }

        /* Risk bar row */
        .psc-risk-label-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          align-items: center;
        }
        .psc-risk-label {
          font-family: 'Syne Mono', monospace;
          font-size: 8.5px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;
          color: #6a8aac;
        }
        .psc-risk-pct {
          font-family: 'Syne Mono', monospace;
          font-size: 13px; font-weight: 700;
        }
        .psc-bar-track {
          width: 100%; height: 5px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px; overflow: hidden;
        }
        .psc-bar-fill {
          height: 100%; border-radius: 3px;
        }

        /* Feature chip */
        .psc-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f1e36;
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          padding: 12px 15px;
        }
        .psc-feat-label {
          font-family: 'Syne Mono', monospace;
          font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;
          color: #6a8aac;
        }
        .psc-feat-value {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700;
          color: #eef5ff;
          margin-left: auto;
        }
        .psc-feat-unit {
          font-family: 'Syne Mono', monospace;
          font-size: 9px; letter-spacing: 1px; font-weight: 600;
          color: #6a8aac;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="prana-signal-card"
        style={{ border: `1.5px solid ${borderColor}` }}
      >
        {/* Accent top line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: accentLine,
        }} />

        {/* Top row */}
        <div className="psc-top">
          <div className="psc-title-group">
            <div
              className="psc-icon"
              style={{ background: iconBg, border: `1.5px solid ${iconBorder}`, color: iconColor }}
            >
              {icon("w-5 h-5")}
            </div>
            <div>
              <div className="psc-title">{title}</div>
              <div className="psc-subtitle">{subtitle}</div>
            </div>
          </div>
          <span
            className="psc-state-badge"
            style={{ color: badgeColor, background: badgeBg, border: `1.5px solid ${badgeBorder}` }}
          >
            {prediction.state}
          </span>
        </div>

        {/* Risk probability bar */}
        <div>
          <div className="psc-risk-label-row">
            <span className="psc-risk-label">Risk Probability</span>
            <span className="psc-risk-pct" style={{ color: iconColor }}>{prob.toFixed(1)}%</span>
          </div>
          <div className="psc-bar-track">
            <motion.div
              className="psc-bar-fill"
              style={{ background: barGradient }}
              initial={{ width: 0 }}
              animate={{ width: `${prob}%` }}
              transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Feature chip */}
        <div className="psc-feature">
          <span className="psc-feat-label">{featureLabel}</span>
          <span className="psc-feat-value">{featureValue}</span>
          <span className="psc-feat-unit">{featureUnit}</span>
        </div>
      </motion.div>
    </>
  );
}