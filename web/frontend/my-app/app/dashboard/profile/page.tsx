"use client";

import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { useProfileData } from "@/lib/profile-hook";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/navigation/bottom-nav";
import {
  Sun, Moon, Edit3, Activity, Heart, Shield, Dna, Scale, Ruler,
  Calendar, Cigarette, Wine, AlertCircle, FileText, LogOut,
} from "lucide-react";
import { handleSignOut } from "@/components/navigation/bottom-nav";
import { useTheme } from "@/lib/theme-context";
import { useEffect, useMemo } from "react";
import Image from "next/image";

/* ── Framer Motion Variants ── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const avatarPop = {
  hidden: { opacity: 0, scale: 0.7, rotate: -5 },
  show:   { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring" as const, stiffness: 180, damping: 18, delay: 0.2 } },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } },
  tap: { scale: 0.97 },
};

const floatAnimation = {
  y: [0, -6, 0],
  transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const },
};

/* ── Health Score Engine ── */
type HealthLevel = "green" | "yellow" | "red";

interface HealthResult { level: HealthLevel; score: number; glowColor: string; glowShadow: string; }

function computeHealthLevel(profile: { bmi: number; geneticRiskScore: number; ageRiskMultiplier: number; smokingStatus: string; alcoholUse: string; existingConditions: string[] }): HealthResult {
  let risk = 0;
  // BMI risk
  if (profile.bmi < 18.5 || (profile.bmi >= 25 && profile.bmi < 30)) risk += 1;
  else if (profile.bmi >= 30) risk += 2;
  // Genetic risk
  if (profile.geneticRiskScore > 0) risk += 1.5;
  // Age risk
  if (profile.ageRiskMultiplier > 1.4) risk += 1;
  else if (profile.ageRiskMultiplier > 1.2) risk += 0.5;
  // Smoking
  if (profile.smokingStatus === "current") risk += 2;
  else if (profile.smokingStatus === "former") risk += 0.5;
  // Alcohol
  if (profile.alcoholUse === "heavy") risk += 1.5;
  else if (profile.alcoholUse === "moderate") risk += 0.5;
  // Conditions
  risk += Math.min(profile.existingConditions.length * 0.7, 2);

  // Normalize: 0 = perfect, 10 = worst
  const capped = Math.min(risk, 10);
  if (capped <= 1.5) return { level: "green",  score: capped, glowColor: "#0de5a8", glowShadow: "0 0 60px rgba(13,229,168,0.5), 0 0 120px rgba(13,229,168,0.25)" };
  if (capped <= 4)   return { level: "yellow", score: capped, glowColor: "#ffb83f", glowShadow: "0 0 60px rgba(255,184,63,0.5), 0 0 120px rgba(255,184,63,0.25)" };
  return                      { level: "red",    score: capped, glowColor: "#ff607a", glowShadow: "0 0 60px rgba(255,96,122,0.5), 0 0 120px rgba(255,96,122,0.25)" };
}

/* ── Card Accent Colors (for contrasting borders) ── */
const CARD_ACCENT_CLASSES = ["accent-teal", "accent-purple", "accent-amber", "accent-cyan"] as const;

function doshaType(bmi: number) {
  if (bmi < 18.5) return { dosha: "Vāta Dominant", short: "VĀTA", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" };
  if (bmi < 25)   return { dosha: "Tridosha", short: "BALANCED", color: "#0de5a8", bg: "rgba(13,229,168,0.12)", border: "rgba(13,229,168,0.3)" };
  if (bmi < 30)   return { dosha: "Pitta Dominant", short: "PITTA", color: "#ffb83f", bg: "rgba(255,184,63,0.12)", border: "rgba(255,184,63,0.3)" };
  return { dosha: "Kapha Dominant", short: "KAPHA", color: "#ff607a", bg: "rgba(255,96,122,0.12)", border: "rgba(255,96,122,0.3)" };
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25)   return "Normal";
  if (bmi < 30)   return "Overweight";
  return "Obese";
}

