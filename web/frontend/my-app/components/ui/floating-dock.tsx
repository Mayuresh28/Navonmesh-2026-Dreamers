"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  accentColor?: string;   // border/glow accent per item
}

interface FloatingDockProps {
  items: DockItem[];
  className?: string;
}

/* ── Main Dock ── */
export function FloatingDock({ items, className = "" }: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="floating-dock-wrapper">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.15 }}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`floating-dock ${className}`}
      >
        {items.map((item) => (
          <DockIcon key={item.title} mouseX={mouseX} item={item} />
        ))}
      </motion.nav>
    </div>
  );
}

/* ── Single Dock Icon ── */
function DockIcon({ mouseX, item }: { mouseX: MotionValue<number>; item: DockItem }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  /* Distance-based scaling */
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform  = useTransform(distance, [-150, 0, 150], [46, 66, 46]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [46, 66, 46]);
  const iconSize        = useTransform(distance, [-150, 0, 150], [22, 32, 22]);

  const width  = useSpring(widthTransform,  { mass: 0.1, stiffness: 200, damping: 14 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 200, damping: 14 });
  const iconW  = useSpring(iconSize,        { mass: 0.1, stiffness: 200, damping: 14 });

  const accent = item.accentColor || "var(--teal)";

  return (
    <motion.button
      ref={ref}
      onClick={item.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        height,
        borderColor: item.active ? accent : "var(--border-strong)",
        boxShadow: item.active
          ? `0 0 12px ${accent}33, 0 0 0 2px ${accent}22`
          : "none",
      }}
      className={`dock-icon-btn ${item.active ? "dock-active" : ""}`}
    >
      {/* Tooltip */}
      {hovered && (
        <motion.span
          initial={{ opacity: 0, y: 8, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 4, x: "-50%" }}
          className="dock-tooltip"
          style={{ borderColor: accent }}
        >
          {item.title}
        </motion.span>
      )}

      {/* Icon */}
      <motion.div
        style={{ width: iconW, height: iconW }}
        className="dock-icon-inner"
      >
        {item.icon}
      </motion.div>

      {/* Active indicator dot */}
      {item.active && (
        <motion.span
          layoutId="dock-active-dot"
          className="dock-active-dot"
          style={{ background: accent }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        />
      )}
    </motion.button>
  );
}
