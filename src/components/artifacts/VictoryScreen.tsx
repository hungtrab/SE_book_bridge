"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function VictoryScreen({
  narration,
  health,
  maxHealth,
  onRestart,
}: {
  narration: string;
  health: number;
  maxHealth: number;
  onRestart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7, type: "spring" }}
      >
        <p className="mb-2 text-4xl">✨</p>
        <h1
          className="victory-glow text-3xl font-black tracking-wider sm:text-5xl"
          style={{
            background: "linear-gradient(135deg, #c9a84c, #f5d98e, #c9a84c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MISSION CLEARED
        </h1>
        <p className="mt-2 font-mono text-sm tracking-[0.4em] uppercase"
          style={{ color: "var(--game-accent)" }}>
          The Alchemist
        </p>
      </motion.div>

      <motion.div
        className="mx-auto mt-10 max-w-lg space-y-4 font-serif text-lg leading-relaxed"
        style={{ color: "var(--game-text)" }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        {narration.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </motion.div>

      <motion.div
        className="mt-10 flex items-center gap-4 font-mono text-xs"
        style={{ color: "var(--game-muted)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <span>❤️ {health}/{maxHealth} HP</span>
        <span>·</span>
        <span>Quest Complete</span>
      </motion.div>

      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
      >
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl border px-6 py-3 font-mono text-sm font-bold tracking-wider uppercase transition-colors"
          style={{
            borderColor: "rgba(201,168,76,0.4)",
            color: "var(--game-accent)",
          }}
        >
          🔄 Play Again
        </button>
        <Link
          href="/explore"
          className="rounded-xl border px-6 py-3 font-mono text-sm font-bold tracking-wider uppercase transition-colors"
          style={{
            borderColor: "rgba(201,168,76,0.4)",
            color: "var(--game-accent)",
          }}
        >
          📚 Explore Books
        </Link>
      </motion.div>
    </motion.div>
  );
}
