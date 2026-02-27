"use client";

import { motion } from "framer-motion";
import { Cigarette, Wine, Flame } from "lucide-react";

interface LifestyleCardsProps {
  smokingStatus: string;
  alcoholUse: string;
  gender: string;
  weight: number;
  height: number;
  age: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function LifestyleCards({ smokingStatus, alcoholUse, gender, weight, height, age }: LifestyleCardsProps) {
  const dailyCalories = Math.round(
    gender === "male"
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
  );

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-6"
    >
      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-status-high/20 flex items-center justify-center">
            <Cigarette className="text-status-high w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Smoking</p>
            <p className="text-lg font-bold text-text-primary capitalize">
              {smokingStatus === "never" ? "Never" : smokingStatus === "former" ? "Former" : "Current"}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              {smokingStatus === "never" ? "✓ Great!" : smokingStatus === "former" ? "✓ Quit" : "⚠ Consider quitting"}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-status-mod/20 flex items-center justify-center">
            <Wine className="text-status-mod w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Alcohol</p>
            <p className="text-lg font-bold text-text-primary capitalize">{alcoholUse}</p>
            <p className="text-xs text-text-secondary mt-2">
              {alcoholUse === "never" ? "✓ Excellent" : "Moderate"}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-status-low/20 flex items-center justify-center">
            <Flame className="text-status-low w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-text-secondary text-sm mb-1">Daily Calories</p>
            <p className="text-3xl font-bold text-status-low">{dailyCalories}</p>
            <p className="text-xs text-text-secondary mt-2">kcal/day</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
