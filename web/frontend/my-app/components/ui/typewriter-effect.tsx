"use client";

import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

export function TypewriterEffectSmooth({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true });

  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        { width: "fit-content", opacity: 1 },
        {
          duration: 0.4,
          delay: stagger(0.15),
          ease: "easeInOut",
        }
      );
    }
  }, [isInView, animate]);

  const renderWords = () =>
    words.map((word, idx) => (
      <span key={`word-${idx}`} className="inline-block">
        <motion.span
          className={`${word.className ?? ""}`}
          style={{
            display: "inline-block",
            width: 0,
            opacity: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {word.text}
          {idx < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      </span>
    ));

  return (
    <span ref={scope} className={className ?? ""} style={{ display: "inline-flex", flexWrap: "wrap" }}>
      {renderWords()}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className={cursorClassName ?? ""}
        style={{
          display: "inline-block",
          width: "2px",
          height: "1em",
          background: "var(--sage, #2d6a4f)",
          marginLeft: "4px",
          alignSelf: "center",
          borderRadius: "1px",
        }}
      />
    </span>
  );
}
