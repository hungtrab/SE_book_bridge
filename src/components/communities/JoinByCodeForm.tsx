"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinByCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/communities/join-by-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    setPending(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Invalid code");
      return;
    }
    router.push(`/communities/${body.communityId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card-surface space-y-3 rounded-2xl p-4">
      <h2 className="font-semibold">Join by invite code</h2>
      <div className="flex gap-2">
        <input
          required
          className="field flex-1 font-mono uppercase tracking-widest"
          placeholder="XXXXXXXX"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button disabled={pending} className="btn-primary">
          {pending ? "Joining..." : "Join"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
