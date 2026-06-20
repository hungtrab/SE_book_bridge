import Link from "next/link";

import { BulletinImportButton } from "@/components/admin/BulletinImportButton";
import { requireRole } from "@/server/lib/auth-context";
import { getPlatformStats } from "@/server/admin/stats";

export default async function AdminPage() {
  await requireRole("ADMIN");
  const stats = await getPlatformStats();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <Link href="/api/admin/grant-report.csv" className="rounded bg-blue-600 px-3 py-2 text-white">
          Download grant CSV
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Active users" value={stats.activeUsers} />
        <Stat label="Completed transactions" value={stats.completedTransactions} />
        <Stat label="Books circulated" value={stats.booksCirculated} />
        <Stat label="Active listings" value={stats.activeListings} />
        <Stat label="Communities" value={stats.communities} />
        <Stat label="Pending tickets" value={stats.pendingReports} />
        <Stat label="Unread notifications" value={stats.unreadNotifications} />
      </div>
      <BulletinImportButton />
      <p className="text-xs text-gray-500">Generated {stats.generatedAt.toLocaleString()}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded border p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-bold">{value}</p></div>;
}
