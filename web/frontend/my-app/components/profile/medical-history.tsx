"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface MedicalHistoryProps {
  familyHistory: string;
  existingConditions: string[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function MedicalHistory({ familyHistory, existingConditions }: MedicalHistoryProps) {
  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="col-span-full card">
      <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2 mb-6">
        <AlertCircle className="text-primary" />
        Medical History
      </h2>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3 uppercase">Family History</p>
          <div className="bg-background rounded-[12px] p-4 border border-border-soft">
            <p className="text-text-primary leading-relaxed">
              {familyHistory || "No family history recorded"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3 uppercase">Existing Conditions</p>
          <div className="flex flex-wrap gap-2">
            {existingConditions.length > 0 ? (
              existingConditions.map((condition) => (
                <motion.span
                  key={condition}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-4 py-2 bg-primary/15 border border-primary/30 text-primary rounded-[12px] text-sm font-medium"
                >
                  {condition}
                </motion.span>
              ))
            ) : (
              <p className="text-text-secondary">No conditions reported</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
