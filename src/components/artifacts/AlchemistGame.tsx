"use client";

import { useCallback, useReducer, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { GameAction, GameState, StoryChoice } from "@/lib/artifacts/game-types";
import { INITIAL_NODE_ID, STORY_NODES } from "@/lib/artifacts/alchemist-story";
import { GameNarration } from "./GameNarration";
import { GameChoices } from "./GameChoices";
import { GameOverScreen } from "./GameOverScreen";
import { VictoryScreen } from "./VictoryScreen";
import { HealthBar } from "./HealthBar";
import { SceneIllustration } from "./SceneIllustration";
import { DesertParticles } from "./DesertParticles";

const MAX_HEALTH = 100;

const INITIAL_STATE: GameState = {
  currentNodeId: INITIAL_NODE_ID,
  health: MAX_HEALTH,
  status: "playing",
  choiceHistory: [],
  lastFlavorText: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CHOOSE": {
      const newHealth = Math.max(0, state.health + (action.effect?.healthDelta ?? 0));
      const targetNode = STORY_NODES[action.nextNodeId];
      const status = targetNode?.isVictory ? "victory" : "playing";
      return {
        currentNodeId: action.nextNodeId,
        health: newHealth,
        status,
        choiceHistory: [...state.choiceHistory, action.choiceId],
        lastFlavorText: action.flavorText ?? null,
      };
    }
    case "GAME_OVER":
      return { ...state, status: "game_over", lastFlavorText: action.flavorText };
    case "RESTART":
      return INITIAL_STATE;
  }
}

const backgrounds: Record<string, string> = {
  "node-1-pyramids": "radial-gradient(ellipse at 50% 20%, #0c1445 0%, #0a0a0f 70%)",
  "node-2-robbers": "radial-gradient(ellipse at 50% 80%, #1a1208 0%, #0a0a0f 70%)",
  "node-3-truth": "radial-gradient(ellipse at 50% 50%, #1a0505 0%, #0a0a0f 70%)",
  "node-4-revelation": "radial-gradient(ellipse at 50% 30%, #0c1445 0%, #0a0a0f 70%)",
  "node-5-victory": "radial-gradient(ellipse at 50% 40%, #1a1408 0%, #0a0a0f 70%)",
};

export function AlchemistGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [typingDone, setTypingDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [flavorText, setFlavorText] = useState<string | null>(null);

  const node = STORY_NODES[state.currentNodeId];

  const handleNarrationComplete = useCallback(() => setTypingDone(true), []);

  function handleChoose(choice: StoryChoice) {
    if (transitioning) return;
    setTransitioning(true);
    setTypingDone(false);

    if (choice.flavorText) {
      setFlavorText(choice.flavorText);
    }

    setTimeout(() => {
      setFlavorText(null);
      if (choice.effect?.statusOverride === "game_over" || choice.nextNodeId === null) {
        dispatch({ type: "GAME_OVER", flavorText: choice.flavorText ?? "You have fallen." });
      } else {
        dispatch({
          type: "CHOOSE",
          choiceId: choice.id,
          nextNodeId: choice.nextNodeId,
          effect: choice.effect,
          flavorText: choice.flavorText,
        });
      }
      setTransitioning(false);
    }, choice.flavorText ? 2500 : 600);
  }

  function handleRestart() {
    setTypingDone(false);
    setTransitioning(false);
    setFlavorText(null);
    dispatch({ type: "RESTART" });
  }

  return (
    <div
      className="game-container relative min-h-[calc(100vh-4rem)] overflow-hidden rounded-2xl"
      style={{
        "--game-bg": "#0a0a0f",
        "--game-text": "#e2e0d8",
        "--game-accent": "#c9a84c",
        "--game-muted": "#6b6860",
        background: backgrounds[state.currentNodeId] ?? backgrounds["node-1-pyramids"],
        transition: "background 1s ease",
      } as React.CSSProperties}
    >
      <DesertParticles theme={node?.particleTheme ?? "stars"} />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="font-mono text-xs tracking-wider"
            style={{ color: "var(--game-accent)" }}>
            📜 The Alchemist Quest
          </div>
          <HealthBar health={state.health} maxHealth={MAX_HEALTH} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            {flavorText && (
              <motion.div
                key="flavor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[40vh] items-center justify-center"
              >
                <p className="mx-auto max-w-md text-center font-serif text-lg italic leading-relaxed"
                  style={{ color: "var(--game-muted)" }}>
                  {flavorText}
                </p>
              </motion.div>
            )}

            {!flavorText && state.status === "playing" && node && (
              <motion.div
                key={node.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SceneIllustration nodeId={node.id} />
                <GameNarration
                  text={node.narration}
                  ambiance={node.ambiance}
                  onComplete={handleNarrationComplete}
                />
                <GameChoices
                  choices={node.choices}
                  disabled={!typingDone || transitioning}
                  onChoose={handleChoose}
                />
              </motion.div>
            )}

            {!flavorText && state.status === "game_over" && (
              <motion.div
                key="game-over"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GameOverScreen
                  flavorText={state.lastFlavorText}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}

            {!flavorText && state.status === "victory" && node && (
              <motion.div
                key="victory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VictoryScreen
                  narration={node.narration}
                  health={state.health}
                  maxHealth={MAX_HEALTH}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center font-mono text-[10px] tracking-wider"
          style={{ color: "var(--game-muted)", opacity: 0.5 }}>
          BookBridge Interactive Artifact · Based on &quot;The Alchemist&quot; by Paulo Coelho
        </div>
      </div>
    </div>
  );
}
