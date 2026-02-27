"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface LifestyleFormProps {
  smokingStatus: string;
  alcoholUse: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function LifestyleForm({ smokingStatus, alcoholUse, onChange }: LifestyleFormProps) {
  return (
    <div className="p-6 rounded-[20px] bg-gradient-to-br from-status-low/10 to-transparent border border-status-low/20">
      <h2 className="text-lg font-semibold text-status-low mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Lifestyle Information
      </h2>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <label className="block text-sm font-medium text-text-primary mb-3">Smoking Status</label>
          <div className="space-y-2">
            {["never", "former", "current"].map((status) => (
              <label key={status} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="smokingStatus" value={status}
                  checked={smokingStatus === status} onChange={onChange} className="w-4 h-4" />
                <span className="text-text-secondary capitalize">
                  {status === "never" ? "Never Smoked" : status === "former" ? "Former Smoker" : "Current Smoker"}
                </span>
              </label>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <label className="block text-sm font-medium text-text-primary mb-3">Alcohol Use</label>
          <div className="space-y-2">
            {["never", "occasional", "moderate", "heavy"].map((use) => (
              <label key={use} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="alcoholUse" value={use}
                  checked={alcoholUse === use} onChange={onChange} className="w-4 h-4" />
                <span className="text-text-secondary capitalize">{use}</span>
              </label>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
