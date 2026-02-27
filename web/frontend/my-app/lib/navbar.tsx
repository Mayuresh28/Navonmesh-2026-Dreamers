"use client";

import { motion } from "framer-motion";
import { HeartPulse, BarChart3, User, LogOut, ShieldCheck, Sun, Moon } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { FC } from "react";

interface NavbarProps {
  activeTab: "dashboard" | "profile" | "results";
  onTabChange: (tab: "dashboard" | "profile" | "results") => void;
}

export const Navbar: FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("[Navbar] Sign out error:", error);
    }
  };

  const tabStyle = (active: boolean) => ({
    background: active ? "var(--teal-bg)" : "transparent",
    color: active ? "var(--teal)" : "var(--text-muted)",
    border: active ? "1.5px solid var(--border-accent)" : "1.5px solid transparent",
  });

  return (
    <nav className="w-full sticky top-0 z-50 backdrop-blur-xl"
      style={{ background: "var(--topbar-bg)", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--teal-bg)", border: "1.5px solid var(--border-accent)" }}>
            <HeartPulse className="w-5 h-5" style={{ color: "var(--teal)" }} />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--teal)" }}>
            Dhanvantari
          </span>
        </motion.div>

        {/* Tabs */}
        <div className="hidden md:flex items-center gap-1 rounded-[16px] p-1"
          style={{ background: "var(--bg-raised)", border: "1.5px solid var(--border)" }}>
          {[
            { key: "dashboard", label: "Dynamic Data", icon: BarChart3 },
            { key: "results", label: "Risk Results", icon: ShieldCheck },
            { key: "profile", label: "Profile", icon: User },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => onTabChange(tab.key as "dashboard" | "profile" | "results")}
              className="px-5 py-2 rounded-[12px] font-medium transition-all duration-200 flex items-center gap-2 text-sm"
              style={tabStyle(activeTab === tab.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={toggle}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--bg-raised)", border: "1.5px solid var(--border-strong)" }}>
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} /> : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
          </button>
          <motion.button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-[12px] transition-all duration-200"
            style={{ color: "var(--text-muted)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="md:hidden px-4 py-2.5 flex items-center gap-1"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        {[
          { key: "dashboard", label: "Dynamic", icon: BarChart3 },
          { key: "results", label: "Results", icon: ShieldCheck },
          { key: "profile", label: "Profile", icon: User },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => onTabChange(tab.key as "dashboard" | "profile" | "results")}
            className="flex-1 px-3 py-2 rounded-[10px] font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5"
            style={tabStyle(activeTab === tab.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </motion.button>
        ))}
      </div>
    </nav>
  );
};
