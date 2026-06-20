"use client";

import { useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import type { ParticleTheme } from "@/lib/artifacts/game-types";

const configs: Record<ParticleTheme, ISourceOptions> = {
  stars: {
    fullScreen: { enable: false },
    particles: {
      number: { value: 40 },
      color: { value: "#f5d98e" },
      opacity: { value: { min: 0.1, max: 0.8 }, animation: { enable: true, speed: 0.8, sync: false } },
      size: { value: { min: 0.5, max: 2 } },
      move: { enable: true, speed: 0.15, direction: "none" },
    },
    detectRetina: true,
  },
  sand: {
    fullScreen: { enable: false },
    particles: {
      number: { value: 30 },
      color: { value: "#c9a84c" },
      opacity: { value: { min: 0.05, max: 0.25 } },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 1.5, direction: "right", straight: true },
    },
    detectRetina: true,
  },
  embers: {
    fullScreen: { enable: false },
    particles: {
      number: { value: 15 },
      color: { value: ["#dc2626", "#f97316", "#eab308"] },
      opacity: { value: { min: 0.2, max: 0.7 }, animation: { enable: true, speed: 1.5, sync: false } },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 0.8, direction: "top" },
    },
    detectRetina: true,
  },
  gold: {
    fullScreen: { enable: false },
    particles: {
      number: { value: 50 },
      color: { value: ["#f5d98e", "#c9a84c", "#ffffff"] },
      opacity: { value: { min: 0.1, max: 0.9 }, animation: { enable: true, speed: 1, sync: false } },
      size: { value: { min: 0.5, max: 2.5 } },
      move: { enable: true, speed: 0.4, direction: "none", outModes: { default: "bounce" } },
    },
    detectRetina: true,
  },
};

function ParticlesInner({ theme }: { theme: ParticleTheme }) {
  const options = useMemo(() => configs[theme], [theme]);
  return (
    <Particles
      id={`particles-${theme}`}
      className="pointer-events-none absolute inset-0 z-0"
      options={options}
    />
  );
}

export function DesertParticles({ theme }: { theme: ParticleTheme }) {
  return (
    <ParticlesProvider init={loadSlim}>
      <ParticlesInner theme={theme} />
    </ParticlesProvider>
  );
}
