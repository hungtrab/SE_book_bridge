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
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 });
  const [inspectText, setInspectText] = useState<string | null>(null);
  const [inspectLabel, setInspectLabel] = useState<string | null>(null);

  const sceneHeight = 180;
  const maxOffsetX = sceneWidth - 100;
  const maxOffsetY = sceneHeight - 100;

  const clampX = useCallback((val: number) => Math.max(-maxOffsetX, Math.min(0, val)), [maxOffsetX]);
  const clampY = useCallback((val: number) => Math.max(-maxOffsetY, Math.min(0, val)), [maxOffsetY]);

  useEffect(() => {
    setOffsetX(clampX(-maxOffsetX / 2));
    setOffsetY(clampY(-maxOffsetY / 2));
  }, [sceneWidth, clampX, clampY, maxOffsetX, maxOffsetY]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, startOffsetX: offsetX, startOffsetY: offsetY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [disabled, offsetX, offsetY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffsetX(clampX(dragStartRef.current.startOffsetX + dx * 0.5));
    setOffsetY(clampY(dragStartRef.current.startOffsetY + dy * 0.5));
  }, [isDragging, clampX, clampY]);

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
      {/* Panorama background — wider AND taller than viewport */}
      <div
        className="absolute transition-transform duration-75"
        style={{
          width: `${sceneWidth}vw`,
          height: `${sceneHeight}vh`,
          transform: `translate(${offsetX}vw, ${offsetY}vh)`,
          background: backgroundImage
            ? `url(${backgroundImage}) center/cover no-repeat`
            : backgroundGradient,
        }}
      />

      {/* Hotspots — fixed to viewport */}
      {hotspots.map((hotspot) => (
        <motion.button
          key={hotspot.id}
          type="button"
          className="group absolute z-20 flex flex-col items-center"
          style={{
            left: `${hotspot.x}%`,
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
          <span className={`flex items-center justify-center rounded-full text-2xl shadow-lg transition-all ${
            hotspot.kind === "action"
              ? "hotspot-action h-14 w-14 bg-black/60 ring-2 ring-[#c9a84c]/80 sm:h-16 sm:w-16"
              : "hotspot-inspect h-10 w-10 bg-black/40 ring-1 ring-white/30 text-lg sm:h-12 sm:w-12"
          }`}>
            {hotspot.emoji}
          </span>
          <span className={`mt-1.5 rounded-lg px-2 py-1 text-center text-[11px] font-medium leading-tight backdrop-blur transition-opacity group-hover:opacity-100 ${
            hotspot.kind === "action"
              ? "max-w-[160px] bg-[#c9a84c]/20 text-[#f5d98e] opacity-80 ring-1 ring-[#c9a84c]/30 sm:max-w-[200px]"
              : "max-w-[140px] bg-black/70 text-white/70 opacity-0 sm:max-w-[180px]"
          }`}>
            {hotspot.kind === "action" ? "▶ " : "🔍 "}{hotspot.label}
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
                {inspectLabel}
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
          Drag to look around
        </p>
      </div>
    </div>
  );
}
