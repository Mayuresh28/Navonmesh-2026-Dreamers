"use client";

import { motion } from "framer-motion";
import { Icons } from "@/components/icons/health-icons";
import type { NCMResult } from "./types";

/** Data summary + computed features tables for NCM results */
export function DataDetails({ result }: { result: NCMResult }) {
  return (
    <>
      {/* Data Summary */}
      {result.data_summary && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }} className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 rounded-full bg-primary" />
            <h3 className="font-bold text-gray-900">Data Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "ECG Samples", value: result.data_summary.ecg_samples, icon: Icons.ecg },
              { label: "EEG Samples", value: result.data_summary.eeg_samples, icon: Icons.eeg },
              { label: "EMG Samples", value: result.data_summary.emg_samples, icon: Icons.emg },
              { label: "HR Samples", value: result.data_summary.heart_rate_samples, icon: Icons.heart },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-gray-400">{d.icon("w-5 h-5")}</span>
                <div>
                  <p className="text-xs text-gray-500">{d.label}</p>
                  <p className="text-lg font-bold text-gray-800">{d.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Analyzed {result.data_summary.entries_analyzed} database{" "}
            {result.data_summary.entries_analyzed === 1 ? "entry" : "entries"} · HRV SDNN:{" "}
            {result.features.hrv_sdnn.toFixed(1)} ms
          </p>
        </motion.div>
      )}

      {/* Computed Features Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }} className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 rounded-full bg-primary" />
          <h3 className="font-bold text-gray-900">Computed Features</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Feature</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Value</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Unit</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Heart Rate", val: result.features.heart_rate.toFixed(1), unit: "bpm", desc: "Mean resting heart rate from ECG/HR data" },
                { name: "HRV SDNN", val: result.features.hrv_sdnn.toFixed(1), unit: "ms", desc: "Standard deviation of R-R intervals (autonomic health)" },
                { name: "Stress Ratio", val: result.features.stress_ratio.toFixed(3), unit: "β/α", desc: "Beta-to-alpha EEG power ratio (cognitive stress)" },
                { name: "EMG RMS", val: result.features.emg_rms.toFixed(4), unit: "mV", desc: "Root mean square of EMG signal (muscle activation)" },
              ].map((f) => (
                <tr key={f.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-3 font-medium text-gray-800">{f.name}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">{f.val}</td>
                  <td className="py-3 px-3 text-gray-500">{f.unit}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}
