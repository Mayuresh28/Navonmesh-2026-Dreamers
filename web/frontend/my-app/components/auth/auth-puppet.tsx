"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export type PuppetState = "idle" | "watching" | "hiding" | "success" | "error";

interface AuthPuppetProps {
  state: PuppetState;
  /** 0‒1 – how far through the active input the user has typed  */
  progress?: number;
}

/* ─── Vedic Doctor Illustration ─── */
export default function AuthPuppet({ state, progress = 0 }: AuthPuppetProps) {
  const eyeControls = useAnimation();
  const handControls = useAnimation();
  const bodyControls = useAnimation();

  /* Eye pupil offset for "watching" (follows progress left→right) */
  const pupilX = state === "watching" ? -4 + progress * 8 : 0;
  const pupilY = state === "watching" ? 1 : 0;

  useEffect(() => {
    switch (state) {
      case "idle":
        eyeControls.start({ scaleY: 1, y: 0, transition: { duration: 0.35 } });
        handControls.start({ y: 0, transition: { duration: 0.4 } });
        bodyControls.start({ rotate: 0, transition: { duration: 0.4 } });
        break;
      case "watching":
        eyeControls.start({ scaleY: 1, y: 0, transition: { duration: 0.25 } });
        handControls.start({ y: 0, transition: { duration: 0.3 } });
        bodyControls.start({ rotate: 0, transition: { duration: 0.3 } });
        break;
      case "hiding":
        handControls.start({ y: -55, transition: { type: "spring", stiffness: 260, damping: 18 } });
        eyeControls.start({ scaleY: 0.1, y: 0, transition: { delay: 0.12, duration: 0.25 } });
        break;
      case "success":
        eyeControls.start({
          scaleY: [1, 0.15, 1],
          transition: { duration: 0.5, times: [0, 0.4, 1] },
        });
        bodyControls.start({ rotate: [0, -5, 5, 0], transition: { duration: 0.6 } });
        handControls.start({ y: 0, transition: { duration: 0.3 } });
        break;
      case "error":
        bodyControls.start({
          rotate: [0, -3, 3, -3, 3, 0],
          transition: { duration: 0.5 },
        });
        handControls.start({ y: 0, transition: { duration: 0.3 } });
        eyeControls.start({ scaleY: 1, y: 0, transition: { duration: 0.3 } });
        break;
    }
  }, [state, eyeControls, handControls, bodyControls]);

  return (
    <div className="auth-puppet-wrap">
      {/* ── Magenta glow ring ── */}
      <div className="puppet-glow-ring" />

      <motion.svg
        viewBox="0 0 200 260"
        className="auth-puppet-svg"
        animate={bodyControls}
      >
        <defs>
          {/* Lab coat gradient  */}
          <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e8e4f0" />
          </linearGradient>
          {/* Scrubs gradient */}
          <linearGradient id="scrubGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2d6a4f" />
            <stop offset="100%" stopColor="#1b4332" />
          </linearGradient>
          {/* Stethoscope gradient */}
          <linearGradient id="stethGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#a68830" />
          </linearGradient>
        </defs>

        {/* ── Neck ── */}
        <rect x="90" y="96" width="20" height="18" rx="6" fill="#d4a574" />

        {/* ── Body / Scrub top ── */}
        <path
          d="M58,230 L58,145 Q58,118 82,112 L100,108 L118,112 Q142,118 142,145 L142,230 Z"
          fill="url(#scrubGrad)"
        />
        {/* V-neck detail */}
        <path
          d="M88,112 L100,132 L112,112"
          fill="none"
          stroke="#1b4332"
          strokeWidth="2"
          opacity={0.4}
        />

        {/* ── Lab coat (open, over scrubs) ── */}
        <motion.path
          d="M52,230 L52,140 Q52,116 72,110 L82,108 L82,230 Z"
          fill="url(#coatGrad)"
          opacity={0.92}
        />
        <motion.path
          d="M148,230 L148,140 Q148,116 128,110 L118,108 L118,230 Z"
          fill="url(#coatGrad)"
          opacity={0.92}
        />
        {/* Coat lapels */}
        <path d="M82,108 L88,112 L82,135 Z" fill="#d8d4e4" opacity={0.5} />
        <path d="M118,108 L112,112 L118,135 Z" fill="#d8d4e4" opacity={0.5} />
        {/* Coat pocket left */}
        <rect x="58" y="168" width="18" height="14" rx="3" fill="none" stroke="#c0bcd0" strokeWidth="1.2" opacity={0.5} />
        {/* Coat pocket right */}
        <rect x="124" y="168" width="18" height="14" rx="3" fill="none" stroke="#c0bcd0" strokeWidth="1.2" opacity={0.5} />
        {/* Pen in left pocket */}
        <line x1="63" y1="165" x2="63" y2="175" stroke="#d94f8c" strokeWidth="2" strokeLinecap="round" />
        <circle cx="63" cy="164" r="1.5" fill="#d94f8c" />

        {/* ── Stethoscope ── */}
        <path
          d="M90,112 Q85,128 88,148 Q90,158 95,162"
          fill="none"
          stroke="url(#stethGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M110,112 Q115,128 112,148 Q110,158 105,162"
          fill="none"
          stroke="url(#stethGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Chestpiece */}
        <circle cx="100" cy="164" r="7" fill="#c9a84c" />
        <circle cx="100" cy="164" r="4" fill="#a68830" />
        <circle cx="100" cy="164" r="2" fill="#8a7020" opacity={0.6} />
        {/* Earpieces */}
        <circle cx="88" cy="110" r="2.5" fill="#c9a84c" />
        <circle cx="112" cy="110" r="2.5" fill="#c9a84c" />

        {/* ── Head ── */}
        <ellipse cx="100" cy="78" rx="36" ry="40" fill="#d4a574" />
        {/* Subtle jaw shape */}
        <ellipse cx="100" cy="90" rx="28" ry="18" fill="#c8975e" opacity={0.2} />

        {/* ── Hair ── */}
        <path
          d="M64,72 Q64,38 100,34 Q136,38 136,72 Q130,54 100,50 Q70,54 64,72 Z"
          fill="#1a1a2e"
        />
        {/* Side hair */}
        <path d="M64,72 Q62,60 66,52" fill="none" stroke="#1a1a2e" strokeWidth="6" strokeLinecap="round" />
        <path d="M136,72 Q138,60 134,52" fill="none" stroke="#1a1a2e" strokeWidth="6" strokeLinecap="round" />
        {/* Hair highlight */}
        <path
          d="M80,44 Q100,38 120,44"
          fill="none"
          stroke="#2a2a4e"
          strokeWidth="2"
          opacity={0.3}
        />

        {/* ── Ears ── */}
        <ellipse cx="64" cy="78" rx="6" ry="9" fill="#c8975e" />
        <ellipse cx="136" cy="78" rx="6" ry="9" fill="#c8975e" />

        {/* ── Eyes ── */}
        <g>
          {/* Left eye socket */}
          <ellipse cx="84" cy="76" rx="12" ry="13" fill="white" />
          {/* Right eye socket */}
          <ellipse cx="116" cy="76" rx="12" ry="13" fill="white" />

          {/* Iris — animated */}
          <motion.circle
            cx={84 + pupilX}
            cy={76 + pupilY}
            r="7"
            fill="#3d2914"
            animate={eyeControls}
          />
          <motion.circle
            cx={116 + pupilX}
            cy={76 + pupilY}
            r="7"
            fill="#3d2914"
            animate={eyeControls}
          />

          {/* Pupil */}
          <motion.circle
            cx={84 + pupilX}
            cy={76 + pupilY}
            r="3.5"
            fill="#1a0f08"
            animate={eyeControls}
          />
          <motion.circle
            cx={116 + pupilX}
            cy={76 + pupilY}
            r="3.5"
            fill="#1a0f08"
            animate={eyeControls}
          />

          {/* Eye shine */}
          <circle cx={81 + pupilX} cy={73 + pupilY} r="2.5" fill="white" opacity={0.9} />
          <circle cx={113 + pupilX} cy={73 + pupilY} r="2.5" fill="white" opacity={0.9} />
          <circle cx={86 + pupilX} cy={78 + pupilY} r="1.2" fill="white" opacity={0.5} />
          <circle cx={118 + pupilX} cy={78 + pupilY} r="1.2" fill="white" opacity={0.5} />

          {/* Eyebrows */}
          <path d="M72,62 Q84,56 96,63" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M104,63 Q116,56 128,62" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" />

          {/* Eyelashes (subtle) */}
          <path d="M73,70 Q78,68 84,69" fill="none" stroke="#1a1a2e" strokeWidth="1" opacity={0.3} />
          <path d="M116,69 Q122,68 127,70" fill="none" stroke="#1a1a2e" strokeWidth="1" opacity={0.3} />
        </g>

        {/* ── Nose ── */}
        <path
          d="M97,82 Q100,90 103,82"
          fill="none"
          stroke="#b07d4e"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* ── Mouth ── */}
        <motion.path
          d={
            state === "success"
              ? "M86,97 Q100,110 114,97"
              : state === "error"
              ? "M88,102 Q100,96 112,102"
              : "M89,98 Q100,106 111,98"
          }
          fill={state === "success" ? "#d94f8c" : "none"}
          fillOpacity={state === "success" ? 0.15 : 0}
          stroke={state === "error" ? "#b91c1c" : "#8a5a3a"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* ── Blush ── */}
        <ellipse cx="70" cy="90" rx="7" ry="4.5" fill="#d94f8c" opacity={0.18} />
        <ellipse cx="130" cy="90" rx="7" ry="4.5" fill="#d94f8c" opacity={0.18} />

        {/* ── Glasses (thin wire frames) ── */}
        <circle cx="84" cy="76" r="15" fill="none" stroke="#c9a84c" strokeWidth="1.5" opacity={0.6} />
        <circle cx="116" cy="76" r="15" fill="none" stroke="#c9a84c" strokeWidth="1.5" opacity={0.6} />
        <line x1="99" y1="76" x2="101" y2="76" stroke="#c9a84c" strokeWidth="1.5" opacity={0.6} />
        <line x1="69" y1="76" x2="64" y2="74" stroke="#c9a84c" strokeWidth="1.2" opacity={0.4} />
        <line x1="131" y1="76" x2="136" y2="74" stroke="#c9a84c" strokeWidth="1.2" opacity={0.4} />

        {/* ── Arms (shoulder down) ── */}
        {/* Left arm */}
        <path
          d="M58,128 Q46,150 50,185"
          fill="none"
          stroke="url(#coatGrad)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Right arm */}
        <path
          d="M142,128 Q154,150 150,185"
          fill="none"
          stroke="url(#coatGrad)"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* ── Hands (cover eyes when hiding) ── */}
        <motion.g animate={handControls}>
          {/* Left hand */}
          <ellipse cx="50" cy="190" rx="14" ry="11" fill="#d4a574" />
          {/* Left fingers */}
          <ellipse cx="42" cy="187" rx="5" ry="7" fill="#d4a574" />
          <ellipse cx="38" cy="190" rx="4" ry="6" fill="#d4a574" />
          {/* Right hand */}
          <ellipse cx="150" cy="190" rx="14" ry="11" fill="#d4a574" />
          {/* Right fingers */}
          <ellipse cx="158" cy="187" rx="5" ry="7" fill="#d4a574" />
          <ellipse cx="162" cy="190" rx="4" ry="6" fill="#d4a574" />
        </motion.g>

        {/* ── ID Badge ── */}
        <rect x="62" y="142" width="14" height="18" rx="2" fill="white" stroke="#c9a84c" strokeWidth="1" />
        <rect x="65" y="146" width="8" height="3" rx="1" fill="#d94f8c" opacity={0.4} />
        <rect x="65" y="151" width="8" height="1.5" rx=".5" fill="#ccc" />
        <rect x="65" y="154" width="6" height="1.5" rx=".5" fill="#ccc" />
        {/* Badge clip */}
        <rect x="67" y="139" width="4" height="4" rx="1" fill="#c9a84c" />
      </motion.svg>

      {/* Floating particles */}
      <span className="puppet-particle pp1" />
      <span className="puppet-particle pp2" />
      <span className="puppet-particle pp3" />
    </div>
  );
}
