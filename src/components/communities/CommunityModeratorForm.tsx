"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommunityModeratorForm({ communityId }: { communityId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const res = await fetch(`/api/communities/${communityId}/moderators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setMessage(body.error ?? "Could not grant moderator access");
      return;
    }
    setMessage(`${body.displayName ?? email} is now a community moderator.`);
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 rounded border p-3 sm:flex-row">
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="User email to promote"
        className="min-w-0 flex-1 rounded border px-2 py-1"
      />
      <button disabled={pending} className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50">
        {pending ? "Granting..." : "Grant moderator"}
      </button>
      {message && <p className="text-sm sm:w-full">{message}</p>}
    </form>
  );
}
