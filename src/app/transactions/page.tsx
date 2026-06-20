import Link from "next/link";

import { transactionStatusLabel } from "@/lib/labels";
import { requireUser } from "@/server/lib/auth-context";
import { listMyTransactions } from "@/server/transactions/service";

const STATUSES = ["PENDING", "WAITLISTED", "ACCEPTED", "IN_DELIVERY", "COMPLETED", "CANCELLED", "DECLINED", "DISPUTED"] as const;

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const raw = (await searchParams)?.status;
  const status = STATUSES.find((value) => value === raw);
  const items = await listMyTransactions(user.id, status);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black tracking-tight">My transactions</h1>
      <nav className="flex flex-wrap gap-2">
        <Link href="/transactions" className={`rounded-xl border px-3 py-2 text-sm ${!status ? "bg-blue-600 text-white" : ""}`}>All</Link>
        {STATUSES.map((value) => (
          <Link key={value} href={`/transactions?status=${value}`} className={`rounded-xl border px-3 py-2 text-sm ${status === value ? "bg-blue-600 text-white" : ""}`}>
            {transactionStatusLabel(value)}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? <p>No transactions in this status.</p> : (
        <div className="space-y-3">
          {items.map((txn) => (
            <Link key={txn.id} href={`/transactions/${txn.id}`} className="card-surface flex gap-3 rounded-2xl p-3">
              {txn.listing.photos[0] && <img src={txn.listing.photos[0].url} alt={txn.listing.title} className="h-20 w-20 rounded-xl object-cover" />}
              <div>
                <h2 className="font-semibold">{txn.listing.title}</h2>
                <p className="text-sm">{transactionStatusLabel(txn.status)} · {txn.ownerId === user.id ? `Requester: ${txn.requester.displayName}` : `Owner: ${txn.owner.displayName}`}</p>
                <p className="text-xs text-gray-500">Updated {txn.updatedAt.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
