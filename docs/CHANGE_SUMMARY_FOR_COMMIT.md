# Change Summary For Commit

This note summarizes the feature changes made in this working session and gives safe terminal commands for staging and pushing them.

## Features Added

### Realtime Messaging

- Improved chat updates so new messages appear without manually reloading the page.
- Added fallback polling when the Server-Sent Events connection is interrupted.
- Added SSE keep-alive heartbeat and buffering headers for message streams.

Main files:

- `src/components/messaging/ChatThread.tsx`
- `src/server/messaging/sse.ts`
- `src/app/api/conversations/[id]/stream/route.ts`

### Conversation Ordering

- Conversations with the newest message are kept at the top.
- Conversations without messages are sorted after conversations with recent messages.
- The live message panel refreshes more frequently and moves the active conversation to the top when a message is sent or received.

Main files:

- `src/components/messaging/LiveMessagePanel.tsx`
- `src/server/messaging/service.ts`

### Unread Message Highlighting

- Conversations with unread messages are visually emphasized.
- Added unread count badges in the message dropdown.
- When the current conversation is opened, unread state is cleared for that conversation.

Main file:

- `src/components/messaging/LiveMessagePanel.tsx`

### Clickable Notifications

- Notifications in the dropdown can now be clicked.
- Clicking a notification marks it as read and redirects to the related content.
- Notification links now support:
  - Messages: `/messages/:conversationId`
  - Community posts: `/communities/:communityId#post-:postId`
  - Community comments: `/communities/:communityId#comment-:commentId`
- Added anchors to community comments so comment notifications can scroll to the exact comment.
- Fixed community post notification titles to use `postTitle`.
- Added `communityId` to community post like notification payloads so like notifications can link to the post.

Main files:

- `src/components/notifications/LiveNotificationBell.tsx`
- `src/components/notifications/NotificationList.tsx`
- `src/lib/notifications/presentation.ts`
- `src/components/communities/CommentSection.tsx`
- `src/server/communities/service.ts`
- `src/server/lib/events.ts`

### Artifact Victory Listing Link

- Added a **See this book on listing** button after completing an artifact.
- The button redirects to `/listings?q=<book title>`.
- `/listings` now preserves query params while redirecting to `/search`.

Main files:

- `src/components/artifacts/VictoryScreen.tsx`
- `src/components/artifacts/ArtifactGame.tsx`
- `src/app/artifacts/the-alchemist/page.tsx`
- `src/app/artifacts/tuc-nuoc-vo-bo/page.tsx`
- `src/app/listings/page.tsx`

### Parallel Project Cleanup

- Removed `Parallel_project` from Git tracking when it had been added as an embedded repository.
- Added ignore rules so `Parallel_project/` or `parallel_project/` will not be accidentally committed again.

Main file:

- `.gitignore`

## Verification

The following checks were run successfully during the session:

```powershell
npm run lint
npm test
```

Expected result:

```text
tsc --noEmit passes
79 tests pass
```

## Safe Git Commands

Run this from `E:\SE_book_bridge`.

```powershell
git status
```

If the changed files look correct, stage everything:

```powershell
git add .
```

Check what will be committed:

```powershell
git status
git diff --cached --stat
```

Commit:

```powershell
git commit -m "Improve messaging, notifications, and artifact listing links"
```

Push:

```powershell
git push origin main
```

## Notes

- Warnings like `LF will be replaced by CRLF` on Windows are line-ending warnings, not commit-blocking errors.
- If `Parallel_project` appears again in `git status`, do not commit it as an embedded repository. Remove it from staging with:

```powershell
git restore --staged Parallel_project
```

