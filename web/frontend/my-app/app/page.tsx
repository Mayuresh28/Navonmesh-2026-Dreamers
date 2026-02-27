"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck, HeartPulse, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary">
      {/* Soft Background Blur Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-3xl -z-10 mix-blend-multiply" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] bg-status-low/20 rounded-full blur-3xl -z-10 mix-blend-multiply" />

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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button className="text-text-secondary hover:text-primary transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-accent/30">
            Sign In
          </button>
        </motion.div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 md:px-12 text-center w-full max-w-5xl mx-auto z-10 mt-12 mb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center max-w-3xl"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-[16px] bg-accent/50 text-primary text-sm font-medium border border-primary/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Navonmesh Hackathon 2026
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-text-primary leading-[1.15] mb-6"
          >
            Proactive Care,<br />
            <span className="text-primary tracking-tight">Empowered Living.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-text-secondary text-base md:text-lg mb-10 max-w-xl leading-relaxed font-normal"
          >
            Welcome to <b className="text-text-primary text-[1.1em] font-semibold">धन्वंतरी</b>. A preventive health monitoring and early risk detection framework designed to bridge gaps and protect your future.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button className="btn-primary flex items-center justify-center gap-2 group">
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
              icon: <Activity className="text-primary w-6 h-6" />,
              title: "Continuous Monitoring",
              desc: "Real-time health parameter tracking at scale for proactive care and analytics."
            },
            {
              icon: <ShieldCheck className="text-status-low w-6 h-6" />,
              title: "Early Detection",
              desc: "Identify potential health risks early before they become critical medical emergencies."
            },
            {
              icon: <HeartPulse className="text-status-mod w-6 h-6" />,
              title: "Accessible Insights",
              desc: "Bridging the digital divide with actionable insights for every socio-economic group."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="card group flex flex-col relative overflow-hidden"
            >
              {/* Subtle gradient hover effect on card */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="w-12 h-12 rounded-[16px] bg-accent/40 flex items-center justify-center mb-5 mt-1 border border-border-soft group-hover:scale-[1.05] transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-[18px] font-semibold text-text-primary mb-2.5 tracking-tight">{feature.title}</h3>
              <p className="text-[14px] text-text-secondary leading-relaxed font-normal">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
