"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion } from "framer-motion";
import { Zap, Activity } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-grow w-full h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12"
        >
          <div className="relative w-full max-w-3xl">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/20 to-transparent rounded-[40px] blur-3xl" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col items-center justify-center gap-4 py-20 px-8 rounded-[40px] bg-card/50 backdrop-blur-md border border-accent/30 shadow-[0_8px_32px_rgb(90_127_232_/_0.1)]"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-4"
              >
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-accent via-primary/50 to-primary/20 flex items-center justify-center shadow-[0_16px_48px_rgb(90_127_232_/_0.4)] border border-accent/50">
                  <Zap className="w-20 h-20 text-white" strokeWidth={1.5} />
                </div>
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold text-text-primary text-center">
                Dhanvantari
              </h2>
              <p className="text-lg text-text-secondary text-center max-w-lg">
                Real-time health monitoring and analytics with personalized insights
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={() => router.push("/dynamic")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[16px] bg-accent/20 border border-accent/40 text-accent font-medium hover:bg-accent/30 transition-colors">
                  <Zap className="w-4 h-4" /> Vitals Dashboard
                </button>
                <button onClick={() => router.push("/dashboard/ncm-analysis")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[16px] bg-primary/10 border border-primary/30 text-primary font-medium hover:bg-primary/20 transition-colors">
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
