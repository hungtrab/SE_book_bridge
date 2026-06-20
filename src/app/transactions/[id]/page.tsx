import Link from "next/link";

import { ChatThread } from "@/components/messaging/ChatThread";
import { ReportButton } from "@/components/moderation/ReportButton";
import { TransactionActions } from "@/components/transactions/TransactionActions";
import { humanizeEnum, transactionStatusLabel } from "@/lib/labels";
import { requireUser } from "@/server/lib/auth-context";
import { getTransaction } from "@/server/transactions/service";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const txn = await getTransaction(user, id);

  return (
    <div className="space-y-6">
      <section className="card-surface rounded-2xl p-5">
        <h1 className="text-2xl font-bold">{txn.listing.title}</h1>
        <p className="mt-1">Status: <strong>{transactionStatusLabel(txn.status)}</strong> · {humanizeEnum(txn.type)}</p>
        <p className="text-sm">Owner: {txn.owner.displayName} · Requester: {txn.requester.displayName}</p>
        {txn.deliveryMethod && <p className="text-sm">Delivery: {humanizeEnum(txn.deliveryMethod)}{txn.trackingNumber ? ` · tracking ${txn.trackingNumber}` : ""}</p>}
        <div className="mt-3"><ReportButton targetType="TRANSACTION" targetId={txn.id} /></div>
      </section>

      <TransactionActions id={txn.id} status={txn.status} isOwner={txn.ownerId === user.id} isRequester={txn.requesterId === user.id} />

      <section>
        <h2 className="mb-2 text-xl font-semibold">Progress timeline</h2>
        <ol className="space-y-2">
          {txn.events.map((event) => (
            <li key={event.id} className="rounded-xl border p-3">
              <strong>{event.fromStatus ? transactionStatusLabel(event.fromStatus) : "Created"} → {transactionStatusLabel(event.toStatus)}</strong>
              <p className="text-sm text-gray-500">{event.createdAt.toLocaleString()} {event.reason ? `· ${humanizeEnum(event.reason)}` : ""}</p>
            </li>
          ))}
        </ol>
      </section>

      {txn.conversation && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chat</h2>
            <Link href={`/messages/${txn.conversation.id}`} className="text-sm underline">Open full screen</Link>
          </div>
          <ChatThread conversationId={txn.conversation.id} currentUserId={user.id} />
        </section>
      )}

      {txn.ratings.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold">Ratings</h2>
          {txn.ratings.map((rating) => <p key={rating.id}>{rating.stars}/5 · {rating.comment ?? "No comment"}</p>)}
        </section>
      )}
    </div>
  );
}
