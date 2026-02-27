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
import { HeartPulse, Users, Ruler, Scale, Cigarette, Wine, Flame, Calculator, Dna, Clock, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { GlassmorphicBackground } from "@/lib/glassmorphic-bg";
import { Navbar } from "@/lib/navbar";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { profile, loading, hasProfile } = useProfileData(user?.uid);

  useEffect(() => {
    if (!loading && !hasProfile()) router.push("/dashboard/profile/setup");
  }, [loading, hasProfile, router]);

  if (loading) return (
    <ProtectedRoute><div className="min-h-screen flex items-center justify-center pb-20" style={{ background: "var(--bg-base)" }}>
      <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--teal)" }} />
      <BottomNav />
    </div></ProtectedRoute>
  );

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!profile) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
        <div className="ekg-strip" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] relative overflow-hidden p-6">
          {/* Ambient glow */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl -z-10" style={{ background: "var(--teal-glow)" }} />
          <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[50%] rounded-full blur-3xl -z-10" style={{ background: "var(--ok-bg)" }} />

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="prana-vessel w-[90vw] lg:w-[80vw] max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--teal-bg)", border: "1px solid var(--border-accent)" }}>
                  <HeartPulse className="w-5 h-5" style={{ color: "var(--teal)" }} />
                </div>
                <h1 className="text-xl font-bold text-text-primary">Your Health Profile</h1>
              </div>
              <button onClick={() => router.push("/dashboard/profile/setup")}
                className="btn-secondary flex items-center gap-2 !h-auto !py-2 !px-4 text-sm">
                <HeartPulse className="w-4 h-4" /> Edit Profile
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
              <HealthMetrics age={profile.age} gender={profile.gender} height={profile.height} weight={profile.weight} />
              <LifestyleCards smokingStatus={profile.smokingStatus} alcoholUse={profile.alcoholUse}
                gender={profile.gender} weight={profile.weight} height={profile.height} age={profile.age} />
              <ComputedParams bmi={profile.bmi} height={profile.height} weight={profile.weight}
                geneticRiskScore={profile.geneticRiskScore} ageRiskMultiplier={profile.ageRiskMultiplier} age={profile.age} />
              <MedicalHistory familyHistory={profile.familyHistory} existingConditions={profile.existingConditions} />

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Last updated: <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {new Date(profile.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
