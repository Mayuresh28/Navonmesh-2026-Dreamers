"use client";

import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";

interface PersonalInfoProps {
  formData: { age: string; gender: string; height: string; weight: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function PersonalInfo({ formData, onChange }: PersonalInfoProps) {
  return (
    <div className="p-6 rounded-[20px] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
      <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
        <HeartPulse className="w-5 h-5" />
        Personal Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Age <span className="text-status-high">*</span>
          </label>
          <input type="number" name="age" value={formData.age} onChange={onChange}
            placeholder="Enter your age" min="1" max="150" className="input-field w-full" required />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Gender <span className="text-status-high">*</span>
          </label>
          <select name="gender" value={formData.gender} onChange={onChange} className="input-field w-full" required>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Height (cm) <span className="text-status-high">*</span>
          </label>
          <input type="number" name="height" value={formData.height} onChange={onChange}
            placeholder="e.g., 170" min="50" max="250" className="input-field w-full" required />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Weight (kg) <span className="text-status-high">*</span>
          </label>
          <input type="number" name="weight" value={formData.weight} onChange={onChange}
            placeholder="e.g., 70" min="20" max="300" className="input-field w-full" required />
        </motion.div>
      </div>
    </div>
  );
}
