"use client";

import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Conversation = {
  id: string;
  userAId: string;
  userBId: string;
  userA: { id: string; displayName: string; avatarUrl: string | null };
  userB: { id: string; displayName: string; avatarUrl: string | null };
  lastMessageAt: string | null;
  transaction: { listing: { title: string } } | null;
  messages: Array<{ body: string; createdAt?: string }>;
  _count?: { messages: number };
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string };
};

type LiveMessagePanelProps = {
  currentUserId: string;
  initialUnread: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function moveConversationToTop(conversations: Conversation[], conversationId: string, message: Message) {
  const index = conversations.findIndex((conversation) => conversation.id === conversationId);
  if (index === -1) return conversations;

  const conversation = conversations[index];
  const updated: Conversation = {
    ...conversation,
    lastMessageAt: message.createdAt,
    messages: [{ body: message.body, createdAt: message.createdAt }],
  };
  return [updated, ...conversations.slice(0, index), ...conversations.slice(index + 1)];
}

export function LiveMessagePanel({ currentUserId, initialUnread, open, onOpenChange }: LiveMessagePanelProps) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const refreshConversations = useCallback((showErrors: boolean) => {
    setError("");
    return fetch("/api/conversations")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not load messages");
        const rows = (data.items ?? []) as Conversation[];
        setItems(rows);
        setUnread(rows.reduce((sum, item) => sum + (item._count?.messages ?? 0), 0));
      })
      .catch((requestError: Error) => {
        if (showErrors) setError(requestError.message);
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    void refreshConversations(true);
  }, [open, refreshConversations]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshConversations(false);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshConversations]);

  useEffect(() => {
    if (!active) return;
    setError("");
    fetch(`/api/conversations/${active.id}/messages`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not load this conversation");
        setMessages(data.messages ?? []);
        void refreshConversations(false);
      })
      .catch((requestError: Error) => setError(requestError.message));
    const source = new EventSource(`/api/conversations/${active.id}/stream`);
    source.addEventListener("message", (event) => {
      const message = JSON.parse((event as MessageEvent).data) as Message;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setItems((current) => moveConversationToTop(current, active.id, message));
      setActive((current) => current ? moveConversationToTop([current], current.id, message)[0] : current);
    });
    source.addEventListener("error", () => setError("Live message updates are temporarily unavailable."));
    return () => source.close();
  }, [active, refreshConversations]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !body.trim()) return;
    const res = await fetch(`/api/conversations/${active.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessages((current) => current.some((item) => item.id === out.id) ? current : [...current, out]);
      setItems((current) => moveConversationToTop(current, active.id, out));
      setActive((current) => current ? moveConversationToTop([current], current.id, out)[0] : current);
      setBody("");
      setError("");
    } else {
      setError(out.error ?? "Could not send the message");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="nav-icon-button relative"
        aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
        aria-expanded={open}
        title="Messages"
      >
        <MessageCircle size={20} strokeWidth={2.2} />
        {unread > 0 && <span className="nav-count-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <section className="nav-live-panel">
          {active ? (
            <>
              <header className="flex items-center gap-2 border-b border-slate-200 p-3">
                <button type="button" onClick={() => setActive(null)} className="nav-panel-icon" aria-label="Back to conversations"><ArrowLeft size={18} /></button>
                <div>
                  <h2 className="font-black">{otherUser(active, currentUserId).displayName}</h2>
                  <p className="text-xs text-slate-500">{active.transaction?.listing.title ?? "Direct conversation"}</p>
                </div>
              </header>
              <div className="nav-message-scroll">
                {messages.map((message) => (
                  <div key={message.id} className={`nav-message ${message.sender.id === currentUserId ? "is-mine" : ""}`}>
                    <p>{message.body}</p>
                    <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
                {messages.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No messages yet.</p>}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
                <input value={body} onChange={(event) => setBody(event.target.value)} className="field" placeholder="Write a message" />
                <button className="nav-panel-icon bg-blue-600 text-white" aria-label="Send message"><Send size={17} /></button>
              </form>
            </>
          ) : (
            <>
              <header className="border-b border-slate-200 p-4"><h2 className="text-lg font-black">Messages</h2></header>
              <div className="max-h-[28rem] overflow-y-auto p-2">
                {items.map((conversation) => {
                  const other = otherUser(conversation, currentUserId);
                  return (
                    <button key={conversation.id} type="button" onClick={() => setActive(conversation)} className="flex w-full items-center gap-3 rounded-md p-3 text-left hover:bg-slate-100">
                      <span className="grid size-10 flex-none place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-black text-white">
                        {other.avatarUrl ? <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" /> : other.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">{other.displayName}</strong>
                        <span className="block truncate text-xs text-slate-500">{conversation.messages[0]?.body ?? "Open conversation"}</span>
                      </span>
                    </button>
                  );
                })}
                {items.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No conversations yet.</p>}
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function otherUser(conversation: Conversation, currentUserId: string) {
  return conversation.userAId === currentUserId ? conversation.userB : conversation.userA;
}
