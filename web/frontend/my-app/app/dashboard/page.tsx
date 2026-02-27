"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import { motion } from "framer-motion";
import { LogOut, HeartPulse, Activity, ShieldCheck } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary bg-background">
        {/* Soft Background Blur Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-3xl -z-10 mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[40%] h-[50%] bg-status-low/20 rounded-full blur-3xl -z-10 mix-blend-multiply" />

        {/* Navigation */}
        <nav className="w-full px-6 py-6 md:px-12 flex items-center justify-between z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm border border-border-soft">
              <HeartPulse className="text-primary w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">धन्वंतरी</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 text-primary hover:bg-accent/50 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </motion.button>
        </nav>

        {/* Main Content */}
        <main className="flex-grow px-6 md:px-12 z-10 max-w-7xl mx-auto w-full pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2">
              Welcome, {user?.email?.split("@")[0]}
            </h1>
            <p className="text-text-secondary text-lg">
              Your personalized health monitoring dashboard
            </p>
          </motion.div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[16px] bg-accent/30 flex items-center justify-center">
                  <Activity className="text-primary w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-2">
                    Activity Monitor
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Track your daily activity and vital signs
                  </p>
                  <button className="text-primary text-sm font-medium hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[16px] bg-accent/30 flex items-center justify-center">
                  <ShieldCheck className="text-primary w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-2">
                    Health Risk Assessment
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Early risk detection and prevention
                  </p>
                  <button className="text-primary text-sm font-medium hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card group hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[16px] bg-accent/30 flex items-center justify-center">
                  <HeartPulse className="text-primary w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-2">
                    Health Profile
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Manage your personal health information
                  </p>
                  <button className="text-primary text-sm font-medium hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Status Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card mt-12"
          >
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Current Health Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-status-low/10 rounded-[16px] border border-status-low/20">
                <p className="text-text-secondary text-sm mb-2">Risk Level</p>
                <p className="text-2xl font-bold text-status-low">Low</p>
              </div>
              <div className="p-6 bg-status-mod/10 rounded-[16px] border border-status-mod/20">
                <p className="text-text-secondary text-sm mb-2">Last Check</p>
                <p className="text-2xl font-bold text-text-primary">Today</p>
              </div>
              <div className="p-6 bg-accent/10 rounded-[16px] border border-accent/20">
                <p className="text-text-secondary text-sm mb-2">Alert Status</p>
                <p className="text-2xl font-bold text-primary">All Clear</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
