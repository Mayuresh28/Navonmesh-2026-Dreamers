"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { getRiskColor, getRiskMessage, type PredictionResult } from "./types";

function getRiskIcon(riskClass: string) {
  const lower = riskClass.toLowerCase();
  if (lower === "low") return <CheckCircle className="w-10 h-10" />;
  if (lower === "high") return <AlertTriangle className="w-10 h-10" />;
  return <ShieldCheck className="w-10 h-10" />;
}

export function RiskCard({ prediction, onRerun }: { prediction: PredictionResult; onRerun: () => void }) {
  const riskColors = getRiskColor(prediction.predicted_class);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`relative overflow-hidden rounded-[28px] p-8 md:p-10 border ${riskColors.border}/30 bg-gradient-to-br from-card to-card/80 shadow-lg`}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className={`w-28 h-28 rounded-full ${riskColors.bg}/20 flex items-center justify-center border-2 ${riskColors.border}/40 mb-4`}
          >
            <span className={riskColors.text}>{getRiskIcon(prediction.predicted_class)}</span>
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`text-3xl md:text-4xl font-bold ${riskColors.text} tracking-tight`}
          >
            {prediction.predicted_class}
          </motion.span>
          <span className="text-text-secondary text-sm mt-1">Risk Level</span>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            {getRiskMessage(prediction.predicted_class)}
          </h2>
          <p className="text-text-secondary leading-relaxed">
            This assessment is based on your BMI, genetic risk factors, age-adjusted risk,
            and baseline health indicators analyzed by our Random Forest ML model.
          </p>
          <button
            onClick={onRerun}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-[12px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Re-run Analysis
          </button>
        </div>
      </div>
    </motion.div>
  );
}
