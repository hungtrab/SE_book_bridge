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
    <div className="card-surface flex items-center gap-2 rounded-2xl p-3">
      <span className="text-sm text-gray-600">Invite code:</span>
      <code className="flex-1 rounded-lg bg-gray-50 px-2 py-1 font-mono text-sm font-bold tracking-widest text-gray-900">{inviteCode}</code>
      <button type="button" onClick={copy} className="btn-secondary btn-sm">
        {copied ? "Copied!" : "Copy"}
      </button>
      <button type="button" onClick={regenerate} disabled={pending} className="btn-ghost btn-sm">
        {pending ? "..." : "Regenerate"}
      </button>
    </div>
  );
}
