"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { getRiskColor, type PredictionResult } from "./types";

export function ProbabilityBars({ prediction }: { prediction: PredictionResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Class Probabilities
      </h3>

      <div className="space-y-5">
        {Object.entries(prediction.probabilities)
          .sort(([, a], [, b]) => b - a)
          .map(([label, percentage], idx) => {
            const colors = getRiskColor(label);
            const isMax = label === prediction.predicted_class;
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${isMax ? colors.text : "text-text-primary"} flex items-center gap-2`}>
                    {isMax && <span className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`} />}
                    {label}
                  </span>
                  <span className={`font-bold text-lg ${isMax ? colors.text : "text-text-secondary"}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-border-soft/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + idx * 0.1, ease: "easeOut" }}
                    className={`h-full rounded-full ${colors.bg} ${isMax ? "shadow-sm" : "opacity-60"}`}
                  />
                </div>
              </motion.div>
            );
          })}
      </div>
    </motion.div>
  );
}
