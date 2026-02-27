"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion } from "framer-motion";
import { Zap, Activity, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-base)" }}>
        {/* EKG Strip */}
        <div className="ekg-strip">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* Topbar */}
        <div className="prana-topbar">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "var(--teal)" }}>PRĀṆA</span>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>OS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="live-badge">
              <span className="live-dot" />
              SYSTEM ACTIVE
            </div>
            <button onClick={toggle}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--bg-raised)", border: "1.5px solid var(--border-strong)" }}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
            </button>
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-grow w-full flex items-center justify-center px-5 py-12"
          style={{ minHeight: "calc(100vh - 130px)" }}
        >
          <div className="relative w-full max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prana-vessel flex flex-col items-center justify-center gap-5 py-16 px-8"
            >
              {/* Score Ring */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-2"
              >
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-strong)" strokeWidth="6" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--teal)" strokeWidth="6"
                      strokeDasharray="327" strokeDashoffset="65" strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{ filter: "drop-shadow(0 0 6px var(--teal-glow))" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Zap className="w-8 h-8 mb-1" style={{ color: "var(--teal)" }} strokeWidth={1.5} />
                    <span className="text-xs font-bold" style={{ color: "var(--text-muted)", letterSpacing: "1px" }}>ACTIVE</span>
                  </div>
                </div>
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold text-center"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
                PRĀṆA OS
              </h2>
              <p className="text-base text-center max-w-lg" style={{ color: "var(--text-body)" }}>
                Real-time Vedic health monitoring and analytics with personalized Ayurvedic insights
              </p>

              <hr className="prana-hr w-48" />

              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                <button onClick={() => router.push("/dynamic")}
                  className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4" /> Vitals Dashboard
                </button>
                <button onClick={() => router.push("/dashboard/ncm-analysis")}
                  className="btn-secondary inline-flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" /> NCM Analysis
                </button>
              </div>
            </motion.div>
          </div>
        </motion.main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
