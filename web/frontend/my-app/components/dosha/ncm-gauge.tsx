"use client";

import { motion } from "framer-motion";
import { getRiskStyle } from "./types";

export function NCMGauge({ value, category }: { value: number; category: string }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / 100, 1);
  const offset = circumference * (1 - progress);
  const style = getRiskStyle(category);

  const gaugeColor =
    category === "Low"      ? "#0de5a8" :
    category === "Moderate" ? "#ffb83f" :
    category === "High"     ? "#f97316" : "#ff607a";

  const glowColor =
    category === "Low"      ? "rgba(13,229,168,0.25)"  :
    category === "Moderate" ? "rgba(255,184,63,0.25)"  :
    category === "High"     ? "rgba(249,115,22,0.25)"  : "rgba(255,96,122,0.25)";

  const badgeClass =
    category === "Low"      ? "prana-badge-ok"   :
    category === "Moderate" ? "prana-badge-warn"  :
    category === "High"     ? "prana-badge-warn"  : "prana-badge-bad";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Syne+Mono&family=Playfair+Display:wght@400;700&display=swap');

        .prana-gauge-wrap {
          position: relative;
          width: 224px;
          height: 224px;
          margin: 0 auto;
        }

        /* Decorative spinning rings — matches Dhanvantari score ring deco */
        .prana-deco-outer {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px dashed rgba(13,229,168,0.30);
          animation: pranaSpinSlow 40s linear infinite;
          pointer-events: none;
        }
        .prana-deco-inner {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.09);
          animation: pranaSpinSlow 25s linear infinite reverse;
          pointer-events: none;
        }
        @keyframes pranaSpinSlow { to { transform: rotate(360deg); } }

        .prana-gauge-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .prana-gauge-value {
          font-family: 'Playfair Display', serif;
          font-size: 52px;
          font-weight: 700;
          line-height: 1;
          color: #eef5ff;
        }

        .prana-gauge-denom {
          font-family: 'Syne Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          color: #6a8aac;
          margin-top: 4px;
          font-weight: 600;
        }

        .prana-gauge-badge {
          font-family: 'Syne Mono', monospace;
          font-size: 8px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 10px;
          margin-top: 10px;
          display: inline-block;
        }
        .prana-badge-ok   { color: #0de5a8; background: rgba(13,229,168,0.12);  border: 1.5px solid rgba(13,229,168,0.28); }
        .prana-badge-warn { color: #ffb83f; background: rgba(255,184,63,0.12);  border: 1.5px solid rgba(255,184,63,0.30); }
        .prana-badge-bad  { color: #ff607a; background: rgba(255,96,122,0.10);  border: 1.5px solid rgba(255,96,122,0.28); }
      `}</style>

      <div className="prana-gauge-wrap">

        {/* Decorative rings */}
        <div className="prana-deco-outer" aria-hidden="true" />
        <div className="prana-deco-inner" aria-hidden="true" />

        {/* SVG gauge */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <defs>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="10"
          />

          {/* Glow halo */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={glowColor}
            strokeWidth="18"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: "blur(8px)" }}
          />

          {/* Animated arc */}
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Inner dashed ring */}
          <circle
            cx="100" cy="100" r="65"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
        </svg>

        {/* Center content */}
        <div className="prana-gauge-center">
          <motion.span
            className="prana-gauge-value"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {value.toFixed(1)}
          </motion.span>

          <span className="prana-gauge-denom">/ 100</span>

          <span className={`prana-gauge-badge ${badgeClass}`}>
            {category === "Low" ? "Normal" : category}
          </span>
        </div>

      </div>
    </>
  );
}