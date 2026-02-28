"use client";

import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData } from "@/lib/profile-hook";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/navigation/bottom-nav";
import {
  Sun, Moon, Edit3, Activity, Heart, Shield, Dna, Scale, Ruler,
  Calendar, Cigarette, Wine, AlertCircle, FileText, Bell, Share2,
  Flame, Droplets, Wind, Zap, Brain, Moon as MoonIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useEffect, useMemo } from "react";

/* ── Stagger ── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } },
};

function doshaType(bmi: number) {
  if (bmi < 18.5) return { dosha: "Vāta Dominant", short: "VĀTA", desc: "Light · Creative · Energetic", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", emoji: "🌬️" };
  if (bmi < 25)   return { dosha: "Tridosha", short: "BALANCED", desc: "Balanced · Harmonious · Centered", color: "#0de5a8", bg: "rgba(13,229,168,0.12)", border: "rgba(13,229,168,0.3)", emoji: "☯️" };
  if (bmi < 30)   return { dosha: "Pitta Dominant", short: "PITTA", desc: "Strong · Determined · Driven", color: "#ffb83f", bg: "rgba(255,184,63,0.12)", border: "rgba(255,184,63,0.3)", emoji: "🔥" };
  return { dosha: "Kapha Dominant", short: "KAPHA", desc: "Steady · Grounded · Resilient", color: "#ff607a", bg: "rgba(255,96,122,0.12)", border: "rgba(255,96,122,0.3)", emoji: "🌊" };
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25)   return "Normal";
  if (bmi < 30)   return "Overweight";
  return "Obese";
}

/* Two smiling avatar SVGs — main + secondary alternate pose */
function avatarUrl(gender: string, seed: string) {
  // "adventurer" style gives smiling, handsome human-like avatars
  const style = "adventurer";
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=transparent&radius=50&flip=${gender === "female"}`;
}
function avatarUrlAlt(gender: string, seed: string) {
  // "big-smile" style for second variant
  const style = "big-smile";
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=transparent&radius=50`;
}

