"use client";

import { motion } from "framer-motion";

/**
 * Animated glassmorphic background with floating translucent bubbles.
 * Uses the design-system color palette (pastel blues, greens, pinks).
 * Drop this as a sibling of your page content inside a `relative overflow-hidden` wrapper.
 */

const bubbles = [
  // Large slow-moving orbs
  { size: 320, x: "-5%", y: "-8%",  color: "rgba(126,166,247,0.18)", dur: 18, dx: 40,  dy: 30  },
  { size: 280, x: "70%", y: "-12%", color: "rgba(91,123,234,0.14)",  dur: 22, dx: -35, dy: 45  },
  { size: 240, x: "85%", y: "55%",  color: "rgba(207,224,255,0.22)", dur: 20, dx: -30, dy: -40 },
  { size: 200, x: "-8%", y: "60%",  color: "rgba(134,227,163,0.12)", dur: 24, dx: 50,  dy: -25 },

  // Medium accent orbs
  { size: 160, x: "35%", y: "10%",  color: "rgba(126,166,247,0.10)", dur: 16, dx: -25, dy: 35  },
  { size: 140, x: "55%", y: "70%",  color: "rgba(255,213,128,0.10)", dur: 19, dx: 30,  dy: -30 },
  { size: 120, x: "15%", y: "35%",  color: "rgba(207,224,255,0.16)", dur: 14, dx: 35,  dy: 20  },

  // Small sparkle orbs
  { size: 80,  x: "45%", y: "25%",  color: "rgba(255,156,156,0.08)", dur: 12, dx: -20, dy: 25  },
  { size: 60,  x: "25%", y: "80%",  color: "rgba(126,166,247,0.12)", dur: 15, dx: 25,  dy: -20 },
  { size: 50,  x: "80%", y: "30%",  color: "rgba(134,227,163,0.10)", dur: 13, dx: -15, dy: 20  },
];

export function GlassmorphicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F7FB] via-[#EEF3FD] to-[#E8EEFA]" />

      {/* Floating bubbles */}
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background: `radial-gradient(circle at 35% 35%, ${b.color}, transparent 70%)`,
            filter: "blur(2px)",
          }}
          animate={{
            x: [0, b.dx, -b.dx * 0.6, 0],
            y: [0, b.dy, -b.dy * 0.5, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glassmorphic noise overlay for depth */}
      <div className="absolute inset-0 backdrop-blur-[0.5px] bg-white/[0.02]" />
    </div>
  );
}
