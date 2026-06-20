"use client";

import { motion } from "framer-motion";

const scenes: Record<string, () => React.ReactNode> = {
  "node-1-pyramids": PyramidsScene,
  "node-2-robbers": RobbersScene,
  "node-3-truth": SwordScene,
  "node-4-revelation": StarsScene,
  "node-5-victory": TreasureScene,
};

export function SceneIllustration({ nodeId }: { nodeId: string }) {
  const Scene = scenes[nodeId];
  if (!Scene) return null;
  return (
    <motion.div
      className="mx-auto mb-8 flex h-40 w-full max-w-md items-center justify-center sm:h-52"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <Scene />
    </motion.div>
  );
}

function PyramidsScene() {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1445" />
          <stop offset="100%" stopColor="#1a1a3e" />
        </linearGradient>
        <radialGradient id="moon-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f5d98e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f5d98e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="url(#sky)" />
      {[52, 120, 190, 280, 340, 95, 230, 310, 160, 370, 45, 265].map((x, i) => (
        <motion.circle
          key={i} cx={x} cy={10 + (i * 7) % 60} r={0.8 + (i % 3) * 0.4}
          fill="#f5d98e"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
        />
      ))}
      <circle cx="320" cy="40" r="30" fill="url(#moon-glow)" />
      <circle cx="320" cy="40" r="12" fill="#f5d98e" opacity="0.9" />
      <polygon points="120,160 200,60 280,160" fill="#c9a84c" opacity="0.25" stroke="#c9a84c" strokeWidth="0.5" />
      <polygon points="200,160 260,80 320,160" fill="#c9a84c" opacity="0.18" stroke="#c9a84c" strokeWidth="0.5" />
      <rect x="0" y="155" width="400" height="45" fill="#2a2215" />
      <motion.ellipse
        cx="180" cy="170" rx="3" ry="1.5" fill="#c9a84c" opacity="0.6"
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </svg>
  );
}

function RobbersScene() {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" fill="none">
      <rect width="400" height="200" fill="#0a0a0f" />
      {[80, 150, 220, 290, 340].map((x, i) => (
        <motion.g key={i}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
        >
          <ellipse cx={x} cy={120} rx={12} ry={30} fill="#1a1a2e" />
          <circle cx={x} cy={88} r={8} fill="#1a1a2e" />
          <line x1={x + 10} y1={100} x2={x + 25} y2={90} stroke="#c9a84c" strokeWidth="1" opacity="0.5" />
        </motion.g>
      ))}
      <rect x="0" y="155" width="400" height="45" fill="#2a2215" />
      <motion.circle
        cx="200" cy="170" r="20" fill="#c9a84c" opacity="0.08"
        animate={{ opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

function SwordScene() {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" fill="none">
      <rect width="400" height="200" fill="#0f0505" />
      <motion.line
        x1="120" y1="40" x2="280" y2="100"
        stroke="#c9a84c" strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.polygon
        points="280,95 300,100 280,105 275,100"
        fill="#c9a84c"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <rect x="110" y="35" width="15" height="12" rx="2" fill="#8B6914" />
      <motion.circle
        cx="290" cy="100" r="40" fill="none" stroke="#dc2626" strokeWidth="0.5" opacity="0.3"
        animate={{ r: [35, 45, 35], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="200" y="170" textAnchor="middle" fill="#dc2626" opacity="0.15" fontSize="12" fontFamily="monospace">
        ☠ DANGER ☠
      </text>
    </svg>
  );
}

function StarsScene() {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" fill="none">
      <rect width="400" height="200" fill="#060618" />
      {Array.from({ length: 30 }, (_, i) => (
        <motion.circle
          key={i}
          cx={20 + (i * 43) % 370}
          cy={10 + (i * 17) % 140}
          r={0.6 + (i % 4) * 0.5}
          fill="#f5d98e"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5 + (i % 5) * 0.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      <motion.text
        x="200" y="115" textAnchor="middle" fill="#c9a84c" opacity="0.08" fontSize="80" fontFamily="serif"
        animate={{ opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ☽
      </motion.text>
      <rect x="0" y="170" width="400" height="30" fill="#1a1208" />
    </svg>
  );
}

function TreasureScene() {
  return (
    <svg viewBox="0 0 400 200" className="h-full w-full" fill="none">
      <defs>
        <radialGradient id="gold-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f5d98e" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#c9a84c" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="200" fill="#0a0a0f" />
      <motion.circle
        cx="200" cy="100" r="80" fill="url(#gold-glow)"
        animate={{ r: [70, 90, 70], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 50;
        return (
          <motion.text
            key={i}
            x={200 + Math.cos(angle) * r}
            y={100 + Math.sin(angle) * r}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="16"
            animate={{
              opacity: [0, 1, 0],
              y: [100 + Math.sin(angle) * r, 100 + Math.sin(angle) * r - 10, 100 + Math.sin(angle) * r],
            }}
            transition={{ duration: 2, delay: i * 0.25, repeat: Infinity }}
          >
            ✨
          </motion.text>
        );
      })}
      <motion.text
        x="200" y="105" textAnchor="middle" fontSize="40"
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        📖
      </motion.text>
    </svg>
  );
}
