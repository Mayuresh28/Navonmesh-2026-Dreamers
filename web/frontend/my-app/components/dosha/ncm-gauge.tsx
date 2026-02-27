"use client";

import { motion } from "framer-motion";
import { getRiskStyle } from "./types";

export function NCMGauge({ value, category }: { value: number; category: string }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / 100, 1);
  const offset = circumference * (1 - progress);
  const style = getRiskStyle(category);

  const gaugeColor =
    category === "Low" ? "#10b981" :
    category === "Moderate" ? "#f59e0b" :
    category === "High" ? "#f97316" : "#ef4444";

  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <motion.circle
          cx="100" cy="100" r={radius} fill="none"
          stroke={gaugeColor} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-gray-900"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {value.toFixed(1)}
        </motion.span>
        <span className="text-sm text-gray-500 font-medium mt-1">/ 100</span>
        <span className={`text-xs font-bold mt-2 px-3 py-1 rounded-full ${style.badge}`}>
          {category === "Low" ? "Normal" : category}
        </span>
      </div>
    </div>
  );
}
