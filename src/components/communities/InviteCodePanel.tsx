"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteCodePanel({ communityId, inviteCode }: { communityId: string; inviteCode: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function regenerate() {
    setPending(true);
    await fetch(`/api/communities/${communityId}/invite-code`, { method: "POST" });
    setPending(false);
    router.refresh();
  }

  function copy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded border bg-gray-50 p-3">
      <span className="text-sm text-gray-600">Invite code:</span>
      <code className="flex-1 rounded bg-white px-2 py-1 font-mono text-sm font-bold tracking-widest">{inviteCode}</code>
      <button type="button" onClick={copy} className="rounded border px-2 py-1 text-xs">
        {copied ? "Copied!" : "Copy"}
      </button>
      <button type="button" onClick={regenerate} disabled={pending} className="rounded border px-2 py-1 text-xs disabled:opacity-50">
        {pending ? "..." : "Regenerate"}
      </button>
    </div>
  );
}
