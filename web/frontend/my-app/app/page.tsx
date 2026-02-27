"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck, HeartPulse, ArrowRight, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();

  useEffect(() => {
    console.log("[LandingPage] Mounted");
    console.log("[LandingPage] user:", user?.email || "not authenticated");
    console.log("[LandingPage] uid:", user?.uid);
  }, [user]);

  const handleStartMonitoring = () => {
    if (user) {
      router.push('/dashboard/profile');
    } else {
      router.push('/auth/sign-up');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    },
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Vedic mandala glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] -z-10 opacity-30"
        style={{ background: "var(--teal-glow)" }} />
      <div className="absolute top-[30%] right-[-15%] w-[35%] h-[40%] rounded-full blur-[100px] -z-10 opacity-20"
        style={{ background: "var(--cyan)" }} />

      {/* EKG Strip */}
      <div className="ekg-strip">
        <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
          <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="w-full px-6 py-5 md:px-12 flex items-center justify-between z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-accent)" }}>
            <HeartPulse className="w-6 h-6" style={{ color: "var(--teal)" }} />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--teal)" }}>
            PRĀṆA <span className="font-normal text-sm" style={{ color: "var(--text-muted)" }}>OS</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ background: "var(--bg-raised)", border: "1.5px solid var(--border-strong)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" style={{ color: "var(--warn-text)" }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            )}
          </button>
          {user ? (
            <Link href="/dashboard/profile"
              className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
              style={{ color: "var(--text-body)", background: "var(--teal-bg)" }}>
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/sign-in"
              className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
              style={{ color: "var(--text-body)", background: "var(--teal-bg)" }}>
              Sign In
            </Link>
          )}
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 md:px-12 text-center w-full max-w-5xl mx-auto z-10 mt-8 mb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center max-w-3xl"
        >
          {/* Live badge */}
          <motion.div variants={itemVariants} className="live-badge mb-8">
            <span className="live-dot" />
            PRĀṆA OS · Vedic Health Intelligence
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.10] mb-6"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}
          >
            Proactive Care,<br />
            <span style={{ color: "var(--teal)" }}>Empowered Living.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base md:text-lg mb-10 max-w-xl leading-relaxed"
            style={{ color: "var(--text-body)" }}
          >
            Welcome to <strong style={{ color: "var(--text-primary)" }}>PRĀṆA OS</strong> — a preventive health monitoring and early risk detection framework merging Vedic wisdom with modern biometrics.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={handleStartMonitoring} className="btn-primary flex items-center justify-center gap-2 group">
              Start Monitoring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn-secondary flex items-center justify-center">
              Learn More
            </button>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left"
        >
          {[
            {
              icon: <Activity className="w-6 h-6" style={{ color: "var(--teal)" }} />,
              title: "Continuous Monitoring",
              desc: "Real-time health parameter tracking at scale for proactive care and analytics.",
              accent: "ok"
            },
            {
              icon: <ShieldCheck className="w-6 h-6" style={{ color: "var(--cyan)" }} />,
              title: "Early Detection",
              desc: "Identify potential health risks early before they become critical medical emergencies.",
              accent: "blue"
            },
            {
              icon: <HeartPulse className="w-6 h-6" style={{ color: "var(--warn-text)" }} />,
              title: "Accessible Insights",
              desc: "Bridging the digital divide with actionable insights for every socio-economic group.",
              accent: "warn"
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`prana-card ${feature.accent} group flex flex-col`}
            >
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-5 mt-1 transition-transform duration-300 group-hover:scale-105"
                style={{ background: "var(--teal-bg)", border: "1px solid var(--border)" }}>
                {feature.icon}
              </div>
              <h3 className="text-[18px] font-semibold mb-2.5 tracking-tight" style={{ color: "var(--text-primary)" }}>{feature.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-body)" }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
