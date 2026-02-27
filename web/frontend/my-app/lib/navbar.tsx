"use client";

import { motion } from "framer-motion";
import { HeartPulse, BarChart3, User, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FC } from "react";

interface NavbarProps {
  activeTab: "dashboard" | "profile";
  onTabChange: (tab: "dashboard" | "profile") => void;
}

export const Navbar: FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      console.log("[Navbar] Signing out...");
      await signOut(auth);
      console.log("[Navbar] Sign out successful, redirecting to home");
      router.push("/");
    } catch (error) {
      console.error("[Navbar] Sign out error:", error);
    }
  };

  return (
    <nav className="w-full border-b border-border-soft bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <HeartPulse className="text-primary w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-primary tracking-tight">धन्वंतरी</span>
        </motion.div>

        {/* Tabs */}
        <div className="hidden md:flex items-center gap-2 bg-card/30 rounded-[16px] p-1 border border-border-soft">
          <motion.button
            onClick={() => onTabChange("dashboard")}
            className={`px-6 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-primary/20 text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <BarChart3 className="w-4 h-4" />
            Dynamic Data
          </motion.button>
          <motion.button
            onClick={() => onTabChange("profile")}
            className={`px-6 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-primary/20 text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <User className="w-4 h-4" />
            Profile
          </motion.button>
        </div>

        {/* Sign Out */}
        <motion.button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-text-secondary hover:text-primary hover:bg-primary/10 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
        </motion.button>
      </div>

      {/* Mobile Tab Selector */}
      <div className="md:hidden border-t border-border-soft bg-card/30 px-6 py-3 flex items-center gap-2">
        <motion.button
          onClick={() => onTabChange("dashboard")}
          className={`flex-1 px-4 py-2 rounded-[10px] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "dashboard"
              ? "bg-primary/20 text-primary"
              : "text-text-secondary"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BarChart3 className="w-4 h-4" />
          Dynamic
        </motion.button>
        <motion.button
          onClick={() => onTabChange("profile")}
          className={`flex-1 px-4 py-2 rounded-[10px] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === "profile"
              ? "bg-primary/20 text-primary"
              : "text-text-secondary"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <User className="w-4 h-4" />
          Profile
        </motion.button>
      </div>
    </nav>
  );
};
