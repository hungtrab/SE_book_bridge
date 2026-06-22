# UI Design Choices Across BookBridge

This document helps explain the UI logically in a presentation. The central idea is that BookBridge is a trust-based book exchange platform, so the UI must feel clear, calm, social, and safe.

## 1. Design Goal

BookBridge combines several product modes:

- marketplace search,
- listing management,
- transaction workflow,
- direct messaging,
- community discussion,
- notifications,
- moderation/admin tools,
- interactive literary artifacts.

The UI challenge is to make these features feel like one system instead of separate assignments stitched together.

The main design direction is:

```text
Clean marketplace base
+ social community layer
+ real-time action panels
+ expressive artifact experiences
```

## 2. Global Visual System

The global styles live in:

```text
src/app/globals.css
```

Important shared choices:

- Light background with subtle grid and soft radial color.
- Blue as the main brand color.
- Violet as a secondary accent.
- Reusable card surfaces with light borders and soft shadows.
- Rounded controls and consistent button states.
- Unified `.field` style for inputs, textareas, and selects.
- Unified button classes: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`.
- Motion is lightweight and includes a reduced-motion fallback.

Why this works:

- The platform handles user trust, book requests, and moderation, so the interface should be readable and predictable.
- The glass/card style makes dense screens feel softer without losing structure.
- A shared button and form system makes different modules feel consistent.

## 3. Navigation Design

Files:

```text
src/components/layout/NavBar.tsx
src/components/layout/NavLiveActions.tsx
src/components/messaging/LiveMessagePanel.tsx
src/components/notifications/LiveNotificationBell.tsx
```

The navigation is sticky and always available. It gives users quick access to:

- Search,
- Communities,
- Artifacts,
- Explore,
- Messages,
- Notifications,
- Profile/account actions,
- Moderator/admin actions when authorized.

Design choices:

- `nav-glass` uses blur so navigation feels persistent but not heavy.
- Icon buttons keep the right side compact.
- Count badges communicate unread messages and notifications.
- Live panels open below the nav instead of forcing a full page change.
- Only one panel is open at a time, reducing clutter.

Presentation point:

The navigation is not just a menu. It is the real-time command center for the app.

## 4. Home Page

File:

```text
src/app/page.tsx
```

The home page uses a strong hero because it introduces the full product promise:

```text
Share books. Build trust. Keep stories moving.
```

Design choices:

- Dark hero section creates contrast from the rest of the app.
- Search is placed directly inside the hero, so discovery is immediate.
- Floating cards summarize listings, transactions, and community feed.
- Signed-in users see a personalized feed instead of only marketing content.

Presentation point:

The home page changes from public onboarding to personal dashboard once the user logs in.

## 5. Search And Listings

Files:

```text
src/app/search/page.tsx
src/app/listings/page.tsx
src/components/listings/ListingHorizontalCard.tsx
src/components/listings/ListingForm.tsx
```

The search UI is designed for scanning. It avoids a decorative grid and uses horizontal listing cards so users can compare books quickly.

Design choices:

- Main search bar is large and direct.
- Advanced filters are hidden inside a `<details>` panel.
- Filters cover genre, author, condition, transaction type, max price, and community.
- Results use horizontal cards with cover, title, metadata, owner, condition, and actions.
- Listing page redirects into search so there is one discovery surface.

Presentation point:

Search is built like a marketplace workflow: query first, filters second, action from the result card.

## 6. Messaging UI

Files:

```text
src/app/messages/page.tsx
src/app/messages/[conversationId]/page.tsx
src/components/messaging/ChatThread.tsx
src/components/messaging/LiveMessagePanel.tsx
src/components/messaging/DirectMessageButton.tsx
```

Messaging has two surfaces:

- full page conversation,
- compact live nav panel.

Design choices:

- User messages align right, other messages align left.
- Message colors distinguish sender ownership.
- Conversation list shows most recent message.
- Unread count appears in both the nav badge and conversation rows.
- Live panel supports quick replies without leaving the current page.
- Full page supports a clearer threaded view and moderation/report actions.

Presentation point:

Messaging is designed as an exchange support tool, not a standalone social chat app. It keeps users close to listings and transactions.

## 7. Communities UI

Files:

```text
src/app/communities/page.tsx
src/app/communities/[id]/page.tsx
src/components/communities/*
```

The community UI is structured like a social reading space:

- main bulletin feed in the center,
- subcommunity navigation on the side,
- create/join controls separated into panels,
- community detail page with cover, posts, reactions, comments, and side panels.

Design choices:

- Sidebar panels are sticky on large screens.
- Community cards use a white social-feed style.
- Reaction picker gives expressive feedback without taking much space.
- Private communities expose invite-code workflow only to eligible users.
- Posts can attach listings, connecting discussion back to marketplace activity.

Presentation point:

Communities are the bridge between content and commerce: members discuss books, then listings and exchanges can grow out of that activity.

## 8. Transactions UI

Files:

```text
src/app/transactions/page.tsx
src/app/transactions/[id]/page.tsx
src/components/transactions/TransactionActions.tsx
src/components/transactions/RequestListingButton.tsx
```

Transactions are shown as a workflow rather than a single action.

Design choices:

- Status tabs let users filter by stage.
- Transaction rows show book, counterparty, and update time.
- Detail pages expose only the valid next actions.
- Messaging opens around transaction context when needed.

Presentation point:

The UI follows the transaction state machine. Users do not need to understand backend states; the page shows the next safe action.

## 9. Notifications UI

Files:

```text
src/components/notifications/LiveNotificationBell.tsx
src/components/notifications/NotificationList.tsx
src/components/notifications/NotificationPreferenceForm.tsx
src/lib/notifications/presentation.ts
```

Notifications are built as a live awareness layer.

Design choices:

- Bell icon uses unread count badge.
- Notification panel provides quick context.
- Full notifications page supports review.
- Preferences let users control email behavior.
- Presentation helper maps backend notification kinds to user-friendly language.

Presentation point:

Notifications connect all modules: messages, transactions, communities, reputation, and moderation.

## 10. Artifacts UI

Files:

```text
src/app/artifacts/page.tsx
src/app/artifacts/the-alchemist/page.tsx
src/app/artifacts/tuc-nuoc-vo-bo/page.tsx
src/components/artifacts/ArtifactGame.tsx
src/components/artifacts/ArtifactDiscussion.tsx
```

Artifacts are intentionally more immersive than the marketplace screens.

Design choices:

- Artifact landing page uses image cards with dark overlays.
- Artifact game uses a full-height interactive scene.
- Story narration appears as a bottom panel.
- Hotspots are gated until narration finishes, making the experience readable.
- Health bar, audio player, fullscreen control, game-over, and victory screens make it feel like a complete mini-game.
- Discussion is placed below the artifact so interpretation turns into community activity.

Presentation point:

Artifacts extend BookBridge beyond transactions. They make literature interactive, then reconnect the user to discussion and book discovery.

## 11. Moderation And Admin UI

Files:

```text
src/app/moderation/page.tsx
src/app/admin/page.tsx
src/components/moderation/*
src/components/admin/*
```

Moderation/admin screens are intentionally plain and operational.

Design choices:

- Moderator queue is ticket-based.
- Tickets show target type, reason, reporter, and action history.
- Admin dashboard focuses on platform stats.
- Admin routes are linked only when the user has permission.

Presentation point:

The moderation UI sacrifices decoration for clarity because moderators need to make safe decisions quickly.

## 12. What Happened With The UI Over Time

The UI moved from simple feature pages toward a unified product system:

1. Initial pages focused on core functions: listings, transactions, auth, messages.
2. Shared global styles created a consistent visual language.
3. Navigation became a live action center with messages and notifications.
4. Search/listings moved toward a dense marketplace layout.
5. Communities introduced a social feed pattern.
6. Artifacts introduced immersive, expressive UI while still using shared discussion patterns.
7. Moderation/admin screens remained functional and restrained.

The result is a system with two visual modes:

- Operational mode: search, listings, transactions, admin, moderation.
- Expressive mode: home hero, communities, artifacts.

Both modes share the same typography, buttons, forms, and navigation.

## 13. Presentation Flow

Use this order in your talk:

1. Start with the product problem: second-hand book exchange needs trust and communication.
2. Show the global UI system: nav, buttons, cards, forms.
3. Show discovery: home, search, listing cards.
4. Show transaction support: request, transaction status, messaging.
5. Show social layer: communities, reactions, comments.
6. Show artifacts: interactive literature plus discussion.
7. Show safety layer: reports, moderation, admin.
8. Close with the design principle: every UI surface either helps users find books, complete exchanges, build community, or stay safe.

## 14. Short Presenter Script

The UI was designed around trust and repeated use. Marketplace pages are clean and scannable so users can compare books quickly. The navigation acts as a live control center, with messages and notifications always accessible. Communities use a social-feed layout because discussion and reactions are central there. Artifacts are more immersive because they are not just transactions; they are interactive reading experiences. Even then, they reconnect to the platform through comments and book discovery. Finally, moderation and admin screens are intentionally practical because safety workflows need clarity more than decoration.

The important point is that the UI is not random per feature. It uses one shared design system, then changes intensity depending on the job of each screen.
