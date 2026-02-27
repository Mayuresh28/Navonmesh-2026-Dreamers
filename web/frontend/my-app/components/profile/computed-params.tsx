"use client";

import { motion } from "framer-motion";
import { Calculator, Dna, Clock } from "lucide-react";

interface ComputedParamsProps {
  bmi?: number;
  height: number;
  weight: number;
  geneticRiskScore?: number;
  ageRiskMultiplier?: number;
  age: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function bmiColor(bmi: number) {
  if (bmi < 18.5) return { icon: "text-status-mod", bg: "bg-status-mod/20", val: "text-status-mod" };
  if (bmi < 25)   return { icon: "text-status-low", bg: "bg-status-low/20", val: "text-status-low" };
  if (bmi < 30)   return { icon: "text-status-mod", bg: "bg-status-mod/20", val: "text-status-mod" };
  return { icon: "text-status-high", bg: "bg-status-high/20", val: "text-status-high" };
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function ComputedParams({ bmi, height, weight, geneticRiskScore, ageRiskMultiplier, age }: ComputedParamsProps) {
  const computedBmi = bmi ?? weight / ((height / 100) * (height / 100));
  const grs = geneticRiskScore ?? 0;
  const arm = ageRiskMultiplier ?? (1 + age / 100);
  const bc = bmiColor(computedBmi);
  const grsColor = grs >= 0.5 ? "status-high" : grs > 0 ? "status-mod" : "status-low";

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-6"
    >
      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bc.bg}`}>
            <Calculator className={`w-7 h-7 ${bc.icon}`} />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">BMI</p>
            <p className={`text-4xl font-bold ${bc.val}`}>{computedBmi.toFixed(1)}</p>
            <p className="text-xs text-text-secondary mt-2">{bmiCategory(computedBmi)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${grsColor}/20`}>
            <Dna className={`w-7 h-7 text-${grsColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Genetic Risk</p>
            <p className={`text-4xl font-bold text-${grsColor}`}>{grs}</p>
            <p className="text-xs text-text-secondary mt-2">
              {grs === 0 ? "Low risk" : grs < 0.5 ? "Moderate risk" : "High risk"}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/30 flex items-center justify-center">
            <Clock className="text-primary w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Age Risk</p>
            <p className="text-4xl font-bold text-text-primary">{arm.toFixed ? arm.toFixed(2) : arm}</p>
            <p className="text-xs text-text-secondary mt-2">Age + lifestyle factor</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
