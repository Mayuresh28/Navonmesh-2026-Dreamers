"use client";

import { motion } from "framer-motion";

interface SystemicBannerProps {
  flag: string;
  ncmIndex: number;
}

export function SystemicBanner({ flag, ncmIndex }: SystemicBannerProps) {
  const isElevated = flag !== "Stable";
  const bg = isElevated ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200";
  const dotColor = isElevated ? "bg-red-500" : "bg-emerald-500";
  const textColor = isElevated ? "text-red-800" : "text-emerald-800";
  const subTextColor = isElevated ? "text-red-600" : "text-emerald-600";

  const advice = isElevated
    ? "Multiple physiological signals show simultaneous deviation. Consult a healthcare professional."
    : "All major physiological systems are operating within expected parameters.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`rounded-[20px] border-2 ${bg} p-6`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <div className={`w-3 h-3 rounded-full ${dotColor} animate-pulse`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${textColor}`}>Systemic Status: {flag}</h3>
          <p className={`text-sm mt-1 ${subTextColor}`}>{advice}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 mb-1">NCM Composite</p>
          <p className={`text-2xl font-bold ${textColor}`}>{ncmIndex.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Weights: HRV 35% · EEG 25% · EMG 20% · Stress 20%
          </p>
        </div>
      </div>
    </motion.div>
  );
}
