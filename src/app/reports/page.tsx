import { requireUser } from "@/server/lib/auth-context";
import { listMyReports } from "@/server/moderation/service";

export default async function MyReportsPage() {
  const user = await requireUser();
  const reports = await listMyReports(user.id);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My moderator tickets</h1>
      {reports.length === 0 ? <p>You have not sent any moderator tickets.</p> : reports.map((report) => (
        <article key={report.id} className="rounded border p-3">
          <h2 className="font-semibold">{report.targetType} ticket: {report.reason}</h2>
          <p className="text-sm">{report.details ?? "No details"}</p>
          <p className="text-xs text-gray-500">{report.status} · {report.createdAt.toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