function bmiStatus(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "LOW", color: "#ffb83f" };
  if (bmi < 25)   return { label: "NORMAL", color: "#0de5a8" };
  if (bmi < 30)   return { label: "HIGH", color: "#ffb83f" };
  return { label: "CRITICAL", color: "#ff607a" };
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
  const health = useMemo<HealthResult | null>(() => profile ? computeHealthLevel(profile) : null, [profile]);

  if (loading) return (
    <ProtectedRoute><div className="min-h-screen flex items-center justify-center pb-20" style={{ background: "var(--bg-base)" }}>
      <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--teal)" }} />
      <BottomNav />
    </div></ProtectedRoute>
  );

  if (!profile || !dosha || !health) return null;

  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const avatarSrc = profile.gender === "female" ? "/imgs/girl.png" : "/imgs/boy.png";
  const bmiStat = bmiStatus(profile.bmi);

  /* Computed parameter cards — styled like the "Live Vitals" reference */
  const computedCards = [
    { icon: <Activity className="w-5 h-5" />,  label: "BMI",             value: profile.bmi.toFixed(1), unit: bmiCategory(profile.bmi), status: bmiStat.label, statusColor: bmiStat.color, glowColor: bmiStat.color, accentClass: CARD_ACCENT_CLASSES[0] },
    { icon: <Dna className="w-5 h-5" />,       label: "Genetic Risk",    value: profile.geneticRiskScore > 0 ? "1" : "0", unit: profile.geneticRiskScore > 0 ? "Elevated" : "Low Risk", status: profile.geneticRiskScore > 0 ? "ELEVATED" : "LOW", statusColor: profile.geneticRiskScore > 0 ? "#ffb83f" : "#0de5a8", glowColor: profile.geneticRiskScore > 0 ? "#ffb83f" : "#0de5a8", accentClass: CARD_ACCENT_CLASSES[1] },
    { icon: <Calendar className="w-5 h-5" />,  label: "Age Risk Factor", value: profile.ageRiskMultiplier.toFixed(2), unit: "multiplier", status: profile.ageRiskMultiplier > 1.4 ? "HIGH" : "NORMAL", statusColor: profile.ageRiskMultiplier > 1.4 ? "#ffb83f" : "#0de5a8", glowColor: profile.ageRiskMultiplier > 1.4 ? "#ffb83f" : "#0de5a8", accentClass: CARD_ACCENT_CLASSES[2] },
    { icon: <Heart className="w-5 h-5" />,     label: "Dosha Balance",   value: dosha.short, unit: dosha.dosha, status: "ASSESSED", statusColor: dosha.color, glowColor: dosha.color, accentClass: CARD_ACCENT_CLASSES[3] },
  ];

  /* Habit items */
  const habitItems = [
    { icon: <Cigarette className="w-4 h-4" />, label: "Smoking", value: profile.smokingStatus.charAt(0).toUpperCase() + profile.smokingStatus.slice(1), status: profile.smokingStatus === "current" ? "warn" as const : "ok" as const },
    { icon: <Wine className="w-4 h-4" />,      label: "Alcohol", value: profile.alcoholUse.charAt(0).toUpperCase() + profile.alcoholUse.slice(1), status: profile.alcoholUse === "heavy" ? "warn" as const : "ok" as const },
  ];

  const actionBtns = [
    { icon: <FileText className="w-4 h-4" />, label: "Full Report", color: "#0de5a8", btnClass: "btn-teal", onClick: () => router.push("/dashboard/results") },
    { icon: <Edit3 className="w-4 h-4" />,    label: "Edit Profile", color: "#4a9eff", btnClass: "btn-cyan", onClick: () => router.push("/dashboard/profile/setup") },
    { icon: <LogOut className="w-4 h-4" />,    label: "Sign Out",     color: "#ff607a", btnClass: "btn-danger", onClick: () => handleSignOut(router) },
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
          <div className="flex items-center gap-2">
            <img src="/imgs/logo.png" alt="" width={28} height={28} className="prana-logo" />
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
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="px-5 pt-4 pb-6">

          {/* ══════════ TWO-COLUMN LAYOUT ══════════ */}
          <div className="prof-grid">

            {/* ── LEFT COLUMN: Avatar + Personal Info ── */}
            <motion.div variants={slideLeft} className="prof-left">
              {/* Avatar */}
              <motion.div
                variants={avatarPop}
                className={`prof-avatar-wrap prof-avatar-wrap--${health.level}`}
              >
                <motion.div
                  className={`prof-avatar-glow prof-glow-${health.level}`}
                  style={{ background: health.glowColor }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.18, 0.35, 0.18],
                  }}
                  transition={{ duration: health.level === "red" ? 1.4 : health.level === "yellow" ? 2.2 : 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="prof-avatar-ring"
                  style={{ borderColor: health.glowColor, boxShadow: health.glowShadow }}
                  animate={floatAnimation}
                >
                  <Image src={avatarSrc} alt="Digital Avatar" width={200} height={200} className="prof-avatar-img" priority />
                </motion.div>
                <motion.div
                  className="prof-dosha-chip"
                  style={{ background: dosha.bg, borderColor: dosha.border, color: dosha.color }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {dosha.short}
                </motion.div>
                {/* Health level indicator */}
                <motion.div
                  className={`prof-health-indicator prof-health-indicator--${health.level}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <span className="prof-health-dot" style={{ background: health.glowColor, boxShadow: `0 0 8px ${health.glowColor}` }} />
                  <span style={{ color: health.glowColor }}>
                    {health.level === "green" ? "All Vitals Normal" : health.level === "yellow" ? "Some Risk Factors" : "Elevated Risk"}
                  </span>
                </motion.div>
              </motion.div>

              {/* Personal info card */}
              <motion.div
                className="prof-info-card prof-border-teal"
                variants={stagger.item}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="prof-info-row">
                  <span className="prof-info-label">Name</span>
                  <span className="prof-info-value">{user?.displayName || "Health Persona"}</span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-label">Age</span>
                  <span className="prof-info-value">{profile.age} <small>years</small></span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-label">Height</span>
                  <span className="prof-info-value">{profile.height} <small>cm</small></span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-label">Weight</span>
                  <span className="prof-info-value">{profile.weight} <small>kg</small></span>
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="prof-actions">
                {actionBtns.map((a, i) => (
                  <motion.button
                    key={i}
                    className={`prof-action-btn ${a.btnClass}`}
                    onClick={a.onClick}
                    variants={stagger.item}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                  >
                    <span style={{ color: a.color }}>{a.icon}</span>
                    <span>{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* ── RIGHT COLUMN: Computed Params + Habits ── */}
            <motion.div variants={slideRight} className="prof-right">
              {/* Section: Computed Parameters */}
              <motion.div variants={stagger.item}>
                <div className="prof-section-header">
                  <span className="prof-section-title">Computed Parameters</span>
                  <motion.span
                    className="prof-section-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >DERIVED</motion.span>
                </div>
                <div className="prof-vitals-grid">
                  {computedCards.map((c, i) => (
                    <motion.div
                      key={i}
                      variants={stagger.item}
                      className={`prof-vital-card ${c.accentClass}`}
                      whileHover={{ scale: 1.04, y: -5 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <motion.div
                        className="prof-vital-blob"
                        style={{ background: c.glowColor }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
                        transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="prof-vital-top">
                        <motion.span
                          className="prof-vital-icon"
                          style={{ color: c.glowColor }}
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                        >{c.icon}</motion.span>
                        <motion.span
                          className="prof-vital-badge"
                          style={{ color: c.statusColor, borderColor: `${c.statusColor}44`, background: `${c.statusColor}14` }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300 }}
                        >
                          {c.status}
                        </motion.span>
                      </div>
                      <motion.div
                        className="prof-vital-value"
                        style={{ color: c.glowColor }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                      >
                        {c.value}
                        <span className="prof-vital-unit">{c.unit}</span>
                      </motion.div>
                      <div className="prof-vital-label">{c.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Section: Lifestyle & Habits */}
              <motion.div variants={stagger.item}>
                <div className="prof-section-header" style={{ marginTop: "20px" }}>
                  <span className="prof-section-title">Lifestyle &amp; Habits</span>
                  <motion.span
                    className="prof-section-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  >LIFESTYLE</motion.span>
                </div>
                <motion.div
                  className="prof-habits-card prof-border-purple"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {habitItems.map((h, i) => (
                    <motion.div
                      key={i}
                      className="prof-habit-row"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.35 }}
                    >
                      <motion.div
                        className={`prof-habit-icon ${h.status}`}
                        whileHover={{ scale: 1.15, rotate: 8 }}
                      >{h.icon}</motion.div>
                      <div className="prof-habit-info">
                        <span className="prof-habit-label">{h.label}</span>
                        <span className="prof-habit-value">{h.value}</span>
                      </div>
                      <motion.div
                        className={`prof-habit-dot ${h.status}`}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                      />
                    </motion.div>
                  ))}
                  {profile.existingConditions.length > 0 && (
                    <motion.div
                      className="prof-habit-row"
                      style={{ flexWrap: "wrap" }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9, duration: 0.35 }}
                    >
                      <div className="prof-habit-icon warn"><AlertCircle className="w-4 h-4" /></div>
                      <div className="prof-habit-info" style={{ flex: 1 }}>
                        <span className="prof-habit-label">Conditions</span>
                        <div className="prof-condition-pills">
                          {profile.existingConditions.map((c, i) => (
                            <motion.span
                              key={i}
                              className="prof-condition-pill"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1 + i * 0.08, type: "spring", stiffness: 200 }}
                            >{c}</motion.span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {profile.familyHistory && (
                    <motion.div
                      className="prof-habit-row"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.95, duration: 0.35 }}
                    >
                      <motion.div className="prof-habit-icon ok" whileHover={{ scale: 1.15, rotate: 8 }}>
                        <Shield className="w-4 h-4" />
                      </motion.div>
                      <div className="prof-habit-info">
                        <span className="prof-habit-label">Family History</span>
                        <span className="prof-habit-value">{profile.familyHistory}</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* ══════════ IDENTITY FOOTER ══════════ */}
          <motion.div
            variants={stagger.item}
            className="persona-footer prof-border-cyan"
            style={{ marginTop: "20px" }}
            whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(74,158,255,0.1)" }}
          >
            <div className="persona-footer-id">
              <span style={{ color: "var(--text-faint)" }}>ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{user?.uid?.slice(0, 12)}…</span>
            </div>
            <div className="persona-footer-updated">
              Since {joinDate} · Updated {new Date(profile.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </motion.div>

          {/* Mantra Banner */}
          <motion.div variants={stagger.item} className="mantra-banner mt-4">
            <span className="mantra-symbol">&#x2638;</span>
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
