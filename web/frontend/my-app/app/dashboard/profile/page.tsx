"use client";

import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData } from "@/lib/profile-hook";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { HealthMetrics } from "@/components/profile/health-metrics";
import { LifestyleCards } from "@/components/profile/lifestyle-cards";
import { ComputedParams } from "@/components/profile/computed-params";
import { MedicalHistory } from "@/components/profile/medical-history";
import { HeartPulse } from "lucide-react";
import { useEffect } from "react";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading, hasProfile } = useProfileData(user?.uid);

  useEffect(() => {
    if (!loading && !hasProfile()) {
      router.push("/dashboard/profile/setup");
    }
  }, [loading, hasProfile, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <GlassmorphicBackground />
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-border-soft border-t-primary animate-spin" />
            <p className="text-text-secondary">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  if (!profile) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-transparent has-bottom-nav">
        <GlassmorphicBackground />
        <Navbar activeTab="profile" onTabChange={(tab) => {
          if (tab === "dashboard") router.push("/dashboard");
          else if (tab === "results") router.push("/dashboard/results");
        }} />

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] relative overflow-hidden selection:bg-accent selection:text-primary p-6">

          {/* Main Profile Container - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-[95vw] md:w-[90vw] lg:w-[80vw] max-h-[85vh] md:max-h-[80vh] bg-card rounded-[24px] md:rounded-[32px] border border-border-soft shadow-[0_4px_24px_rgb(126_166_247_/_0.08)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 md:px-8 py-5 md:py-6 border-b border-border-soft flex items-center justify-between bg-background/50">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <HeartPulse className="text-primary w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-text-primary">Your Health Profile</h1>
              </div>
              <button onClick={() => router.push("/dashboard/profile/setup")}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium">
                <HeartPulse className="w-4 h-4" /> Edit Profile
              </button>
            </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
            <div className="space-y-6 md:space-y-8">
              {/* Health Metrics Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                {/* Age Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-primary/15 flex items-center justify-center">
                      <Users className="text-primary w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Age</p>
                      <p className="text-4xl font-bold text-text-primary">
                        {profile.age}
                      </p>
                      <p className="text-xs text-text-secondary mt-2 capitalize">
                        {profile.gender}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Height Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-accent/30 flex items-center justify-center">
                      <Ruler className="text-primary w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Height</p>
                      <p className="text-4xl font-bold text-text-primary">
                        {profile.height}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        {(profile.height / 100).toFixed(2)} m
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Weight Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-status-mod/20 flex items-center justify-center">
                      <Scale className="text-status-mod w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Weight</p>
                      <p className="text-4xl font-bold text-text-primary">
                        {profile.weight}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        BMI: {(
                          profile.weight /
                          ((profile.height / 100) * (profile.height / 100))
                        ).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Lifestyle Information */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                {/* Smoking Status Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-status-high/20 flex items-center justify-center">
                      <Cigarette className="text-status-high w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Smoking</p>
                      <p className="text-lg font-bold text-text-primary capitalize">
                        {profile.smokingStatus === "never"
                          ? "Never"
                          : profile.smokingStatus === "former"
                          ? "Former"
                          : "Current"}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        {profile.smokingStatus === "never"
                          ? "✓ Great!"
                          : profile.smokingStatus === "former"
                          ? "✓ Quit"
                          : "⚠ Consider quitting"}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Alcohol Use Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-status-mod/20 flex items-center justify-center">
                      <Wine className="text-status-mod w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Alcohol</p>
                      <p className="text-lg font-bold text-text-primary capitalize">
                        {profile.alcoholUse}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        {profile.alcoholUse === "never"
                          ? "✓ Excellent"
                          : "Moderate"}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Daily Calorie Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[16px] bg-status-low/20 flex items-center justify-center">
                      <Flame className="text-status-low w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Daily Calories</p>
                      <p className="text-3xl font-bold text-status-low">
                        {Math.round(
                          profile.gender === "male"
                            ? 88.362 +
                                13.397 * profile.weight +
                                4.799 * profile.height -
                                5.677 * profile.age
                            : 447.593 +
                                9.247 * profile.weight +
                                3.098 * profile.height -
                                4.33 * profile.age
                        )}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">kcal/day</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Computed Health Parameters */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                {/* BMI Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      (profile.bmi ?? 0) < 18.5
                        ? "bg-status-mod/20"
                        : (profile.bmi ?? 0) < 25
                        ? "bg-status-low/20"
                        : (profile.bmi ?? 0) < 30
                        ? "bg-status-mod/20"
                        : "bg-status-high/20"
                    }`}>
                      <Calculator className={`w-7 h-7 ${
                        (profile.bmi ?? 0) < 18.5
                          ? "text-status-mod"
                          : (profile.bmi ?? 0) < 25
                          ? "text-status-low"
                          : (profile.bmi ?? 0) < 30
                          ? "text-status-mod"
                          : "text-status-high"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">BMI</p>
                      <p className={`text-4xl font-bold ${
                        (profile.bmi ?? 0) < 18.5
                          ? "text-status-mod"
                          : (profile.bmi ?? 0) < 25
                          ? "text-status-low"
                          : (profile.bmi ?? 0) < 30
                          ? "text-status-mod"
                          : "text-status-high"
                      }`}>
                        {profile.bmi
                          ? profile.bmi
                          : (profile.weight / ((profile.height / 100) * (profile.height / 100))).toFixed(1)}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        {(() => {
                          const bmi = profile.bmi ?? profile.weight / ((profile.height / 100) * (profile.height / 100));
                          if (bmi < 18.5) return "Underweight";
                          if (bmi < 25) return "Normal";
                          if (bmi < 30) return "Overweight";
                          return "Obese";
                        })()}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Genetic Risk Score Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const grs = profile.geneticRiskScore ?? 0;
                      const color = grs >= 0.5 ? "status-high" : grs > 0 ? "status-mod" : "status-low";
                      return (
                        <>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${color}/20`}>
                            <Dna className={`w-7 h-7 text-${color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-text-secondary text-sm mb-1">Genetic Risk</p>
                            <p className={`text-4xl font-bold text-${color}`}>
                              {grs}
                            </p>
                            <p className="text-xs text-text-secondary mt-2">
                              {grs === 0 ? "Low risk" : grs < 0.5 ? "Moderate risk" : "High risk"}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>

                {/* Age Risk Multiplier Card */}
                <motion.div variants={itemVariants} className="card group hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/30 flex items-center justify-center">
                      <Clock className="text-primary w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-1">Age Risk</p>
                      <p className="text-4xl font-bold text-text-primary">
                        {profile.ageRiskMultiplier
                          ? profile.ageRiskMultiplier
                          : (1 + profile.age / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        Age + lifestyle factor
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Medical History Section */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="col-span-full card"
              >
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2 mb-6">
                  <AlertCircle className="text-primary" />
                  Medical History
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Family History */}
                  <div>
                    <p className="text-sm font-semibold text-text-secondary mb-3 uppercase">
                      Family History
                    </p>
                    <div className="bg-background rounded-[12px] p-4 border border-border-soft">
                      <p className="text-text-primary leading-relaxed">
                        {profile.familyHistory || "No family history recorded"}
                      </p>
                    </div>
                  </div>

                  {/* Existing Conditions */}
                  <div>
                    <p className="text-sm font-semibold text-text-secondary mb-3 uppercase">
                      Existing Conditions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.existingConditions.length > 0 ? (
                        profile.existingConditions.map((condition) => (
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

              {/* Last Updated */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-sm text-text-secondary"
              >
                Last updated:{" "}
                <span className="text-text-primary font-medium">
                  {new Date(profile.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
