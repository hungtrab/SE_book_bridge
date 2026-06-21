"use client";

import { motion } from "framer-motion";

export function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  if (health >= maxHealth) return null;
  const pct = Math.max(0, (health / maxHealth) * 100);
  const color = pct > 60 ? "#22c55e" : pct > 30 ? "#eab308" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <span className="text-sm">❤️</span>
      <div className="h-2 w-24 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.1)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: "100%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="font-mono text-xs" style={{ color: "var(--game-muted)" }}>
        {health}/{maxHealth}
      </span>
    </motion.div>
  );
}
