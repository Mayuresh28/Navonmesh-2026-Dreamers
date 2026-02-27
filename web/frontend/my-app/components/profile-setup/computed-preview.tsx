"use client";

import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

interface ComputedPreviewProps {
  age: string;
  height: string;
  weight: string;
  familyHistory: string;
  smokingStatus: string;
  alcoholUse: string;
}

export function ComputedPreview({ age, height, weight, familyHistory, smokingStatus, alcoholUse }: ComputedPreviewProps) {
  if (!age || !height || !weight) return null;

  const h = parseInt(height) / 100;
  const bmi = parseFloat((parseInt(weight) / (h * h)).toFixed(1));
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor = bmi < 18.5 ? "text-status-medium" : bmi < 25 ? "text-status-low" : bmi < 30 ? "text-status-medium" : "text-status-high";

  let grs = 0;
  if (familyHistory.trim().length > 0) grs += 0.4;
  if (smokingStatus === "current") grs += 0.3;
  else if (smokingStatus === "former") grs += 0.15;
  if (alcoholUse === "heavy") grs += 0.3;
  else if (alcoholUse === "moderate") grs += 0.15;
  else if (alcoholUse === "occasional") grs += 0.05;
  grs = parseFloat(Math.min(grs, 1).toFixed(2));
  const grsColor = grs >= 0.5 ? "text-status-high" : grs > 0 ? "text-status-medium" : "text-status-low";

  let arm = 1 + parseInt(age) / 100;
  if (smokingStatus === "current") arm += 0.15;
  else if (smokingStatus === "former") arm += 0.05;
  if (alcoholUse === "heavy") arm += 0.1;
  else if (alcoholUse === "moderate") arm += 0.05;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85 }}
      className="p-6 rounded-[20px] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
    >
      <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        Computed Health Parameters
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/60 rounded-2xl p-4 border border-border-soft text-center">
          <p className="text-xs text-text-secondary mb-1">BMI</p>
          <p className={`text-2xl font-bold ${bmiColor}`}>{isFinite(bmi) ? bmi : "—"}</p>
          <p className={`text-xs font-medium mt-1 ${bmiColor}`}>{isFinite(bmi) ? bmiCategory : ""}</p>
        </div>
        <div className="bg-card/60 rounded-2xl p-4 border border-border-soft text-center">
          <p className="text-xs text-text-secondary mb-1">Genetic Risk Score</p>
          <p className={`text-2xl font-bold ${grsColor}`}>{grs}</p>
          <p className="text-xs font-medium mt-1 text-text-secondary">
            {grs === 0 ? "Low risk" : grs < 0.5 ? "Moderate risk" : "High risk"}
          </p>
        </div>
        <div className="bg-card/60 rounded-2xl p-4 border border-border-soft text-center">
          <p className="text-xs text-text-secondary mb-1">Age Risk Multiplier</p>
          <p className="text-2xl font-bold text-text-primary">{arm.toFixed(2)}</p>
          <p className="text-xs font-medium mt-1 text-text-secondary">Age + lifestyle factor</p>
        </div>
      </div>
    </motion.div>
  );
}
