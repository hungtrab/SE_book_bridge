# Tomorrow Presentation Checklist

Use this as a quick speaking guide.

## 1. What I Own

Focus on:

- Messages
- Artifact experience
- Artifact discussion
- The database tables supporting those features
- How the UI connects these features to the whole system

## 2. Latest Pull Summary

Pulled latest changes from `origin/main` on June 23, 2026.

Recent relevant changes include:

- improved live messaging panel,
- improved chat thread behavior,
- artifact discussion updates,
- artifact game victory behavior,
- notification and SSE improvements,
- new role/presentation documentation,
- new integration tests around community, moderation, reputation, and admin.

## 3. Key Code Files To Mention

Messages:

```text
src/server/messaging/service.ts
src/server/messaging/sse.ts
src/components/messaging/ChatThread.tsx
src/components/messaging/LiveMessagePanel.tsx
src/components/messaging/DirectMessageButton.tsx
src/app/api/conversations/*
```

Artifacts:

```text
src/components/artifacts/ArtifactGame.tsx
src/components/artifacts/ArtifactDiscussion.tsx
src/server/artifacts/comments.ts
src/lib/artifacts/registry.ts
src/lib/artifacts/*-story.ts
src/lib/artifacts/*-audio.ts
```

Database:

```text
prisma/schema.prisma
Conversation
Message
ArtifactComment
ArtifactCommentLike
Notification
Report
```

UI:

```text
src/app/globals.css
src/components/layout/NavBar.tsx
src/components/layout/NavLiveActions.tsx
```

## 4. Message Feature In One Minute

Messages help users coordinate book exchanges. The backend stores a `Conversation` between two users and multiple `Message` rows. The frontend has both a full chat page and a live nav panel. New messages are pushed through Server-Sent Events, with polling as a fallback. Message creation also dispatches notifications, and message content can be reported to moderation.

## 5. Artifact Feature In One Minute

Artifacts turn books into interactive experiences. The story structure is stored in TypeScript data files, then rendered by `ArtifactGame`. The game manages health, scenes, choices, narration, audio, victory, and game-over states. Under the game, `ArtifactDiscussion` stores reader comments in the database and supports likes, sorting, and moderation.

## 6. Database In One Minute

The database separates transactional communication from content discussion. Messages use `Conversation` and `Message`. Artifact discussions use `ArtifactComment` and `ArtifactCommentLike`. `Notification` connects message events to user awareness. `Report` connects unsafe content to moderation. This means communication, discussion, notification, and safety are connected but still modular.

## 7. UI In One Minute

The UI uses a shared design system: glass nav, soft cards, unified buttons, unified fields, badges, and live panels. Marketplace screens are scannable and practical. Communities are social and feed-like. Artifacts are immersive and animated. Moderation/admin screens are plain and operational. The design changes intensity depending on the user task, but it stays visually consistent.

## 8. Best Closing Sentence

My part connects people after discovery: messages help them complete exchanges, and artifacts help them engage with books as experiences. Both features use the same architecture pattern: UI component, API route, server service, and database model, with notification and moderation hooks for trust.
