"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { GameAction, GameState, Hotspot } from "@/lib/artifacts/game-types";
import { INITIAL_NODE_ID, STORY_NODES } from "@/lib/artifacts/alchemist-story";
import { GameNarration } from "./GameNarration";
import { GameOverScreen } from "./GameOverScreen";
import { VictoryScreen } from "./VictoryScreen";
import { HealthBar } from "./HealthBar";
import { PanoramaViewer } from "./PanoramaViewer";
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
      return {
        currentNodeId: action.nextNodeId,
        health: newHealth,
        status: targetNode?.isVictory ? "victory" : "playing",
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

export function AlchemistGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [typingDone, setTypingDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [flavorText, setFlavorText] = useState<string | null>(null);
  const [narrationOpen, setNarrationOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const node = STORY_NODES[state.currentNodeId];

  const handleNarrationComplete = useCallback(() => setTypingDone(true), []);

  function handleHotspot(hotspot: Hotspot) {
    if (transitioning || hotspot.kind === "inspect") return;

    setTransitioning(true);
    setTypingDone(false);

    if (hotspot.flavorText) {
      setFlavorText(hotspot.flavorText);
    }

    setTimeout(() => {
      setFlavorText(null);
      if (hotspot.effect?.statusOverride === "game_over" || hotspot.nextNodeId === null) {
        dispatch({ type: "GAME_OVER", flavorText: hotspot.flavorText ?? "You have fallen." });
      } else if (hotspot.nextNodeId) {
        dispatch({
          type: "CHOOSE",
          choiceId: hotspot.id,
          nextNodeId: hotspot.nextNodeId,
          effect: hotspot.effect,
          flavorText: hotspot.flavorText,
        });
      }
      setNarrationOpen(true);
      setTransitioning(false);
    }, hotspot.flavorText ? 2500 : 600);
  }

  function handleRestart() {
    setTypingDone(false);
    setTransitioning(false);
    setFlavorText(null);
    setNarrationOpen(true);
    dispatch({ type: "RESTART" });
  }

  function toggleFullscreen() {
    if (!gameRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      gameRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  }

  return (
    <div
      ref={gameRef}
      className="game-container relative overflow-hidden rounded-2xl"
      style={{
        "--game-bg": "#0a0a0f",
        "--game-text": "#e2e0d8",
        "--game-accent": "#c9a84c",
        "--game-muted": "#6b6860",
        height: isFullscreen ? "100vh" : "calc(100vh - 6rem)",
        background: "#0a0a0f",
      } as React.CSSProperties}
    >
      {/* Panorama scene */}
      <AnimatePresence mode="wait">
        {state.status === "playing" && node && !flavorText && (
          <motion.div
            key={node.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DesertParticles theme={node.particleTheme} />
            <PanoramaViewer
              backgroundGradient={node.backgroundGradient}
              backgroundImage={node.backgroundImage}
              sceneWidth={node.sceneWidth}
              hotspots={node.hotspots}
              disabled={!typingDone || transitioning}
              onHotspotClick={handleHotspot}
            />
          </motion.div>
        )}

        {flavorText && (
          <motion.div
            key="flavor"
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="max-w-lg text-center font-serif text-lg italic leading-relaxed sm:text-xl"
              style={{ color: "var(--game-muted)" }}>
              {flavorText}
            </p>
          </motion.div>
        )}

        {state.status === "game_over" && !flavorText && (
          <motion.div
            key="game-over"
            className="absolute inset-0 z-30 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GameOverScreen flavorText={state.lastFlavorText} onRestart={handleRestart} />
          </motion.div>
        )}

        {state.status === "victory" && node && !flavorText && (
          <motion.div
            key="victory"
            className="absolute inset-0 z-30 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "radial-gradient(ellipse at 50% 30%, #1a1408 0%, #0a0a0f 70%)" }}
          >
            <DesertParticles theme="gold" />
            <div className="relative z-10">
              <VictoryScreen
                narration={node.narration}
                health={state.health}
                maxHealth={MAX_HEALTH}
                onRestart={handleRestart}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar — ambiance + health + fullscreen */}
      {state.status === "playing" && node && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3 sm:px-6">
          <div className="font-mono text-xs tracking-wider" style={{ color: "var(--game-accent)" }}>
            📜 {node.ambiance}
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <HealthBar health={state.health} maxHealth={MAX_HEALTH} />
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg bg-black/40 px-2 py-1 text-xs text-white/50 backdrop-blur transition-colors hover:text-white/80"
            >
              {isFullscreen ? "⊡" : "⛶"}
            </button>
          </div>
        </div>
      )}

      {/* Narration panel — collapsible overlay at bottom */}
      {state.status === "playing" && node && !flavorText && (
        <div className="absolute inset-x-0 bottom-0 z-20">
          <button
            type="button"
            onClick={() => setNarrationOpen(!narrationOpen)}
            className="mx-auto mb-1 flex items-center gap-1 rounded-t-lg bg-black/60 px-4 py-1 text-[11px] text-white/50 backdrop-blur transition-colors hover:text-white/80"
          >
            {narrationOpen ? "▼ Hide story" : "▲ Show story"}
          </button>
          <AnimatePresence>
            {narrationOpen && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="max-h-[40vh] overflow-y-auto border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md sm:px-8"
              >
                <GameNarration
                  key={node.id}
                  text={node.narration}
                  ambiance=""
                  onComplete={handleNarrationComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
