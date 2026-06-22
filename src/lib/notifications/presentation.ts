type NotificationPayload = Record<string, unknown>;

export type NotificationPresentation = {
  title: string;
  body: string;
  href?: string;
};

export function presentNotification(kind: string, payload: unknown): NotificationPresentation {
  const data = isObject(payload) ? payload : {};
  const event = stringValue(data.kind) ?? stringValue(data.event);
  const title = stringValue(data.title) ?? stringValue(data.postTitle);

  if (kind === "TRANSACTION_STATUS_CHANGED") {
    if (event === "transaction.requested") {
      return {
        title: "New book request",
        body: title
          ? `Someone requested "${title}". Open the transaction to accept, decline, or message them.`
          : "Someone requested one of your books. Open the transaction to review it.",
        href: transactionHref(data),
      };
    }
    if (event === "promoted_from_waitlist") {
      return {
        title: "Request moved back to pending",
        body: "A previous accepted request was cancelled, so your waitlisted request is pending again.",
        href: transactionHref(data),
      };
    }
    if (event === "delivery_reminder_scheduled") {
      return {
        title: "Delivery reminder scheduled",
        body: "Remember to complete the exchange after delivery.",
        href: transactionHref(data),
      };
    }
    return {
      title: "Transaction updated",
      body: humanStatus(stringValue(data.status)) ?? "A transaction status changed.",
      href: transactionHref(data),
    };
  }

  if (kind === "NEW_MESSAGE") {
    return {
      title: "New message",
      body: "You received a new chat message.",
      href: stringValue(data.conversationId) ? `/messages/${data.conversationId}` : undefined,
    };
  }

  if (kind === "NEW_LISTING_FROM_FOLLOWED") {
    return {
      title: "New book from someone you follow",
      body: title ? `"${title}" was just listed.` : "A followed reader posted a new book.",
      href: listingHref(data),
    };
  }

  if (kind === "COMMUNITY_ANNOUNCEMENT") {
    return {
      title: "Community update",
      body: title ? `"${title}" was posted in one of your communities.` : "A community you joined has a new update.",
      href: listingHref(data) ?? communityHref(data),
    };
  }

  if (kind === "REPUTATION_TIER_CHANGED") {
    return {
      title: "Reputation updated",
      body: stringValue(data.tier)
        ? `Your reputation tier is now ${data.tier}.`
        : "Your reputation tier changed.",
    };
  }

  if (kind === "MODERATION_ACTION") {
    return {
      title: "Moderator reviewed a ticket",
      body: stringValue(data.action)
        ? `A moderator applied: ${humanEnum(data.action)}.`
        : "A moderator reviewed a support ticket.",
      href: stringValue(data.reportId) ? "/reports" : undefined,
    };
  }

  if (kind === "COMMUNITY_POST_CREATED") {
    const communityName = stringValue(data.communityName);
    return {
      title: communityName ? `New post in ${communityName}` : "New community post",
      body: title ? `"${title}" was posted.` : "A new post was created in your community.",
      href: stringValue(data.postId) && stringValue(data.communityId)
        ? `/communities/${data.communityId}#post-${data.postId}`
        : communityHref(data),
    };
  }

  if (kind === "COMMUNITY_POST_LIKED") {
    return {
      title: "Someone liked your post",
      body: title ? `Your post "${title}" received a like.` : "Someone liked one of your community posts.",
      href: stringValue(data.postId) && stringValue(data.communityId)
        ? `/communities/${data.communityId}#post-${data.postId}`
        : undefined,
    };
  }

  if (kind === "COMMUNITY_POST_COMMENTED") {
    return {
      title: "New comment on your post",
      body: title ? `Someone commented on "${title}".` : "Someone commented on one of your community posts.",
      href: stringValue(data.postId) && stringValue(data.communityId)
        ? `/communities/${data.communityId}#${stringValue(data.commentId) ? `comment-${data.commentId}` : `post-${data.postId}`}`
        : undefined,
    };
  }

  return {
    title: humanEnum(kind),
    body: "You have a new BookBridge notification.",
  };
}

function transactionHref(data: NotificationPayload) {
  const id = stringValue(data.transactionId);
  return id ? `/transactions/${id}` : undefined;
}

function listingHref(data: NotificationPayload) {
  const id = stringValue(data.listingId);
  return id ? `/listings/${id}` : undefined;
}

function communityHref(data: NotificationPayload) {
  const id = stringValue(data.communityId);
  return id ? `/communities/${id}` : undefined;
}

function humanStatus(status?: string) {
  if (!status) return undefined;
  const map: Record<string, string> = {
    accepted: "Your request was accepted.",
    declined: "Your request was declined.",
    cancelled: "A transaction was cancelled.",
    completed: "A transaction was completed.",
    in_delivery: "A transaction moved to delivery.",
    disputed: "A transaction was marked as disputed.",
    waitlisted: "Your request was waitlisted because another request was accepted.",
  };
  return map[status.toLowerCase()] ?? `Status changed to ${humanEnum(status)}.`;
}

function humanEnum(value: unknown) {
  return String(value)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isObject(value: unknown): value is NotificationPayload {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
