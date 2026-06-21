"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ArtifactAudio } from "@/lib/artifacts/game-types";

export function AudioPlayer({
  audio,
  currentNodeId,
  gameStatus,
}: {
  audio?: ArtifactAudio;
  currentNodeId: string;
  gameStatus: string;
}) {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const narRef = useRef<HTMLAudioElement | null>(null);
  const charRef = useRef<HTMLAudioElement | null>(null);
  const charTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [muted, setMuted] = useState(false);
  const [bgmReady, setBgmReady] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  const startAudio = useCallback(() => {
    setShowPrompt(false);
    if (bgmRef.current) {
      bgmRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!audio?.bgm) return;
    const el = new Audio(audio.bgm);
    el.loop = true;
    el.volume = audio.bgmVolume ?? 0.15;
    bgmRef.current = el;
    el.addEventListener("canplaythrough", () => setBgmReady(true), { once: true });
    return () => { el.pause(); el.src = ""; };
  }, [audio?.bgm, audio?.bgmVolume]);

  useEffect(() => {
    if (bgmRef.current) bgmRef.current.muted = muted;
    if (narRef.current) narRef.current.muted = muted;
    if (charRef.current) charRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!audio || showPrompt) return;
    const scene = audio.scenes[currentNodeId];
    if (!scene) return;

    if (narRef.current) { narRef.current.pause(); narRef.current.src = ""; }
    if (charRef.current) { charRef.current.pause(); charRef.current.src = ""; }
    if (charTimerRef.current) clearTimeout(charTimerRef.current);

    if (scene.narrator) {
      const el = new Audio(scene.narrator);
      el.volume = 0.8;
      el.muted = muted;
      narRef.current = el;
      el.play().catch(() => {});
    }

    if (scene.character) {
      charTimerRef.current = setTimeout(() => {
        const el = new Audio(scene.character!);
        el.volume = 0.9;
        el.muted = muted;
        charRef.current = el;
        el.play().catch(() => {});
      }, scene.characterDelay ?? 2000);
    }

    return () => {
      if (charTimerRef.current) clearTimeout(charTimerRef.current);
    };
  }, [audio, currentNodeId, showPrompt, muted]);

  useEffect(() => {
    if (gameStatus === "game_over") {
      if (bgmRef.current) {
        const el = bgmRef.current;
        let vol = el.volume;
        const fade = setInterval(() => {
          vol = Math.max(0, vol - 0.02);
          el.volume = vol;
          if (vol <= 0) { clearInterval(fade); el.pause(); }
        }, 50);
      }
    }
  }, [gameStatus]);

  if (!audio) return null;

  return (
    <>
      <AnimatePresence>
        {showPrompt && bgmReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.button
              type="button"
              onClick={startAudio}
              className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-8 py-6 backdrop-blur transition-colors hover:border-white/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-4xl">🔊</span>
              <span className="font-mono text-sm tracking-wider text-white/70">
                Click to enable audio
              </span>
              <span className="text-[10px] text-white/30">
                Background music + narrator voice
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {!showPrompt && (
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="pointer-events-auto rounded-lg bg-black/40 px-2 py-1 text-xs text-white/50 backdrop-blur transition-colors hover:text-white/80"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}
    </>
  );
}
