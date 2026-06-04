"use client";

import { useState } from "react";

export function FollowButton({ userId, initial, initialCount }: { userId: string; initial: boolean; initialCount: number }) {
  const [following, setFollowing] = useState(initial);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    const res = await fetch(following ? `/api/follow/${userId}` : "/api/follow", {
      method: following ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: following ? undefined : JSON.stringify({ userId }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not update follow");
      return;
    }
    setCount((current) => Math.max(0, current + (following ? -1 : 1)));
    setFollowing(!following);
  }

  return (
    <div className="text-right">
      <button disabled={pending} type="button" onClick={toggle} className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">
        {pending ? "Saving..." : following ? "Unfollow" : "Follow"}
      </button>
      <p className="mt-1 text-xs text-gray-500">{count} followers</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
