"use client";

import { motion } from "framer-motion";
import { HeartPulse, BarChart3, User, LogOut, ShieldCheck, LayoutDashboard } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FC } from "react";

interface NavbarProps {
  activeTab: "dashboard" | "profile" | "results";
  onTabChange: (tab: "dashboard" | "profile" | "results") => void;
}

const tabs = [
  { key: "dashboard" as const, label: "Home", icon: LayoutDashboard },
  { key: "dashboard" as const, label: "Dynamic", icon: BarChart3, navKey: "dynamic" },
  { key: "results" as const, label: "Results", icon: ShieldCheck },
  { key: "profile" as const, label: "Profile", icon: User },
];

export const Navbar: FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleDynamicNav = () => {
    router.push("/dynamic");
  };

  return (
    <>
      {/* ── Desktop Top Navbar ── */}
      <nav className="w-full border-b border-border-soft bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onTabChange("dashboard")}
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center border border-primary/20">
              <HeartPulse className="text-primary w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">धन्वंतरी</span>
          </motion.div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-background rounded-[16px] p-1 border border-border-soft">
            <motion.button
              onClick={() => onTabChange("dashboard")}
              className={`px-5 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                activeTab === "dashboard"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-card/60"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </motion.button>
            <motion.button
              onClick={handleDynamicNav}
              className="px-5 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-card/60"
              whileTap={{ scale: 0.98 }}
            >
              <BarChart3 className="w-4 h-4" />
              Dynamic Data
            </motion.button>
            <motion.button
              onClick={() => onTabChange("results")}
              className={`px-5 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                activeTab === "results"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-card/60"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <ShieldCheck className="w-4 h-4" />
              Risk Results
            </motion.button>
            <motion.button
              onClick={() => onTabChange("profile")}
              className={`px-5 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                activeTab === "profile"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-card/60"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <User className="w-4 h-4" />
              Profile
            </motion.button>
          </div>

          {/* Sign Out */}
          <motion.button
            onClick={handleSignOut}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[12px] text-text-secondary hover:text-status-high hover:bg-status-high/8 transition-all duration-200"
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </motion.button>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(env(safe-area-inset-bottom),8px)]">
        <div className="bg-card/90 backdrop-blur-xl rounded-[20px] border border-border-soft shadow-[0_-4px_24px_rgb(126_166_247_/_0.12)] px-2 py-2 flex items-center justify-around gap-1">
          {/* Home */}
          <motion.button
            onClick={() => onTabChange("dashboard")}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-[14px] transition-all duration-200 min-w-[56px] ${
              activeTab === "dashboard"
                ? "bg-primary/12 text-primary"
                : "text-text-secondary"
            }`}
            whileTap={{ scale: 0.92 }}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Home</span>
            {activeTab === "dashboard" && (
              <motion.div
                layoutId="mobile-indicator"
                className="w-1 h-1 rounded-full bg-primary mt-0.5"
              />
            )}
          </motion.button>

          {/* Dynamic */}
          <motion.button
            onClick={handleDynamicNav}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-[14px] transition-all duration-200 min-w-[56px] text-text-secondary"
            whileTap={{ scale: 0.92 }}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Dynamic</span>
          </motion.button>

          {/* Results */}
          <motion.button
            onClick={() => onTabChange("results")}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-[14px] transition-all duration-200 min-w-[56px] ${
              activeTab === "results"
                ? "bg-primary/12 text-primary"
                : "text-text-secondary"
            }`}
            whileTap={{ scale: 0.92 }}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Results</span>
            {activeTab === "results" && (
              <motion.div
                layoutId="mobile-indicator"
                className="w-1 h-1 rounded-full bg-primary mt-0.5"
              />
            )}
          </motion.button>

          {/* Profile */}
          <motion.button
            onClick={() => onTabChange("profile")}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-[14px] transition-all duration-200 min-w-[56px] ${
              activeTab === "profile"
                ? "bg-primary/12 text-primary"
                : "text-text-secondary"
            }`}
            whileTap={{ scale: 0.92 }}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Profile</span>
            {activeTab === "profile" && (
              <motion.div
                layoutId="mobile-indicator"
                className="w-1 h-1 rounded-full bg-primary mt-0.5"
              />
            )}
          </motion.button>

          {/* Sign Out */}
          <motion.button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-[14px] transition-all duration-200 min-w-[56px] text-text-secondary"
            whileTap={{ scale: 0.92 }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Logout</span>
          </motion.button>
        </div>
      </div>
    </>
  );
};
