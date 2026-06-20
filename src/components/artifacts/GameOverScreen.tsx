"use client";

import { motion } from "framer-motion";

export function GameOverScreen({
  flavorText,
  onRestart,
}: {
  flavorText: string | null;
  onRestart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <motion.h1
        className="game-over-text mb-6 text-5xl font-black tracking-widest sm:text-7xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
        style={{ color: "#dc2626" }}
      >
        GAME OVER
      </motion.h1>

      {flavorText && (
        <motion.p
          className="mx-auto max-w-lg font-serif text-lg leading-relaxed sm:text-xl"
          style={{ color: "var(--game-muted)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {flavorText}
        </motion.p>
      )}

      <motion.button
        type="button"
        onClick={onRestart}
        className="mt-10 rounded-xl border-2 px-8 py-3 font-mono text-sm font-bold tracking-wider uppercase transition-colors"
        style={{
          borderColor: "rgba(220,38,38,0.5)",
          color: "#dc2626",
        }}
        whileHover={{
          borderColor: "rgba(220,38,38,0.9)",
          background: "rgba(220,38,38,0.1)",
        }}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        🔄 Try Again
      </motion.button>
    </motion.div>
  );
}
