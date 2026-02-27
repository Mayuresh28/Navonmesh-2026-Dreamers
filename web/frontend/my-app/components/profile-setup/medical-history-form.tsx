"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const CONDITION_OPTIONS = [
  "Diabetes", "Hypertension", "Heart Disease", "Asthma",
  "Thyroid", "Kidney Disease", "Liver Disease", "Cancer", "None",
];

interface MedicalHistoryFormProps {
  familyHistory: string;
  existingConditions: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onConditionToggle: (condition: string) => void;
}

export function MedicalHistoryForm({ familyHistory, existingConditions, onChange, onConditionToggle }: MedicalHistoryFormProps) {
  return (
    <div className="p-6 rounded-[20px] bg-gradient-to-br from-status-high/10 to-transparent border border-status-high/20">
      <h2 className="text-lg font-semibold text-status-high mb-6 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" />
        Medical History
      </h2>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <label className="block text-sm font-medium text-text-primary mb-2">Family History</label>
          <textarea
            name="familyHistory"
            value={familyHistory}
            onChange={onChange}
            placeholder="e.g., Father has diabetes, Mother has hypertension"
            rows={3}
            className="input-field w-full resize-none"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <label className="block text-sm font-medium text-text-primary mb-3">Existing Medical Conditions</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CONDITION_OPTIONS.map((condition) => (
              <motion.button
                key={condition}
                type="button"
                onClick={() => onConditionToggle(condition)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-all border ${
                  existingConditions.includes(condition)
                    ? "bg-primary text-white border-primary"
                    : "bg-background border-border-soft text-text-primary hover:border-primary/50"
                }`}
              >
                {condition}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
