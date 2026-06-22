"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { VictoryEffect } from "@/lib/artifacts/game-types";

export function VictoryScreen({
  narration,
  health,
  maxHealth,
  onRestart,
  victoryEffect,
  listingSearchTitle,
}: {
  narration: string;
  health: number;
  maxHealth: number;
  onRestart: () => void;
  victoryEffect?: VictoryEffect;
  listingSearchTitle?: string;
}) {
  const listingSearchHref = listingSearchTitle
    ? `/listings?${new URLSearchParams({ q: listingSearchTitle }).toString()}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      {victoryEffect === "lamp-dim" && <LampDimEffect />}

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7, type: "spring" }}
      >
        <p className="mb-2 text-4xl">{victoryEffect === "lamp-dim" ? "🪔" : "✨"}</p>
        <h1
          className="victory-glow text-3xl font-black tracking-wider sm:text-5xl"
          style={{
            background: `linear-gradient(135deg, var(--game-accent), #f5d98e, var(--game-accent))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          QUEST COMPLETE
        </h1>
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
          style={{ borderColor: "rgba(201,168,76,0.4)", color: "var(--game-accent)" }}
        >
          🔄 Play Again
        </button>
        <Link
          href="/artifacts"
          className="rounded-xl border px-6 py-3 font-mono text-sm font-bold tracking-wider uppercase transition-colors"
          style={{ borderColor: "rgba(201,168,76,0.4)", color: "var(--game-accent)" }}
        >
          📚 More Artifacts
        </Link>
        {listingSearchHref && (
          <Link
            href={listingSearchHref}
            aria-label={`See ${listingSearchTitle} on listing`}
            title={`Search listings for ${listingSearchTitle}`}
            className="rounded-xl border px-6 py-3 font-mono text-sm font-bold tracking-wider uppercase transition-colors"
            style={{ borderColor: "rgba(201,168,76,0.4)", color: "var(--game-accent)" }}
          >
            See this book on listing
          </Link>
        )}
      </motion.div>
    </motion.div>
  );
}

function LampDimEffect() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
      {/* Oil lamp glow that dims over time */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(255,170,50,0.25) 0%, rgba(255,120,20,0.08) 40%, transparent 70%)",
        }}
        initial={{ scale: 1.5, opacity: 1 }}
        animate={{ scale: 0.3, opacity: 0 }}
        transition={{ duration: 8, delay: 2, ease: "easeInOut" }}
      />
      {/* Flickering warm light */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "100px",
          height: "100px",
          background: "radial-gradient(circle, rgba(255,200,80,0.4) 0%, transparent 70%)",
        }}
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{
          scale: [1, 1.1, 0.9, 1.05, 0.5, 0.2, 0],
          opacity: [0.8, 0.9, 0.7, 0.6, 0.3, 0.1, 0],
        }}
        transition={{ duration: 10, delay: 1, ease: "easeInOut" }}
      />
      {/* Final darkness vignette */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 80%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 6, delay: 4 }}
      />
    </div>
  );
}
