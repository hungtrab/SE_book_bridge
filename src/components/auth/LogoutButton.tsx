"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ className = "link-soft" }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className={`${className} disabled:opacity-50`}
    >
      <LogOut size={19} />
      <span>{pending ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
