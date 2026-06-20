"use client";

import { motion } from "framer-motion";
import type { StoryChoice } from "@/lib/artifacts/game-types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

export function GameChoices({
  choices,
  disabled,
  onChoose,
}: {
  choices: StoryChoice[];
  disabled: boolean;
  onChoose: (choice: StoryChoice) => void;
}) {
  if (choices.length === 0) return null;

  return (
    <motion.div
      className="mt-8 space-y-3"
      variants={container}
      initial="hidden"
      animate={disabled ? "hidden" : "show"}
    >
      {choices.map((choice, i) => (
        <motion.button
          key={choice.id}
          variants={item}
          type="button"
          disabled={disabled}
          onClick={() => onChoose(choice)}
          className="group flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left text-base transition-all duration-200 disabled:pointer-events-none disabled:opacity-0 sm:text-lg"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(201,168,76,0.2)",
            color: "var(--game-text)",
          }}
          whileHover={{
            borderColor: "rgba(201,168,76,0.6)",
            background: "rgba(201,168,76,0.08)",
            scale: 1.01,
          }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
            style={{ background: "rgba(201,168,76,0.12)" }}>
            {choice.emoji}
          </span>
          <span className="flex-1">
            <span className="font-mono text-xs tracking-wider"
              style={{ color: "var(--game-muted)" }}>
              [{i + 1}]
            </span>{" "}
            {choice.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
