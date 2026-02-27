"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/icons/health-icons";
import type { NCMResult } from "./types";

const colorMap: Record<string, string> = {
  ecg_samples:        "ok",
  eeg_samples:        "blue",
  emg_samples:        "warn",
  heart_rate_samples: "ok",
};

/** Data summary + computed features tables for NCM results */
export function DataDetails({ result }: { result: NCMResult }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Syne+Mono&family=Playfair+Display:ital,wght@0,400;0,700;1,300;1,400&display=swap');

        .prana-vessel {
          background: #132240;
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.40), 0 1px 3px rgba(0,0,0,0.30);
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
          font-family: 'Syne', sans-serif;
        }
        .prana-vessel::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #09b885, #18d8f5, transparent);
          opacity: 0.55;
        }

        /* Section header */
        .prana-sh {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px;
        }
        .prana-accent-bar {
          width: 4px; height: 24px; border-radius: 3px;
          background: linear-gradient(180deg, #09b885, #0de5a8);
          flex-shrink: 0;
        }
        .prana-sh-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: #eef5ff; margin: 0;
        }

        /* Sample tiles grid */
        .prana-sample-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (min-width: 520px) {
          .prana-sample-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .prana-sample-tile {
          display: flex; align-items: center; gap: 11px;
          background: #0f1e36;
          border-radius: 16px; padding: 13px 14px;
          border: 1.5px solid rgba(255,255,255,0.09);
          position: relative; overflow: hidden;
        }
        .prana-sample-tile::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          border-radius: 16px 16px 0 0;
        }
        .prana-sample-tile.ok::after   { background: linear-gradient(90deg,#09b885,#0de5a8); }
        .prana-sample-tile.blue::after { background: linear-gradient(90deg,#2c7de0,#4a9eff); }
        .prana-sample-tile.warn::after { background: linear-gradient(90deg,#d4820a,#ffb83f); }

        .prana-tile-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .prana-tile-icon.ok   { background: rgba(13,229,168,0.10); border: 1.5px solid rgba(13,229,168,0.28); color: #0de5a8; }
        .prana-tile-icon.blue { background: rgba(74,158,255,0.10); border: 1.5px solid rgba(74,158,255,0.25); color: #4a9eff; }
        .prana-tile-icon.warn { background: rgba(255,162,38,0.12); border: 1.5px solid rgba(255,162,38,0.30); color: #ffb83f; }

        .prana-tile-label {
          font-family: 'Syne Mono', monospace;
          font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;
          color: #6a8aac; margin-bottom: 3px;
        }
        .prana-tile-val {
          font-family: 'Playfair Display', serif;
          font-size: 21px; font-weight: 700; line-height: 1;
          color: #eef5ff;
        }

        /* Footer note */
        .prana-note {
          font-family: 'Syne Mono', monospace;
          font-size: 9px; letter-spacing: 1px;
          color: #3a5472; margin-top: 14px; font-weight: 500;
        }
        .prana-note span { color: #0de5a8; }

        /* Features table */
        .prana-table-wrap { overflow-x: auto; }
        table.prana-table {
          width: 100%; border-collapse: collapse;
        }
        .prana-table thead tr {
          border-bottom: 1.5px solid rgba(255,255,255,0.09);
        }
        .prana-table th {
          font-family: 'Syne Mono', monospace;
          font-size: 8.5px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;
          color: #6a8aac; padding: 8px 12px; text-align: left;
        }
        .prana-table th:nth-child(2) { text-align: right; }

        .prana-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s;
        }
        .prana-table tbody tr:last-child { border-bottom: none; }
        .prana-table tbody tr:hover { background: rgba(13,229,168,0.04); }

        .prana-table td { padding: 11px 12px; vertical-align: middle; }

        .td-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 600; color: #eef5ff;
        }
        .td-val {
          font-family: 'Syne Mono', monospace;
          font-size: 16px; font-weight: 700; text-align: right; white-space: nowrap;
          color: #eef5ff;
        }
        .td-unit {
          font-family: 'Syne Mono', monospace;
          font-size: 9.5px; letter-spacing: 1px; font-weight: 600;
          color: #6a8aac;
        }
        .td-desc {
          font-size: 11.5px; color: #6a8aac; line-height: 1.55;
        }
      `}</style>

      {/* Data Summary */}
      {result.data_summary && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="prana-vessel"
        >
          <div className="prana-sh">
            <div className="prana-accent-bar" />
            <h3 className="prana-sh-title">Data Summary</h3>
          </div>

          <div className="prana-sample-grid">
            {[
              { label: "ECG Samples", value: result.data_summary.ecg_samples,        icon: Icons.ecg,   key: "ecg_samples"        },
              { label: "EEG Samples", value: result.data_summary.eeg_samples,        icon: Icons.eeg,   key: "eeg_samples"        },
              { label: "EMG Samples", value: result.data_summary.emg_samples,        icon: Icons.emg,   key: "emg_samples"        },
              { label: "HR Samples",  value: result.data_summary.heart_rate_samples, icon: Icons.heart, key: "heart_rate_samples" },
            ].map((d) => {
              const color = colorMap[d.key] ?? "ok";
              return (
                <div key={d.label} className={`prana-sample-tile ${color}`}>
                  <div className={`prana-tile-icon ${color}`}>
                    {d.icon("w-4 h-4")}
                  </div>
                  <div>
                    <div className="prana-tile-label">{d.label}</div>
                    <div className="prana-tile-val">{d.value.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="prana-note">
            Analyzed{" "}
            <span>{result.data_summary.entries_analyzed}</span>{" "}
            database{" "}
            {result.data_summary.entries_analyzed === 1 ? "entry" : "entries"}
            {" · "}
            HRV SDNN: <span>{result.features.hrv_sdnn.toFixed(1)} ms</span>
          </p>
        </motion.div>
      )}

      {/* Computed Features Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="prana-vessel"
      >
        <div className="prana-sh">
          <div className="prana-accent-bar" />
          <h3 className="prana-sh-title">Computed Features</h3>
        </div>

        <div className="prana-table-wrap">
          <table className="prana-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Heart Rate",   val: result.features.heart_rate.toFixed(1),   unit: "bpm", desc: "Mean resting heart rate from ECG/HR data"                  },
                { name: "HRV SDNN",     val: result.features.hrv_sdnn.toFixed(1),     unit: "ms",  desc: "Standard deviation of R-R intervals (autonomic health)"   },
                { name: "Stress Ratio", val: result.features.stress_ratio.toFixed(3), unit: "β/α", desc: "Beta-to-alpha EEG power ratio (cognitive stress)"          },
                { name: "EMG RMS",      val: result.features.emg_rms.toFixed(4),      unit: "mV",  desc: "Root mean square of EMG signal (muscle activation)"        },
              ].map((f) => (
                <tr key={f.name}>
                  <td><div className="td-name">{f.name}</div></td>
                  <td><div className="td-val">{f.val}</div></td>
                  <td><div className="td-unit">{f.unit}</div></td>
                  <td><div className="td-desc">{f.desc}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}