"use client";

import { useState } from "react";
import { BellRing, UserCheck, UserPlus } from "lucide-react";

export function FollowButton({
  userId,
  initial,
  initialCount,
  compact = false,
}: {
  userId: string;
  initial: boolean;
  initialCount: number;
  compact?: boolean;
}) {
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
    <div className={compact ? "" : "text-right"}>
      <button
        disabled={pending}
        type="button"
        onClick={toggle}
        className={following ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
      >
        {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
        {pending ? "Saving..." : following ? "Following" : "Follow seller"}
      </button>
      {!compact && <p className="mt-1 text-xs text-gray-500">{count} followers</p>}
      {following && !compact && (
        <p className="mt-1 flex items-center justify-end gap-1 text-xs font-medium text-blue-700">
          <BellRing size={13} />
          New listing alerts enabled
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
