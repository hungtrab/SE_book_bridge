import Link from "next/link";

import { ReputationBadge } from "@/components/reputation/ReputationBadge";

type UserSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  reputationScore: number;
};

export function UserSummaryList({ users, emptyLabel }: { users: UserSummary[]; emptyLabel: string }) {
  if (users.length === 0) {
    return <p className="text-sm text-[color:var(--muted)]">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {users.map((user) => (
        <li key={user.id}>
          <Link href={`/profile/${user.id}`} className="card-surface interactive-card flex items-center justify-between gap-3 rounded-2xl p-3">
            <span className="font-semibold">{user.displayName}</span>
            <ReputationBadge score={user.reputationScore} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
