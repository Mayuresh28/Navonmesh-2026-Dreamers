"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function EcgBarSvg() {
  const points =
    "0,22 60,22 75,22 82,7 90,37 97,3 104,41 110,22 140,22 200,22 215,7 222,37 229,3 236,41 242,22 280,22 340,22 355,7 362,37 369,3 376,41 382,22 420,22 480,22 495,7 502,37 509,3 516,41 522,22 560,22 620,22 635,7 642,37 649,3 656,41 662,22 700,22 760,22 775,7 782,37 789,3 796,41 802,22 840,22 900,22 915,7 922,37 929,3 936,41 942,22 980,22 1040,22 1055,7 1062,37 1069,3 1076,41 1082,22 1120,22 1180,22 1195,7 1202,37 1209,3 1216,41 1222,22 1260,22 1320,22 1335,7 1342,37 1349,3 1356,41 1362,22 1400,22";
  return (
    <svg viewBox="0 0 1400 44" fill="none">
      <polyline stroke="#52b788" strokeWidth="1.5" fill="none" points={points} />
      <polyline
        stroke="#52b788"
        strokeWidth="1.5"
        fill="none"
        transform="translate(1400,0)"
        points={points}
      />
    </svg>
  );
}

function MandalaSvg() {
  return (
    <svg className="mandala" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <g fill="none">
        <circle cx="250" cy="250" r="224" stroke="#1b4332" strokeWidth="2.5" strokeOpacity="1" />
        <circle cx="250" cy="250" r="182" stroke="#d4a017" strokeWidth="1.5" strokeOpacity=".9" strokeDasharray="6 11" />
        <line x1="26" y1="250" x2="474" y2="250" stroke="#1b4332" strokeWidth="1.8" strokeOpacity=".85" />
        <line x1="250" y1="26" x2="250" y2="474" stroke="#1b4332" strokeWidth="1.8" strokeOpacity=".85" />
        <line x1="92" y1="92" x2="408" y2="408" stroke="#1b4332" strokeWidth="1.5" strokeOpacity=".8" />
        <line x1="408" y1="92" x2="92" y2="408" stroke="#1b4332" strokeWidth="1.5" strokeOpacity=".8" />
        <polygon points="250,32 456,384 44,384" stroke="#d4a017" strokeWidth="2" strokeOpacity=".9" />
        <polygon points="250,468 44,116 456,116" stroke="#d4a017" strokeWidth="2" strokeOpacity=".9" />
        <circle cx="250" cy="72" r="38" stroke="#1b4332" strokeWidth="1.8" strokeOpacity=".75" />
        <circle cx="250" cy="428" r="38" stroke="#1b4332" strokeWidth="1.8" strokeOpacity=".75" />
        <circle cx="72" cy="250" r="38" stroke="#1b4332" strokeWidth="1.8" strokeOpacity=".75" />
        <circle cx="428" cy="250" r="38" stroke="#1b4332" strokeWidth="1.8" strokeOpacity=".75" />
        <circle cx="120" cy="120" r="36" stroke="#d4a017" strokeWidth="1.5" strokeOpacity=".7" />
        <circle cx="380" cy="120" r="36" stroke="#d4a017" strokeWidth="1.5" strokeOpacity=".7" />
        <circle cx="120" cy="380" r="36" stroke="#d4a017" strokeWidth="1.5" strokeOpacity=".7" />
        <circle cx="380" cy="380" r="36" stroke="#d4a017" strokeWidth="1.5" strokeOpacity=".7" />
        <circle cx="250" cy="26" r="6" fill="#1b4332" fillOpacity=".95" />
        <circle cx="250" cy="474" r="6" fill="#1b4332" fillOpacity=".95" />
        <circle cx="26" cy="250" r="6" fill="#1b4332" fillOpacity=".95" />
        <circle cx="474" cy="250" r="6" fill="#1b4332" fillOpacity=".95" />
        <circle cx="92" cy="92" r="5" fill="#d4a017" fillOpacity=".95" />
        <circle cx="408" cy="408" r="5" fill="#d4a017" fillOpacity=".95" />
        <circle cx="408" cy="92" r="5" fill="#d4a017" fillOpacity=".95" />
        <circle cx="92" cy="408" r="5" fill="#d4a017" fillOpacity=".95" />
        <circle cx="250" cy="250" r="10" stroke="#1b4332" strokeWidth="2" strokeOpacity=".9" />
        <circle cx="250" cy="250" r="5" fill="#d4a017" fillOpacity="1" />
      </g>
    </svg>
  );
}



/* ═══════════════════════════════════════════════════════════════
   STAT COUNTER HOOK
   ═══════════════════════════════════════════════════════════════ */

