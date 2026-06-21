"use client";

import { useMemo } from "react";
import type { ParticleTheme } from "@/lib/artifacts/game-types";

const THEME_CONFIG: Record<ParticleTheme, { count: number; colors: string[]; speed: string; direction: string; sizeRange: [number, number] }> = {
  stars: { count: 35, colors: ["#f5d98e", "#ffffff", "#c9a84c"], speed: "8s", direction: "none", sizeRange: [1, 3] },
  sand: { count: 20, colors: ["#c9a84c", "#a08030"], speed: "4s", direction: "right", sizeRange: [1, 4] },
  embers: { count: 12, colors: ["#dc2626", "#f97316", "#eab308"], speed: "5s", direction: "up", sizeRange: [1, 3] },
  gold: { count: 40, colors: ["#f5d98e", "#c9a84c", "#ffffff"], speed: "6s", direction: "none", sizeRange: [1, 4] },
};

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function DesertParticles({ theme }: { theme: ParticleTheme }) {
  const config = THEME_CONFIG[theme];

  const particles = useMemo(() =>
    Array.from({ length: config.count }, (_, i) => {
      const r1 = seededRandom(i * 7 + 1);
      const r2 = seededRandom(i * 13 + 3);
      const r3 = seededRandom(i * 17 + 5);
      const r4 = seededRandom(i * 23 + 7);
      const r5 = seededRandom(i * 31 + 11);
      return {
        id: i,
        x: r1 * 100,
        y: r2 * 100,
        size: config.sizeRange[0] + r3 * (config.sizeRange[1] - config.sizeRange[0]),
        color: config.colors[Math.floor(r4 * config.colors.length)],
        delay: r5 * 5,
        duration: 3 + r5 * 5,
      };
    }), [config]);

  const animName = `particle-${config.direction}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0,
            animation: `${animName} ${p.duration}s ${p.delay}s ease-in-out infinite, particle-twinkle ${2 + p.delay * 0.5}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
