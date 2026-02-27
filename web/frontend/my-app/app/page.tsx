"use client";

import { motion } from "framer-motion";
import { HeartPulse, ArrowRight, Activity, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/auth/sign-up");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0eaff] via-[#e8e0ff] to-[#ddd3f8] relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#c9b8f0]/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-8%] w-[40%] h-[45%] bg-[#a78bfa]/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[20%] h-[25%] bg-[#e0d4fc]/50 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 w-full px-6 py-5 md:px-12"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/12 flex items-center justify-center border border-[#7C3AED]/20">
              <HeartPulse className="text-[#7C3AED] w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-[#5B21B6] tracking-tight">
              धन्वंतरी
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="text-[#7C3AED] text-sm font-semibold px-5 py-2.5 rounded-[14px] bg-white/70 hover:bg-white/90 transition-all duration-200 border border-[#7C3AED]/15 shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="text-[#5B21B6]/70 hover:text-[#5B21B6] text-sm font-semibold px-5 py-2.5 rounded-[14px] hover:bg-white/40 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="text-white text-sm font-semibold px-6 py-2.5 rounded-[14px] bg-[#7C3AED] hover:bg-[#6D28D9] transition-all duration-200 shadow-[0_4px_16px_rgba(124,58,237,0.3)]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 md:pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 text-[#7C3AED] text-sm font-medium border border-[#7C3AED]/10 shadow-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Navonmesh Hackathon 2026
          </motion.div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#2E1065] leading-[1.1] mb-6 tracking-tight">
            Proactive Care,
            <br />
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent">
              Empowered Living.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#5B21B6]/60 text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            A preventive health monitoring and early risk detection framework
            designed to bridge gaps and protect your future.
          </p>

          {/* CTA */}
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-3 px-10 py-4 md:px-12 md:py-5 rounded-[18px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-lg font-bold shadow-[0_8px_30px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.45)] transition-all duration-300 cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </motion.button>
        </motion.div>

        {/* ── Feature Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 md:mt-28 max-w-4xl w-full"
        >
          {[
            {
              icon: <Activity className="w-6 h-6 text-[#7C3AED]" />,
              title: "Continuous Monitoring",
              desc: "Real-time health parameter tracking for proactive care.",
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-[#059669]" />,
              title: "Early Detection",
              desc: "Identify potential risks before they become critical.",
            },
            {
              icon: <HeartPulse className="w-6 h-6 text-[#D97706]" />,
              title: "Accessible Insights",
              desc: "Actionable insights for every socio-economic group.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="bg-white/55 backdrop-blur-md rounded-[20px] p-6 border border-white/60 shadow-[0_2px_20px_rgba(124,58,237,0.06)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.1)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-[14px] bg-[#7C3AED]/8 flex items-center justify-center mb-4 border border-[#7C3AED]/10">
                {f.icon}
              </div>
              <h3 className="text-[17px] font-semibold text-[#2E1065] mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-[#5B21B6]/50 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

/*
 * ═══════════════════════════════════════════════════════════════
 * HERO IMAGE VERSION (commented out for restoration later)
 * To restore: replace the entire default export above with this.
 * ═══════════════════════════════════════════════════════════════
 *
 * import Image from "next/image";
 *
 * export default function LandingPage() {
 *   const { user } = useAuth();
 *   const router = useRouter();
 *
 *   const handleGetStarted = () => {
 *     if (user) { router.push("/dashboard"); }
 *     else { router.push("/auth/sign-up"); }
 *   };
 *
 *   return (
 *     <div className="relative min-h-screen w-full bg-[#c4b5e3]">
 *       <Image
 *         src="/imgs/hero.png"
 *         alt="Health monitoring illustration"
 *         fill
 *         priority
 *         className="object-contain object-center"
 *         quality={90}
 *       />
 *       <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 z-[1]" />
 *       <motion.nav
 *         initial={{ opacity: 0, y: -20 }}
 *         animate={{ opacity: 1, y: 0 }}
 *         transition={{ duration: 0.6 }}
 *         className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12"
 *       >
 *         <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/85 backdrop-blur-xl rounded-[20px] px-6 py-3 border border-white/40 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
 *           <div className="flex items-center gap-3">
 *             <div className="w-10 h-10 rounded-full bg-[#6C3FC5]/15 flex items-center justify-center border border-[#6C3FC5]/20">
 *               <HeartPulse className="text-[#6C3FC5] w-5 h-5" />
 *             </div>
 *             <span className="text-2xl font-bold text-[#6C3FC5] tracking-tight">धन्वंतरी</span>
 *           </div>
 *           <div className="flex items-center gap-2">
 *             {user ? (
 *               <Link href="/dashboard" className="text-[#6C3FC5] hover:text-[#5530A0] text-sm font-semibold px-5 py-2 rounded-[12px] bg-[#6C3FC5]/10 hover:bg-[#6C3FC5]/18 transition-all duration-200 border border-[#6C3FC5]/15">
 *                 Dashboard
 *               </Link>
 *             ) : (
 *               <>
 *                 <Link href="/auth/sign-in" className="text-[#6C3FC5]/80 hover:text-[#6C3FC5] text-sm font-semibold px-4 py-2 rounded-[12px] hover:bg-[#6C3FC5]/8 transition-all duration-200">Sign In</Link>
 *                 <Link href="/auth/sign-up" className="text-white text-sm font-semibold px-5 py-2 rounded-[12px] bg-[#6C3FC5] hover:bg-[#5530A0] transition-all duration-200 shadow-sm">Sign Up</Link>
 *               </>
 *             )}
 *           </div>
 *         </div>
 *       </motion.nav>
 *       <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-12 md:pb-16">
 *         <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-col items-center gap-5">
 *           <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="text-white/80 text-sm md:text-base font-medium tracking-wide drop-shadow-md text-center px-6">
 *             Preventive Health Monitoring & Early Risk Detection
 *           </motion.p>
 *           <motion.button
 *             onClick={handleGetStarted}
 *             whileHover={{ scale: 1.03, y: -2 }}
 *             whileTap={{ scale: 0.97 }}
 *             className="group flex items-center gap-3 px-10 py-4 md:px-12 md:py-5 rounded-[20px] bg-white/90 hover:bg-white backdrop-blur-xl text-[#6C3FC5] text-lg md:text-xl font-bold tracking-wide border border-white/50 shadow-[0_8px_32px_rgba(108,63,197,0.2)] hover:shadow-[0_8px_40px_rgba(108,63,197,0.35)] transition-all duration-300 cursor-pointer"
 *           >
 *             Get Started
 *             <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
 *           </motion.button>
 *         </motion.div>
 *       </div>
 *     </div>
 *   );
 * }
 */
