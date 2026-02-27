"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--color-bg-light)] font-sans p-6 sm:p-12 overflow-hidden selection:bg-[var(--color-accent-blue)]">
      {/* Soft gradient background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-accent-blue)] opacity-40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#E3EAF5] opacity-50 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <main className="flex flex-col items-center justify-center w-full max-w-4xl flex-1 z-10 text-center gap-10">
        
        {/* Animated Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-white p-4 rounded-full shadow-[0px_4px_24px_rgba(126,166,247,0.15)] mb-2">
            <ShieldCheck className="w-12 h-12 text-[var(--color-primary-blue)]" />
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-[var(--color-primary-blue)] drop-shadow-sm">
            धन्वंतरी
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-lg mt-2 leading-relaxed">
            Your Proactive Sentinel for Preventive Health Monitoring & Early Risk Detection.
          </p>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mt-4"
        >
          {[
            {
              icon: <Activity className="w-6 h-6 text-[var(--color-risk-low)]" />,
              title: "Continuous Tracking",
              desc: "Real-time vitals monitoring"
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-[var(--color-primary-blue)]" />,
              title: "Insights",
              desc: "Actionable health trends"
            }
          ].map((feature, idx) => (
             <motion.div 
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4 bg-white p-5 rounded-[20px] shadow-[0px_8px_32px_rgba(0,0,0,0.03)] border border-[var(--color-border-light)]"
            >
              <div className="p-3 bg-[var(--color-bg-light)] rounded-2xl">
                {feature.icon}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[16px] text-[var(--color-text-primary)]">{feature.title}</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)]">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
          className="mt-6"
        >
          <Link href="/auth">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "var(--color-secondary-blue)", boxShadow: "0px 8px 24px rgba(126,166,247,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-[var(--color-primary-blue)] text-white px-8 py-4 rounded-[16px] font-medium text-lg transition-all"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
