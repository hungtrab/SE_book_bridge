import { requireUser } from "@/server/lib/auth-context";
import { listActionsAgainstMe, listMyReports } from "@/server/moderation/service";

const ACTION_LABEL: Record<string, string> = {
  WARN: "Warning issued",
  REMOVE_LISTING: "Listing removed",
  SUSPEND_USER: "Account suspended",
  RESTORE: "Account/listing restored",
  RESOLVE_DISPUTE: "Dispute resolved",
  REJECT_DISPUTE: "Dispute rejected",
  REJECT_REPORT: "Ticket closed without action",
};

export default async function MyReportsPage() {
  const user = await requireUser();
  const [reports, actionsAgainstMe] = await Promise.all([
    listMyReports(user.id),
    listActionsAgainstMe(user.id),
  ]);

  return (
    <div className="space-y-8">
      {actionsAgainstMe.length > 0 && (
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Moderation notices</h1>
          <p className="text-sm text-gray-500">Actions a moderator has applied to your account or listings.</p>
          {actionsAgainstMe.map((action) => (
            <article key={action.id} className="rounded border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{ACTION_LABEL[action.kind] ?? action.kind}</h2>
                <span className="text-xs text-gray-500">{action.createdAt.toLocaleString()}</span>
              </div>
              {action.report && (
                <p className="mt-1 text-sm text-gray-600">
                  Reason: {action.report.reason} ({action.report.targetType.toLowerCase()})
                </p>
              )}
              <p className="mt-1 text-sm">Moderator note: {action.notes}</p>
            </article>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h1 className="text-2xl font-bold">My moderator tickets</h1>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">You have not sent any moderator tickets.</p>
        ) : reports.map((report) => (
          <article key={report.id} className="rounded border p-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{report.targetType} ticket: {report.reason}</h2>
              <span className="text-xs font-semibold text-gray-500">{report.status}</span>
            </div>
            <p className="text-sm text-gray-600">{report.details ?? "No details"}</p>
            <p className="text-xs text-gray-400">{report.createdAt.toLocaleString()}</p>
            {report.actions.length > 0 && (
              <ul className="mt-2 space-y-1 border-t pt-2">
                {report.actions.map((action) => (
                  <li key={action.id} className="text-xs text-gray-500">
                    → {ACTION_LABEL[action.kind] ?? action.kind}: {action.notes} · {action.createdAt.toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
