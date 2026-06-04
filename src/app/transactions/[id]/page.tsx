import Link from "next/link";
import { ChatThread } from "@/components/messaging/ChatThread";
import { ReportButton } from "@/components/moderation/ReportButton";
import { TransactionActions } from "@/components/transactions/TransactionActions";
import { requireUser } from "@/server/lib/auth-context";
import { getTransaction } from "@/server/transactions/service";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params; const txn = await getTransaction(user, id);
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Transaction: {txn.listing.title}</h1><p>Status: <strong>{txn.status}</strong> · {txn.type}</p><p className="text-sm">Owner: {txn.owner.displayName} · Requester: {txn.requester.displayName}</p>{txn.deliveryMethod && <p className="text-sm">Delivery: {txn.deliveryMethod}{txn.trackingNumber ? ` · tracking ${txn.trackingNumber}` : ""}</p>}<ReportButton targetType="TRANSACTION" targetId={txn.id} /></div><TransactionActions id={txn.id} status={txn.status} isOwner={txn.ownerId === user.id} isRequester={txn.requesterId === user.id}/><section><h2 className="mb-2 text-xl font-semibold">Audit timeline</h2><ol className="space-y-2">{txn.events.map(event => <li key={event.id} className="rounded border p-2"><strong>{event.fromStatus ?? "CREATED"} → {event.toStatus}</strong><p className="text-sm text-gray-500">{event.createdAt.toLocaleString()} {event.reason ? `· ${event.reason}` : ""}</p></li>)}</ol></section>{txn.conversation && <section className="space-y-2"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Chat</h2><Link href={`/messages/${txn.conversation.id}`} className="text-sm underline">Open full screen</Link></div><ChatThread conversationId={txn.conversation.id} currentUserId={user.id}/></section>}{txn.ratings.length > 0 && <section><h2 className="text-xl font-semibold">Ratings</h2>{txn.ratings.map(rating => <p key={rating.id}>{rating.stars}/5 · {rating.comment ?? "No comment"}</p>)}</section>}</div>;
}