/* Body type trait */
function bodyType(bmi: number) {
  if (bmi < 18.5) return "Ectomorph";
  if (bmi < 25)   return "Mesomorph";
  if (bmi < 30)   return "Endo-Meso";
  return "Endomorph";
}
/* Metabolic label */
function metabolicRate(bmi: number, age: number) {
  if (bmi < 20 && age < 30) return "Fast";
  if (bmi > 28 || age > 55) return "Slow";
  return "Moderate";
}
/* Resilience */
function resilienceScore(genetic: number, smoking: string, alcohol: string) {
  let s = 90;
  if (genetic > 0) s -= 20;
  if (smoking === "current") s -= 15;
  if (alcohol === "heavy") s -= 10;
  return Math.max(s, 30);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { profile, loading, hasProfile } = useProfileData(user?.uid);

  useEffect(() => {
    if (!loading && !hasProfile()) router.push("/dashboard/profile/setup");
  }, [loading, hasProfile, router]);

  const dosha = useMemo(() => profile ? doshaType(profile.bmi) : null, [profile]);

  if (loading) return (
    <ProtectedRoute><div className="min-h-screen flex items-center justify-center pb-20" style={{ background: "var(--bg-base)" }}>
      <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--teal)" }} />
      <BottomNav />
    </div></ProtectedRoute>
  );

  if (!profile || !dosha) return null;

  const seed = `${profile.gender}${profile.age}${user?.uid?.slice(0, 4) || "dh"}`;
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const resilience = resilienceScore(profile.geneticRiskScore, profile.smokingStatus, profile.alcoholUse);

  /* ── Persona traits — describe the digital being ── */
  const personaTraits = [
    { icon: <Flame className="w-4 h-4" />, label: "Body Type", value: bodyType(profile.bmi), color: "#ff607a" },
    { icon: <Zap className="w-4 h-4" />, label: "Metabolism", value: metabolicRate(profile.bmi, profile.age), color: "#ffb83f" },
    { icon: <Shield className="w-4 h-4" />, label: "Resilience", value: `${resilience}%`, color: resilience >= 70 ? "#0de5a8" : "#ff607a" },
    { icon: <Brain className="w-4 h-4" />, label: "Mind Type", value: profile.bmi < 22 ? "Sattvic" : profile.bmi < 28 ? "Rajasic" : "Tamasic", color: "#a78bfa" },
    { icon: <Droplets className="w-4 h-4" />, label: "Hydration Need", value: profile.weight > 70 ? "High" : "Moderate", color: "#4a9eff" },
    { icon: <Wind className="w-4 h-4" />, label: "Breath Capacity", value: profile.smokingStatus === "current" ? "Low" : profile.smokingStatus === "former" ? "Moderate" : "Strong", color: "#18d8f5" },
  ];

  const statCards = [
    { icon: <Calendar className="w-4 h-4" />, label: "Age", value: `${profile.age}`, unit: "years", color: "#4a9eff" },
    { icon: <Ruler className="w-4 h-4" />, label: "Height", value: `${profile.height}`, unit: "cm", color: "#a78bfa" },
    { icon: <Scale className="w-4 h-4" />, label: "Weight", value: `${profile.weight}`, unit: "kg", color: "#0de5a8" },
    { icon: <Activity className="w-4 h-4" />, label: "BMI", value: profile.bmi.toFixed(1), unit: bmiCategory(profile.bmi), color: profile.bmi >= 25 ? "#ffb83f" : "#0de5a8" },
  ];

  const riskCards = [
    { icon: <Dna className="w-4 h-4" />, label: "Genetic Risk", value: profile.geneticRiskScore > 0 ? "Elevated" : "Low", status: profile.geneticRiskScore > 0 ? "warn" as const : "ok" as const },
    { icon: <Heart className="w-4 h-4" />, label: "Age Risk", value: `${profile.ageRiskMultiplier.toFixed(2)}×`, status: profile.ageRiskMultiplier > 1.4 ? "warn" as const : "ok" as const },
    { icon: <Cigarette className="w-4 h-4" />, label: "Smoking", value: profile.smokingStatus.charAt(0).toUpperCase() + profile.smokingStatus.slice(1), status: profile.smokingStatus === "current" ? "warn" as const : "ok" as const },
    { icon: <Wine className="w-4 h-4" />, label: "Alcohol", value: profile.alcoholUse.charAt(0).toUpperCase() + profile.alcoholUse.slice(1), status: profile.alcoholUse === "heavy" ? "warn" as const : "ok" as const },
  ];

  const actionBtns = [
    { icon: <FileText className="w-4 h-4" />, label: "Full Report", color: "#0de5a8", onClick: () => router.push("/dashboard/results") },
    { icon: <Edit3 className="w-4 h-4" />, label: "Edit Profile", color: "#4a9eff", onClick: () => router.push("/dashboard/profile/setup") },
    { icon: <Bell className="w-4 h-4" />, label: "Reminders", color: "#ffb83f", onClick: () => {} },
    { icon: <Share2 className="w-4 h-4" />, label: "Share", color: "#a78bfa", onClick: () => { if (navigator.share) navigator.share({ title: "My Dhanvantari Profile", text: `${dosha.dosha} | BMI: ${profile.bmi.toFixed(1)}` }).catch(() => {}); } },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-base)" }}>

        {/* ── EKG Strip ── */}
        <div className="ekg-strip" aria-hidden="true">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* ── Top Bar ── */}
        <header className="prana-topbar">
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)", fontSize: "22px", fontWeight: 700, letterSpacing: "1px", background: "linear-gradient(135deg, var(--teal), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>
              Profile
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={toggle} className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="px-5 pt-2 pb-6">

          {/* ══════════ HERO PERSONA CARD (like reference image) ══════════ */}
          <motion.div variants={stagger.item} className="persona-card">
            {/* Banner */}
            <div className="persona-banner">
              {/* Secondary avatar floating in banner */}
              <div className="persona-banner-avatar-alt">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrlAlt(profile.gender, seed + "alt")} alt="" />
              </div>
            </div>

            {/* Avatar + Info Row */}
            <div className="persona-hero-row">
              <div className="persona-avatar-ring" style={{ borderColor: dosha.color, boxShadow: `0 0 20px ${dosha.color}44` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl(profile.gender, seed)} alt="Digital Persona" className="persona-avatar-img" />
              </div>
              <div className="persona-hero-info">
                <h2 className="persona-name">{user?.displayName || "Health Persona"}</h2>
                <p className="persona-meta">
                  @{(user?.displayName || "user").toLowerCase().replace(/\s+/g, ".")}.prāṇa · Since {joinDate}
                </p>
                <div className="persona-dosha-chip" style={{ background: dosha.bg, borderColor: dosha.border, color: dosha.color }}>
                  {dosha.emoji} {dosha.short} DOMINANT
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="persona-actions-row">
              {actionBtns.map((a, i) => (
                <button key={i} className="persona-action-btn" onClick={a.onClick}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ══════════ DIGITAL PERSONA TRAITS ══════════ */}
          <motion.div variants={stagger.item} className="dash-sec" style={{ marginTop: "18px" }}>
            <div className="dash-sec-title">Digital <em>Persona</em></div>
            <div className="dash-sec-tag">{dosha.dosha}</div>
          </motion.div>

          <motion.div variants={stagger.item} className="persona-traits-grid">
            {personaTraits.map((t, i) => (
              <div key={i} className="persona-trait-card">
                <div className="persona-trait-icon" style={{ background: `${t.color}18`, color: t.color }}>
                  {t.icon}
                </div>
                <div className="persona-trait-label">{t.label}</div>
                <div className="persona-trait-value">{t.value}</div>
              </div>
            ))}
          </motion.div>

          {/* ══════════ VITAL STATS GRID ══════════ */}
          <motion.div variants={stagger.item} className="dash-sec" style={{ marginTop: "18px" }}>
            <div className="dash-sec-title">Vital <em>Stats</em></div>
          </motion.div>

          <motion.div variants={stagger.item} className="persona-stats-grid">
            {statCards.map((s, i) => (
              <div key={i} className="persona-stat-card">
                <div className="persona-stat-icon" style={{ background: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="persona-stat-label">{s.label}</div>
                <div className="persona-stat-value">{s.value}</div>
                <div className="persona-stat-unit">{s.unit}</div>
              </div>
            ))}
          </motion.div>

          {/* ══════════ RISK FACTORS ══════════ */}
          <motion.div variants={stagger.item} className="dash-sec">
            <div className="dash-sec-title">Risk <em>Factors</em></div>
          </motion.div>

          <motion.div variants={stagger.item} className="persona-risk-grid">
            {riskCards.map((r, i) => (
              <div key={i} className={`persona-risk-card ${r.status}`}>
                <div className={`persona-risk-icon ${r.status}`}>{r.icon}</div>
                <div className="persona-risk-body">
                  <div className="persona-risk-label">{r.label}</div>
                  <div className="persona-risk-value">{r.value}</div>
                </div>
                <div className={`persona-risk-dot ${r.status}`} />
              </div>
            ))}
          </motion.div>

          {/* ══════════ MEDICAL HISTORY ══════════ */}
          {(profile.familyHistory || profile.existingConditions.length > 0) && (
            <>
              <motion.div variants={stagger.item} className="dash-sec">
                <div className="dash-sec-title">Medical <em>History</em></div>
              </motion.div>

              <motion.div variants={stagger.item} className="persona-medical-card">
                {profile.familyHistory && (
                  <div className="persona-medical-row">
                    <Shield className="w-4 h-4" style={{ color: "var(--teal)", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div className="persona-medical-label">Family History</div>
                      <div className="persona-medical-value">{profile.familyHistory}</div>
                    </div>
                  </div>
                )}
                {profile.existingConditions.length > 0 && (
                  <div className="persona-medical-row">
                    <AlertCircle className="w-4 h-4" style={{ color: "var(--warn-text)", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div className="persona-medical-label">Existing Conditions</div>
                      <div className="persona-medical-pills">
                        {profile.existingConditions.map((c, i) => (
                          <span key={i} className="persona-condition-pill">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* ══════════ IDENTITY FOOTER ══════════ */}
          <motion.div variants={stagger.item} className="persona-footer">
            <div className="persona-footer-id">
              <span style={{ color: "var(--text-faint)" }}>ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{user?.uid?.slice(0, 12)}…</span>
            </div>
            <div className="persona-footer-updated">
              Updated {new Date(profile.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </motion.div>

          {/* Mantra Banner */}
          <motion.div variants={stagger.item} className="mantra-banner mt-4">
            <span className="mantra-symbol">☸</span>
            <div className="mantra-text">
              &ldquo;Śarīram ādyaṁ khalu dharma sādhanam&rdquo;
            </div>
            <div className="mantra-trans-text">
              The body is truly the primary instrument of dharma
            </div>
            <div className="mantra-src-text">
              — Kālidāsa, Kumārasambhavam
            </div>
          </motion.div>

        </motion.div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