function useCountUp(end: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setValue(Math.round(progress * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { ref, value };
}

function StatBlock({
  end,
  suffix = "",
  label,
  colorClass,
}: {
  end: number;
  suffix?: string;
  label: string;
  colorClass: string;
}) {
  const { ref, value } = useCountUp(end);
  return (
    <div className="landing-stat" ref={ref}>
      <div className={`stat-n ${colorClass}`}>
        {value}
        {suffix}
      </div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

function InfinityStat({ label }: { label: string }) {
  return (
    <div className="landing-stat">
      <div className="stat-n na">&infin;</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);

  const handleCta = () => {
    if (user) router.push("/dashboard/results");
    else router.push("/auth/sign-up");
  };

  /* Custom cursor tracking */
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let mx = 0, my = 0;
    let rx = 0, ry = 0;
    const trailPositions = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }));

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    let raf: number;
    const tick = () => {
      // Dot follows instantly
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx}px, ${my}px)`;
      }
      // Ring follows with lag
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }
      // Trail particles follow with cascaded lag
      for (let i = 0; i < trailPositions.length; i++) {
        const prev = i === 0 ? { x: mx, y: my } : trailPositions[i - 1];
        trailPositions[i].x += (prev.x - trailPositions[i].x) * (0.18 - i * 0.025);
        trailPositions[i].y += (prev.y - trailPositions[i].y) * (0.18 - i * 0.025);
        if (trailRefs.current[i]) {
          trailRefs.current[i].style.transform = `translate(${trailPositions[i].x}px, ${trailPositions[i].y}px) scale(${1 - i * 0.15})`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="landing-page" style={{ fontFamily: "var(--font-dm-sans), sans-serif", background: "var(--cream)", color: "var(--ink)", overflowX: "hidden" }}>

      {/* Custom cursor */}
      <div className="custom-cursor-dot" ref={cursorRef} />
      <div className="custom-cursor-ring" ref={cursorRingRef} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`cursor-trail ct-${i}`}
          ref={(el) => { if (el) trailRefs.current[i] = el; }}
        />
      ))}

     

      {/* ══ NAV ══ */}
      <nav className="landing-nav">
        <div className="nav-logo" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/imgs/logo.png" alt="" width={32} height={32} style={{ borderRadius: "50%" }} />
          धन्वंतरी
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="landing-hero" id="hero">
        <div className="landing-blobs">
          <div className="landing-blob lb1" />
          <div className="landing-blob lb2" />
          <div className="landing-blob lb3" />
        </div>

        {/* <MandalaSvg /> */}

        <div className="hero-inner">
          {/* LEFT */}
          <div className="hero-left">
            
            <div className="shlok-deva">
              <TypewriterEffectSmooth
                words={[
                  { text: "आरोग्यं" },
                  { text: "परमं" },
                  { text: "भाग्यम्" },
                  { text: "॥" },
                ]}
              />
            </div>
            <motion.div
              className="shlok-en"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
            >
              &ldquo;Health is the supreme fortune,<br />
              the greatest wealth a soul can possess.&rdquo;
            </motion.div>
            <div className="shlok-src">Ashtanga Hridayam · Sutrasthana 1.2</div>

            <button onClick={handleCta} className="hero-cta-btn">
              {user ? "Open Dashboard" : "Begin Your Journey"}
              <span className="cta-arrow">→</span>
            </button>
          </div>

          {/* RIGHT — Doctor + animations */}
          <div className="hero-centre">
            <MandalaSvg />
            <div className="doc-halo" />
            <div className="orbit-ring" />
            <div className="orbit-ring orbit-ring-2" />

            {/* Pulse rings */}
            <div className="pulse-ring pr1" />
            <div className="pulse-ring pr2" />
            <div className="pulse-ring pr3" />

            {/* Orbiting data pills */}
            <div className="data-pill dp-hr">
              ❤️ 72 bpm
            </div>
            <div className="data-pill dp-spo2">
              🩸 SpO₂ 98%
            </div>
            <div className="data-pill dp-glucose">
              🍯 Glucose 94
            </div>
            <div className="data-pill dp-bp">
              🩺 BP 120/80
            </div>

            {/* Glow particles */}
            <div className="glow-particle gp1" />
            <div className="glow-particle gp2" />
            <div className="glow-particle gp3" />
            <div className="glow-particle gp4" />
            <div className="glow-particle gp5" />
            <div className="glow-particle gp6" />

            <Image
              src="/imgs/doctor.png"
              alt="Doctor illustration"
              width={420}
              height={520}
              className="doc-img"
              priority
            />
          </div>
        </div>
      </section>

    

    </div>
  );
}
