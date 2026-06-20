"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BulletinImportButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function importNow() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/bulletins/import", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) return setMessage(body.error ?? "Bulletin import failed");
    setMessage(`Imported ${body.created}; skipped ${body.skipped} existing bulletins.`);
    router.refresh();
  }

  return <div className="rounded border p-4">
    <h2 className="font-bold">BookBridge bulletins</h2>
    <p className="my-2 text-sm text-gray-500">Fetch current book discoveries from configured trusted sources.</p>
    <button type="button" onClick={importNow} disabled={pending} className="btn-primary px-3 py-2">{pending ? "Importing…" : "Import bulletins now"}</button>
    {message && <p className="mt-2 text-sm">{message}</p>}
  </div>;
}
