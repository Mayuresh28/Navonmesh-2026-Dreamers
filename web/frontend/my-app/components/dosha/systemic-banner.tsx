"use client";

import { motion } from "framer-motion";

interface SystemicBannerProps {
  flag: string;
  ncmIndex: number;
}

export function SystemicBanner({ flag, ncmIndex }: SystemicBannerProps) {
  const isElevated = flag !== "Stable";

  const borderColor  = isElevated ? "rgba(255,96,122,0.28)"  : "rgba(13,229,168,0.30)";
  const bgColor      = isElevated ? "rgba(255,70,100,0.07)"  : "rgba(13,229,168,0.06)";
  const accentLine   = isElevated ? "linear-gradient(90deg,#c4102e,#ff607a)" : "linear-gradient(90deg,#09b885,#0de5a8)";
  const dotColor     = isElevated ? "#ff607a"  : "#0de5a8";
  const dotGlow      = isElevated ? "rgba(255,96,122,0.40)"  : "rgba(13,229,168,0.40)";
  const titleColor   = isElevated ? "#ff607a"  : "#0de5a8";
  const adviceColor  = isElevated ? "#b8cfe8"  : "#b8cfe8";
  const valueColor   = isElevated ? "#ff607a"  : "#0de5a8";

  const advice = isElevated
    ? "Multiple physiological signals show simultaneous deviation. Consult a healthcare professional."
    : "All major physiological systems are operating within expected parameters.";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Syne+Mono&family=Playfair+Display:wght@400;700&display=swap');

        .prana-banner {
          font-family: 'Syne', sans-serif;
          border-radius: 20px;
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.40), 0 1px 3px rgba(0,0,0,0.30);
        }
        .prana-banner::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
        }

        .pb-inner {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        /* Pulsing dot */
        .pb-dot-wrap { flex-shrink: 0; margin-top: 4px; }
        .pb-dot {
          width: 10px; height: 10px; border-radius: 50%;
          animation: pranaPulse 1.8s ease-in-out infinite;
        }
        @keyframes pranaPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.45; transform:scale(0.65); }
        }

        /* Text block */
        .pb-body { flex: 1; }
        .pb-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: #eef5ff; margin-bottom: 5px;
        }
        .pb-title em { font-style: normal; }
        .pb-advice {
          font-family: 'Syne', sans-serif;
          font-size: 13px; line-height: 1.6;
          color: #b8cfe8;
        }

        /* NCM composite block */
        .pb-metric { text-align: right; flex-shrink: 0; }
        .pb-metric-label {
          font-family: 'Syne Mono', monospace;
          font-size: 8px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;
          color: #6a8aac; margin-bottom: 4px;
        }
        .pb-metric-value {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 700; line-height: 1;
        }
        .pb-metric-weights {
          font-family: 'Syne Mono', monospace;
          font-size: 8px; letter-spacing: 0.5px; font-weight: 500;
          color: #3a5472; margin-top: 5px; white-space: nowrap;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="prana-banner"
        style={{ border: `1.5px solid ${borderColor}`, background: bgColor }}
      >
        {/* Accent top line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: accentLine,
        }} />

        <div className="pb-inner">
          {/* Pulsing dot */}
          <div className="pb-dot-wrap">
            <div
              className="pb-dot"
              style={{ background: dotColor, boxShadow: `0 0 8px ${dotGlow}` }}
            />
          </div>

          {/* Text */}
          <div className="pb-body">
            <div className="pb-title">
              Systemic Status:{" "}
              <em style={{ color: titleColor }}>{flag}</em>
            </div>
            <div className="pb-advice">{advice}</div>
          </div>

          {/* NCM composite */}
          <div className="pb-metric">
            <div className="pb-metric-label">NCM Composite</div>
            <div className="pb-metric-value" style={{ color: valueColor }}>
              {ncmIndex.toFixed(1)}
            </div>
            <div className="pb-metric-weights">
              Weights: HRV 35% · EEG 25% · EMG 20% · Stress 20%
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}