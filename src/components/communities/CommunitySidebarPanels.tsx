"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListingDeleteButton } from "./ListingDeleteButton";
import { MemberActions } from "./MemberActions";

type Listing = { id: string; ownerId: string; title: string; author: string; photos: Array<{ url: string }> };
type Member = { userId: string; role: "MEMBER" | "MODERATOR"; user: { displayName: string; avatarUrl: string | null } };

export function CommunitySidebarPanels({ communityId, ownerId, currentUserId, isMember, isMod, listings, members }: {
  communityId: string; ownerId: string; currentUserId?: string; isMember: boolean; isMod: boolean; listings: Listing[]; members: Member[];
}) {
  const [bookQuery, setBookQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const visibleBooks = useMemo(() => listings.filter((item) => `${item.title} ${item.author}`.toLowerCase().includes(bookQuery.toLowerCase())), [listings, bookQuery]);
  const visibleMembers = useMemo(() => members.filter((item) => item.user.displayName.toLowerCase().includes(memberQuery.toLowerCase())), [members, memberQuery]);
  return <div className="space-y-4">
    <details className="community-card group" open>
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-bold"><span>Books in this group ({listings.length})</span><span className="transition group-open:rotate-180">⌄</span></summary>
      <div className="border-t p-4 pt-3">
        <div className="flex gap-2"><input value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} className="field" placeholder="Search books..." />{isMember && <Link href={`/listings/new?communityId=${communityId}`} className="btn-primary btn-sm">Add</Link>}</div>
        <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
          {visibleBooks.map((listing) => <div key={listing.id} className="relative flex gap-2 rounded-xl p-1 hover:bg-gray-50">
            {listing.photos[0] ? <img src={listing.photos[0].url} alt={listing.title} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-gray-100" />}
            <Link href={`/listings/${listing.id}`} className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{listing.title}</p><p className="truncate text-xs text-gray-500">{listing.author}</p></Link>
            {(isMod || listing.ownerId === currentUserId) && <ListingDeleteButton listingId={listing.id} communityId={communityId} />}
          </div>)}
          {visibleBooks.length === 0 && <p className="py-4 text-center text-sm text-gray-500">No matching books.</p>}
        </div>
      </div>
    </details>

    <details className="community-card group">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-bold"><span>Members ({members.length})</span><span className="transition group-open:rotate-180">⌄</span></summary>
      <div className="border-t p-4 pt-3">
        <input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} className="field" placeholder="Search members..." />
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {visibleMembers.map((member) => {
            const status = member.userId === ownerId ? "Owner" : member.role === "MODERATOR" ? "Moderator" : "Member";
            return <div key={member.userId} className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50">
              {member.user.avatarUrl ? <img src={member.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="community-avatar">{member.user.displayName.charAt(0).toUpperCase()}</span>}
              <Link href={`/profile/${member.userId}`} className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{member.user.displayName}</p><p className="text-xs text-gray-500">{status}</p></Link>
              {isMod && member.userId !== ownerId && member.userId !== currentUserId && <MemberActions communityId={communityId} userId={member.userId} currentRole={member.role} />}
            </div>;
          })}
        </div>
      </div>
    </details>
  </div>;
}
