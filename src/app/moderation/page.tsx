import Link from "next/link";

import { ModerationActionForm } from "@/components/moderation/ModerationActionForm";
import { requireUser } from "@/server/lib/auth-context";
import { listModerationQueue } from "@/server/moderation/queue";

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const raw = (await searchParams).status;
  const status = raw === "RESOLVED" || raw === "REJECTED" ? raw : "PENDING";
  const reports = await listModerationQueue(user, status);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Moderator ticket queue</h1>
      <nav className="flex gap-3 text-sm">
        {["PENDING", "RESOLVED", "REJECTED"].map((value) => <Link key={value} href={`/moderation?status=${value}`} className="underline">{value}</Link>)}
      </nav>
      {reports.length === 0 ? <p>No tickets in this queue.</p> : reports.map((report) => (
        <article key={report.id} className="rounded border p-4">
          <div className="flex justify-between gap-3">
            <div>
              <h2 className="font-semibold">{report.targetType} ticket: {report.reason}</h2>
              <p className="text-sm">{report.details ?? "No details"}</p>
              <p className="text-xs text-gray-500">
                Sent by {report.isSystemGenerated ? "anti-gaming scan" : report.filer?.displayName ?? "unknown"} · {report.createdAt.toLocaleString()}
              </p>
            </div>
            <span className="text-sm font-semibold">{report.status}</span>
          </div>
          <p className="mt-2 text-sm">
            Target: {report.targetUser?.displayName ?? report.targetListing?.title ?? report.targetTransaction?.id ?? report.targetMessage?.body ?? "unknown"}
          </p>
          {report.status === "PENDING" && <ModerationActionForm reportId={report.id} targetType={report.targetType} />}
          {report.actions.map((action) => (
            <p key={action.id} className="mt-2 text-xs text-gray-500">{action.kind} by {action.byUser.displayName}: {action.notes}</p>
          ))}
        </article>
      ))}
    </div>
  );
}
