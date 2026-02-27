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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-[20px] border-2 ${pStyle.border} ${pStyle.bg} p-6 flex flex-col gap-4`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${pStyle.badge} flex items-center justify-center`}>
            {icon("w-6 h-6")}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${pStyle.badge}`}>
          {prediction.state}
        </span>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-600">Risk Probability</span>
          <span className={`text-sm font-bold ${pStyle.text}`}>{prob.toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/80 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${pStyle.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${prob}%` }}
            transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-500">{featureLabel}</span>
        <span className="ml-auto text-lg font-bold text-gray-800">{featureValue}</span>
        <span className="text-xs text-gray-400">{featureUnit}</span>
      </div>
    </motion.div>
  );
}
