"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Hotspot } from "@/lib/artifacts/game-types";

export function PanoramaViewer({
  backgroundGradient,
  backgroundImage,
  sceneWidth,
  hotspots,
  disabled,
  onHotspotClick,
}: {
  backgroundGradient: string;
  backgroundImage?: string;
  sceneWidth: number;
  hotspots: Hotspot[];
  disabled: boolean;
  onHotspotClick: (hotspot: Hotspot) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, startOffset: 0 });
  const [inspectText, setInspectText] = useState<string | null>(null);
  const [inspectLabel, setInspectLabel] = useState<string | null>(null);

  const maxOffset = sceneWidth - 100;

  const clamp = useCallback((val: number) => Math.max(-maxOffset, Math.min(0, val)), [maxOffset]);

  useEffect(() => {
    setOffsetX(clamp(-maxOffset / 2));
  }, [sceneWidth, clamp, maxOffset]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, startOffset: offsetX };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [disabled, offsetX]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartRef.current.x;
    setOffsetX(clamp(dragStartRef.current.startOffset + delta * 0.5));
  }, [isDragging, clamp]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  function handleHotspot(hotspot: Hotspot) {
    if (disabled) return;
    if (hotspot.kind === "inspect") {
      setInspectText(hotspot.inspectText ?? null);
      setInspectLabel(hotspot.label);
    } else {
      setInspectText(null);
      onHotspotClick(hotspot);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Panorama background */}
      <div
        className="absolute inset-y-0 transition-transform duration-75"
        style={{
          width: `${sceneWidth}vw`,
          transform: `translateX(${offsetX}vw)`,
          background: backgroundImage
            ? `url(${backgroundImage}) center/cover no-repeat`
            : backgroundGradient,
        }}
      />

      {/* Hotspots */}
      {hotspots.map((hotspot) => (
        <motion.button
          key={hotspot.id}
          type="button"
          className="group absolute z-20 flex flex-col items-center"
          style={{
            left: `${hotspot.x + (offsetX / sceneWidth) * 100 + 50}%`,
            top: `${hotspot.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          onClick={(e) => { e.stopPropagation(); handleHotspot(hotspot); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={disabled}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + hotspots.indexOf(hotspot) * 0.15, type: "spring" }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg transition-all sm:h-14 sm:w-14 ${
            hotspot.kind === "action"
              ? "hotspot-action bg-black/50 ring-2 ring-[#c9a84c]/60"
              : "hotspot-inspect bg-black/40 ring-1 ring-white/20"
          }`}>
            {hotspot.emoji}
          </span>
          <span className="mt-1.5 max-w-[140px] rounded-lg bg-black/70 px-2 py-1 text-center text-[11px] font-medium leading-tight text-white/90 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 sm:max-w-[180px]">
            {hotspot.label}
          </span>
        </motion.button>
      ))}

      {/* Inspect popup */}
      <AnimatePresence>
        {inspectText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 z-30 w-[90%] max-w-md -translate-x-1/2 rounded-xl border border-white/10 bg-black/80 p-4 backdrop-blur-md sm:bottom-28"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {inspectLabel && (
              <p className="mb-2 font-mono text-xs tracking-wider" style={{ color: "#c9a84c" }}>
                🔍 {inspectLabel}
              </p>
            )}
            <p className="font-serif text-sm leading-relaxed text-white/85 sm:text-base">
              {inspectText}
            </p>
            <button
              type="button"
              onClick={() => setInspectText(null)}
              className="mt-3 text-xs text-white/40 underline transition-colors hover:text-white/70"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <p className="rounded-full bg-black/40 px-3 py-1 text-[10px] text-white/30 backdrop-blur">
          ← Drag to look around →
        </p>
      </div>
    </div>
  );
}
