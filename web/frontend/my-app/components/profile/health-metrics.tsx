"use client";

import { motion } from "framer-motion";
import { Users, Ruler, Scale } from "lucide-react";

interface HealthMetricsProps {
  age: number;
  gender: string;
  height: number;
  weight: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function HealthMetrics({ age, gender, height, weight }: HealthMetricsProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-6"
    >
      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-primary/15 flex items-center justify-center">
            <Users className="text-primary w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Age</p>
            <p className="text-4xl font-bold text-text-primary">{age}</p>
            <p className="text-xs text-text-secondary mt-2 capitalize">{gender}</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-accent/30 flex items-center justify-center">
            <Ruler className="text-primary w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Height</p>
            <p className="text-4xl font-bold text-text-primary">{height}</p>
            <p className="text-xs text-text-secondary mt-2">{(height / 100).toFixed(2)} m</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-status-mod/20 flex items-center justify-center">
            <Scale className="text-status-mod w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Weight</p>
            <p className="text-4xl font-bold text-text-primary">{weight}</p>
            <p className="text-xs text-text-secondary mt-2">
              BMI: {(weight / ((height / 100) * (height / 100))).toFixed(1)}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
