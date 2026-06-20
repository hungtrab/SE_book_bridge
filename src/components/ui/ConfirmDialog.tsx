"use client";
import { useEffect } from "react";

export function ConfirmDialog({ open, title, message, confirmLabel = "Yes", cancelLabel = "No", dangerous = false, pending = false, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string;
  dangerous?: boolean; pending?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open, onCancel]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-md" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl">
      <h2 className="text-xl font-black">{title}</h2><p className="mt-2 leading-6 text-gray-600">{message}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" disabled={pending} onClick={onCancel} className="btn-secondary">{cancelLabel}</button>
        <button type="button" disabled={pending} onClick={onConfirm} className={dangerous ? "btn-danger" : "btn-primary"}>{pending ? "Working..." : confirmLabel}</button>
      </div>
    </div>
  </div>;
}
