"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

export function GameNarration({
  text,
  ambiance,
  onComplete,
}: {
  text: string;
  ambiance: string;
  onComplete: () => void;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const isComplete = revealedCount >= text.length;

  useEffect(() => {
    setRevealedCount(0);
    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 32);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  const skip = useCallback(() => {
    if (!isComplete) setRevealedCount(text.length);
  }, [isComplete, text.length]);

  const paragraphs = text.split("\n\n");
  let charIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="cursor-pointer select-none"
      onClick={skip}
    >
      <p className="mb-4 font-mono text-xs tracking-[0.3em] uppercase"
        style={{ color: "var(--game-accent)" }}>
        {ambiance}
      </p>
      <div className="space-y-4 font-serif text-lg leading-relaxed sm:text-xl"
        style={{ color: "var(--game-text)" }}>
        {paragraphs.map((paragraph, i) => {
          const start = charIndex;
          charIndex += paragraph.length + (i < paragraphs.length - 1 ? 2 : 0);
          const visible = Math.max(0, Math.min(paragraph.length, revealedCount - start));
          if (visible === 0 && start > revealedCount) return null;
          return (
            <p key={i}>
              {paragraph.slice(0, visible)}
              {visible < paragraph.length && visible > 0 && (
                <span className="typewriter-cursor">|</span>
              )}
            </p>
          );
        })}
        {isComplete && (
          <span className="typewriter-cursor">|</span>
        )}
      </div>
      {!isComplete && (
        <p className="mt-6 text-center text-xs animate-pulse"
          style={{ color: "var(--game-muted)" }}>
          Tap to skip...
        </p>
      )}
    </motion.div>
  );
}
