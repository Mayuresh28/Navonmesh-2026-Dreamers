"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData, type UserProfile } from "@/lib/profile-hook";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { PersonalInfo } from "@/components/profile-setup/personal-info";
import { LifestyleForm } from "@/components/profile-setup/lifestyle-form";
import { MedicalHistoryForm } from "@/components/profile-setup/medical-history-form";
import { ComputedPreview } from "@/components/profile-setup/computed-preview";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { profile, loading: profileLoading, createProfile, updateProfile } = useProfileData(user?.uid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isEditMode = !!profile;

  const [formData, setFormData] = useState({
    age: "", gender: "male" as "male" | "female" | "other",
    height: "", weight: "", familyHistory: "",
    smokingStatus: "never" as "never" | "former" | "current",
    alcoholUse: "never" as "never" | "occasional" | "moderate" | "heavy",
    existingConditions: [] as string[],
  });

  /* Pre-populate form when profile data loads (edit mode) */
  useEffect(() => {
    if (profile) {
      setFormData({
        age: String(profile.age),
        gender: profile.gender,
        height: String(profile.height),
        weight: String(profile.weight),
        familyHistory: profile.familyHistory || "",
        smokingStatus: profile.smokingStatus,
        alcoholUse: profile.alcoholUse,
        existingConditions: profile.existingConditions || [],
      });
    }
  }, [profile]);

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

      let ok: boolean;
      if (isEditMode) {
        ok = await updateProfile(profileData);
      } else {
        ok = await createProfile(profileData);
      }

      if (ok) { setSuccess(true); setTimeout(() => router.push("/dashboard/results"), 1500); }
      else setError("Failed to save profile");
    } finally { setLoading(false); }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col relative" style={{ background: "var(--bg-base)" }}>
        {/* ── EKG Strip ── */}
        <div className="ekg-strip shrink-0">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* ── Top Bar ── */}
        <header className="prana-topbar">
          <div className="flex items-center gap-2">
            <img src="/imgs/logo.png" alt="" width={28} height={28} className="prana-logo" />
            <span style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "22px", fontWeight: 700, letterSpacing: "1px",
              background: "linear-gradient(135deg, var(--teal), var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>
              Setup
            </span>
          </div>
          <button onClick={toggle}
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} />
              : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
          </button>
        </header>

        <main className="flex-grow flex items-center justify-center px-6 md:px-12 z-10 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
            <div className="prana-vessel p-8 md:p-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{isEditMode ? "Update Your Profile" : "Complete Your Profile"}</h1>
              <p className="mb-8" style={{ color: "var(--text-muted)" }}>{isEditMode ? "Edit your health details below" : "Help us understand your health better"}</p>

              {success ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12">
                  <CheckCircle className="w-16 h-16 mb-4" style={{ color: "var(--teal)" }} />
                  <p className="text-lg font-semibold" style={{ color: "var(--teal)" }}>{isEditMode ? "Profile Updated!" : "Profile Saved Successfully!"}</p>
                  <p className="mt-2" style={{ color: "var(--text-muted)" }}>Redirecting to results...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-[16px] p-4" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
                      <p className="text-sm font-medium" style={{ color: "var(--danger-text)" }}>{error}</p>
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
                    {loading ? "Saving..." : isEditMode ? "Update Profile" : "Complete Profile"}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Mantra Banner */}
          <div className="mantra-banner mt-8">
            <span className="mantra-symbol">&#x2638;</span>
            <div className="mantra-text">
              &ldquo;Svasthasya svāsthya rakṣaṇam, āturasya vikāra praśamanam&rdquo;
            </div>
            <div className="mantra-trans-text">
              Protect the health of the healthy, cure the disease of the diseased
            </div>
            <div className="mantra-src-text">— Charaka Saṃhitā</div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
