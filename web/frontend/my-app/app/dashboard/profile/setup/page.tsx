"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData, type UserProfile } from "@/lib/profile-hook";
import { motion } from "framer-motion";
import { HeartPulse, ArrowRight, CheckCircle, Activity, ShieldCheck, Calculator } from "lucide-react";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";
import { PersonalInfo } from "@/components/profile-setup/personal-info";
import { LifestyleForm } from "@/components/profile-setup/lifestyle-form";
import { MedicalHistoryForm } from "@/components/profile-setup/medical-history-form";
import { ComputedPreview } from "@/components/profile-setup/computed-preview";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createProfile } = useProfileData(user?.uid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    age: "", gender: "male" as "male" | "female" | "other",
    height: "", weight: "", familyHistory: "",
    smokingStatus: "never" as "never" | "former" | "current",
    alcoholUse: "never" as "never" | "occasional" | "moderate" | "heavy",
    existingConditions: [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      existingConditions: prev.existingConditions.includes(condition)
        ? prev.existingConditions.filter((c) => c !== condition)
        : [...prev.existingConditions, condition],
    }));
  };

  const validateForm = () => {
    if (!formData.age || !formData.height || !formData.weight) { setError("Please fill in all required fields"); return false; }
    const a = parseInt(formData.age), h = parseInt(formData.height), w = parseInt(formData.weight);
    if (a < 1 || a > 150) { setError("Age must be between 1 and 150"); return false; }
    if (h < 50 || h > 250) { setError("Height must be between 50cm and 250cm"); return false; }
    if (w < 20 || w > 300) { setError("Weight must be between 20kg and 300kg"); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const age = parseInt(formData.age), heightCm = parseInt(formData.height), weight = parseInt(formData.weight);
      const heightM = heightCm / 100;
      const profileData: Omit<UserProfile, "userId" | "_id" | "createdAt" | "updatedAt"> = {
        age, gender: formData.gender, height: heightCm, weight,
        familyHistory: formData.familyHistory, smokingStatus: formData.smokingStatus,
        alcoholUse: formData.alcoholUse, existingConditions: formData.existingConditions,
        bmi: parseFloat((weight / (heightM * heightM)).toFixed(1)),
        geneticRiskScore: formData.familyHistory.trim().length > 0 ? 1 : 0,
        ageRiskMultiplier: parseFloat((1 + age / 100).toFixed(2)),
      };
      const ok = await createProfile(profileData);
      if (ok) { setSuccess(true); setTimeout(() => router.push("/dashboard"), 1500); }
      else setError("Failed to save profile");
    } finally { setLoading(false); }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary bg-transparent">
        <GlassmorphicBackground />

        <nav className="w-full px-6 py-6 md:px-12 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm border border-border-soft">
              <HeartPulse className="text-primary w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">धन्वंतरी</span>
          </div>
        </nav>

        <main className="flex-grow flex items-center justify-center px-6 md:px-12 z-10 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
            <div className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-accent/30 shadow-[0_8px_32px_rgb(90_127_232_/_0.15)]">
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Complete Your Profile</h1>
              <p className="text-text-secondary mb-8">Help us understand your health better</p>

              {success ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12">
                  <CheckCircle className="w-16 h-16 text-status-low mb-4" />
                  <p className="text-lg font-semibold text-status-low">Profile Saved Successfully!</p>
                  <p className="text-text-secondary mt-2">Redirecting to dashboard...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-status-high/10 border border-status-high/30 rounded-[16px] p-4">
                      <p className="text-status-high text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                  <PersonalInfo formData={formData} onChange={handleInputChange} />
                  <LifestyleForm smokingStatus={formData.smokingStatus} alcoholUse={formData.alcoholUse} onChange={handleInputChange} />
                  <MedicalHistoryForm familyHistory={formData.familyHistory} existingConditions={formData.existingConditions}
                    onChange={handleInputChange} onConditionToggle={handleConditionToggle} />
                  <ComputedPreview age={formData.age} height={formData.height} weight={formData.weight}
                    familyHistory={formData.familyHistory} smokingStatus={formData.smokingStatus} alcoholUse={formData.alcoholUse} />
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                    type="submit" disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-8">
                    {loading ? "Saving Profile..." : "Complete Profile"}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
