"use client";

import { motion } from "framer-motion";
import { TrendingUp, HeartPulse, Dna, Clock, Target, Brain } from "lucide-react";
import type { PredictionResult } from "./types";

export function FeatureCards({ prediction }: { prediction: PredictionResult }) {
  const inputFeatures = [
    { label: "BMI", value: prediction.input_features.BMI.toFixed(1), icon: <HeartPulse className="w-5 h-5" />, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
    { label: "Genetic Risk", value: prediction.input_features.Genetic_Risk.toFixed(2), icon: <Dna className="w-5 h-5" />, color: "text-status-high", bgColor: "bg-status-high/10", borderColor: "border-status-high/20" },
    { label: "Age Risk Multiplier", value: prediction.input_features.Age_Risk_Multiplier.toFixed(2), icon: <Clock className="w-5 h-5" />, color: "text-status-mod", bgColor: "bg-status-mod/10", borderColor: "border-status-mod/20" },
    { label: "Baseline Risk", value: prediction.input_features.Baseline_Risk.toFixed(4), icon: <Target className="w-5 h-5" />, color: "text-secondary", bgColor: "bg-secondary/10", borderColor: "border-secondary/20" },
  ];

  const engineeredFeatures = [
    { label: "Composite Risk", value: prediction.engineered_features.Composite_Risk, formula: "BMI×0.3 + GR×0.3 + ARM×0.2 + BR×0.2", color: "from-primary/20 to-accent/20", borderColor: "border-primary/20" },
    { label: "BMI × Genetic", value: prediction.engineered_features.BMI_Genetic, formula: "BMI × Genetic_Risk", color: "from-status-high/20 to-status-mod/20", borderColor: "border-status-high/20" },
    { label: "Age × Baseline", value: prediction.engineered_features.Age_Baseline, formula: "Age_Risk_Multiplier × Baseline_Risk", color: "from-status-mod/20 to-status-low/20", borderColor: "border-status-mod/20" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Features */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Model Input Features
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {inputFeatures.map((feat, idx) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className={`p-4 rounded-[16px] ${feat.bgColor} border ${feat.borderColor} flex flex-col`}
            >
              <div className={`${feat.color} mb-2`}>{feat.icon}</div>
              <span className="text-xs text-text-secondary mb-1">{feat.label}</span>
              <span className={`text-xl font-bold ${feat.color}`}>{feat.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Engineered Features */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
        <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Engineered Features
        </h3>
        <p className="text-text-secondary text-sm mb-5">
          These features are computed internally by the model pipeline for enhanced prediction accuracy.
        </p>
        <div className="space-y-4">
          {engineeredFeatures.map((feat, idx) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className={`p-4 rounded-[16px] bg-gradient-to-r ${feat.color} border ${feat.borderColor}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-text-primary">{feat.label}</span>
                <span className="text-lg font-bold text-text-primary">{feat.value.toFixed(4)}</span>
              </div>
              <span className="text-xs text-text-secondary font-mono">{feat.formula}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
