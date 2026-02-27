"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { Navbar } from "@/lib/navbar";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile">("dashboard");

  const handleTabChange = (tab: "dashboard" | "profile") => {
    console.log("[Dashboard] Tab changed to:", tab);
    setActiveTab(tab);
    if (tab === "profile") {
      router.push("/dashboard/profile");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Main Content */}
        {activeTab === "dashboard" ? (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-grow w-full h-[calc(100vh-160px)] flex items-center justify-center px-6 py-12"
          >
            <div className="relative w-full max-w-3xl">
              {/* Soft Background Blur Elements */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/20 to-transparent rounded-[40px] blur-3xl" />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col items-center justify-center py-20 px-8 rounded-[40px] bg-card/50 backdrop-blur-md border border-accent/30 shadow-[0_8px_32px_rgb(90_127_232_/_0.1)]"
              >
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8"
                >
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-accent via-primary/50 to-primary/20 flex items-center justify-center shadow-[0_16px_48px_rgb(90_127_232_/_0.4)] border border-accent/50">
                    <Zap className="w-20 h-20 text-white" strokeWidth={1.5} />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-4xl md:text-5xl font-bold text-text-primary mb-4 text-center"
                >
                  Dynamic Data Dashboard
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-lg md:text-xl text-text-secondary text-center max-w-lg mb-8"
                >
                  Real-time health monitoring and analytics dashboard with personalized insights
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  onClick={() => router.push("/dynamic")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[16px] bg-accent/20 border border-accent/40 text-accent font-medium cursor-pointer hover:bg-accent/30 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Go to Dashboard
                </motion.button>
              </motion.div>
            </div>
          </motion.main>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
