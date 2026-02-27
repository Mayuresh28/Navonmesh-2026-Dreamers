"use client";

import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData } from "@/lib/profile-hook";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Edit,
  LogOut,
  Scale,
  Ruler,
  Flame,
  Cigarette,
  Wine,
  AlertCircle,
  Users,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading, hasProfile } = useProfileData(user?.uid);

  // Redirect to setup if no profile exists
  useEffect(() => {
    console.log("[ProfilePage] useEffect - checking profile status");
    console.log("[ProfilePage] loading:", loading);
    console.log("[ProfilePage] userId:", user?.uid);
    console.log("[ProfilePage] hasProfile():", hasProfile());

    if (!loading && !hasProfile()) {
      console.log("[ProfilePage] No profile found - redirecting to setup page");
      router.push("/dashboard/profile/setup");
    } else if (!loading && hasProfile()) {
      console.log("[ProfilePage] Profile exists - displaying profile page");
    }
  }, [loading, hasProfile, router, user?.uid]);

  const handleSignOut = async () => {
    try {
      console.log("[ProfilePage] Signing out...");
      await signOut(auth);
      console.log("[ProfilePage] Sign out successful, redirecting to home");
      router.push("/");
    } catch (error) {
      console.error("[ProfilePage] Sign out error:", error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-background">
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden selection:bg-accent selection:text-primary bg-background p-6">
        {/* Soft Background Blur Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-3xl -z-10 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[50%] bg-status-low/20 rounded-full blur-3xl -z-10 mix-blend-multiply" />

        {/* Main Profile Container - 80vw x 80vh */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-[80vw] h-[80vh] bg-card rounded-[32px] border border-border-soft shadow-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-border-soft flex items-center justify-between bg-background/50">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <HeartPulse className="text-primary w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Your Health Profile</p>
                <h1 className="text-2xl font-bold text-text-primary">धन्वंतरी Health Dashboard</h1>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => router.push("/dashboard/profile/setup")}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 text-primary hover:bg-accent/50 transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-status-high/20 text-status-high hover:bg-status-high/30 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="space-y-8">
              {/* Health Metrics Grid - 3 columns */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 gap-6"
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

              {/* Lifestyle Information - 3 columns */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 gap-6"
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

                <div className="grid grid-cols-2 gap-8">
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
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
