"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData, type UserProfile } from "@/lib/profile-hook";
import { motion } from "framer-motion";
import { HeartPulse, ArrowRight, CheckCircle, Activity, ShieldCheck } from "lucide-react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createProfile } = useProfileData(user?.uid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    age: "",
    gender: "male" as "male" | "female" | "other",
    height: "",
    weight: "",
    familyHistory: "",
    smokingStatus: "never" as "never" | "former" | "current",
    alcoholUse: "never" as "never" | "occasional" | "moderate" | "heavy",
    existingConditions: [] as string[],
  });

  const conditionOptions = [
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Asthma",
    "Thyroid",
    "Kidney Disease",
    "Liver Disease",
    "Cancer",
    "None",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    if (!formData.age || !formData.height || !formData.weight) {
      setError("Please fill in all required fields");
      return false;
    }

    const age = parseInt(formData.age);
    const height = parseInt(formData.height);
    const weight = parseInt(formData.weight);

    if (age < 1 || age > 150) {
      setError("Age must be between 1 and 150");
      return false;
    }

    if (height < 50 || height > 250) {
      setError("Height must be between 50cm and 250cm");
      return false;
    }

    if (weight < 20 || weight > 300) {
      setError("Weight must be between 20kg and 300kg");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ProfileSetup] Form submission started");
    setError("");

    if (!validateForm()) {
      console.log("[ProfileSetup] Form validation failed");
      return;
    }

    setLoading(true);
    console.log("[ProfileSetup] Form validation passed");

    try {
      const profileData: Omit<UserProfile, "createdAt" | "updatedAt"> = {
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        familyHistory: formData.familyHistory,
        smokingStatus: formData.smokingStatus,
        alcoholUse: formData.alcoholUse,
        existingConditions: formData.existingConditions,
      };

      console.log("[ProfileSetup] Profile data constructed:", profileData);
      console.log("[ProfileSetup] Calling createProfile()...");
      const success = await createProfile(profileData);

      console.log("[ProfileSetup] createProfile returned:", success);

      if (success) {
        console.log("[ProfileSetup] Profile creation successful");
        setSuccess(true);
        setTimeout(() => {
          console.log("[ProfileSetup] Redirecting to /dashboard...");
          router.push("/dashboard");
        }, 1500);
      } else {
        console.error("[ProfileSetup] Profile creation failed");
        setError("Failed to save profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary bg-background">
        {/* Soft Background Blur Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-3xl -z-10 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[50%] bg-status-low/20 rounded-full blur-3xl -z-10 mix-blend-multiply" />

        {/* Header */}
        <nav className="w-full px-6 py-6 md:px-12 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm border border-border-soft">
              <HeartPulse className="text-primary w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">धन्वंतरी</span>
          </motion.div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow flex items-center justify-center px-6 md:px-12 z-10 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-accent/30 shadow-[0_8px_32px_rgb(90_127_232_/_0.15)]">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-status-low/5 via-accent/5 to-transparent pointer-events-none" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                  Complete Your Profile
                </h1>
                <p className="text-text-secondary mb-8">
                  Help us understand your health better with some basic information
                </p>
              </motion.div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    <CheckCircle className="w-16 h-16 text-status-low mb-4" />
                  </motion.div>
                  <p className="text-lg font-semibold text-status-low">
                    Profile Saved Successfully!
                  </p>
                  <p className="text-text-secondary mt-2">
                    Redirecting to dashboard...
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-status-high/10 border border-status-high/30 rounded-[16px] p-4"
                    >
                      <p className="text-status-high text-sm font-medium">{error}</p>
                    </motion.div>
                  )}

                  {/* Personal Information */}
                  <div className="p-6 rounded-[20px] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                    <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                      <HeartPulse className="w-5 h-5" />
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Age */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Age <span className="text-status-high">*</span>
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Enter your age"
                          min="1"
                          max="150"
                          className="input-field w-full"
                          required
                        />
                      </motion.div>

                      {/* Gender */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Gender <span className="text-status-high">*</span>
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="input-field w-full"
                          required
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </motion.div>

                      {/* Height */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Height (cm) <span className="text-status-high">*</span>
                        </label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleInputChange}
                          placeholder="e.g., 170"
                          min="50"
                          max="250"
                          className="input-field w-full"
                          required
                        />
                      </motion.div>

                      {/* Weight */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Weight (kg) <span className="text-status-high">*</span>
                        </label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleInputChange}
                          placeholder="e.g., 70"
                          min="20"
                          max="300"
                          className="input-field w-full"
                          required
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Lifestyle Information */}
                  <div className="p-6 rounded-[20px] bg-gradient-to-br from-status-low/10 to-transparent border border-status-low/20">
                    <h2 className="text-lg font-semibold text-status-low mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Lifestyle Information
                    </h2>
                    <div className="space-y-6">
                      {/* Smoking Status */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-3">
                          Smoking Status
                        </label>
                        <div className="space-y-2">
                          {["never", "former", "current"].map((status) => (
                            <label key={status} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="smokingStatus"
                                value={status}
                                checked={formData.smokingStatus === status}
                                onChange={handleInputChange}
                                className="w-4 h-4"
                              />
                              <span className="text-text-secondary capitalize">
                                {status === "never"
                                  ? "Never Smoked"
                                  : status === "former"
                                  ? "Former Smoker"
                                  : "Current Smoker"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>

                      {/* Alcohol Use */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-3">
                          Alcohol Use
                        </label>
                        <div className="space-y-2">
                          {["never", "occasional", "moderate", "heavy"].map((use) => (
                            <label key={use} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="alcoholUse"
                                value={use}
                                checked={formData.alcoholUse === use}
                                onChange={handleInputChange}
                                className="w-4 h-4"
                              />
                              <span className="text-text-secondary capitalize">{use}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Medical History */}
                  <div className="p-6 rounded-[20px] bg-gradient-to-br from-status-high/10 to-transparent border border-status-high/20">
                    <h2 className="text-lg font-semibold text-status-high mb-6 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Medical History
                    </h2>
                    <div className="space-y-6">
                      {/* Family History */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Family History
                        </label>
                        <textarea
                          name="familyHistory"
                          value={formData.familyHistory}
                          onChange={handleInputChange}
                          placeholder="e.g., Father has diabetes, Mother has hypertension"
                          rows={3}
                          className="input-field w-full resize-none"
                        />
                      </motion.div>

                      {/* Existing Conditions */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <label className="block text-sm font-medium text-text-primary mb-3">
                          Existing Medical Conditions
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {conditionOptions.map((condition) => (
                            <motion.button
                              key={condition}
                              type="button"
                              onClick={() => handleConditionToggle(condition)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-all border ${
                                formData.existingConditions.includes(condition)
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

                  {/* Submit Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                  >
                    {loading ? "Saving Profile..." : "Complete Profile"}
                    {!loading && (
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
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
