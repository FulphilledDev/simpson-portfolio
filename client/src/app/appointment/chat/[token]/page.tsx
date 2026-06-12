"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const POLL_INTERVAL_MS = 8000;

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  appointmentRequestId: number;
  sender: number; // 0=Owner 1=Client 2=System
  content: string;
  sentAt: string;
  isReadByOwner: boolean;
  isReadByClient: boolean;
}

interface ClientChatData {
  appointmentRequestId: number;
  clientName: string;
  status: number; // 0=Pending 1=Accepted 2=Denied
  isTokenValid: boolean;
  messages: Message[];
}

type PageState = "loading" | "expired" | "not-found" | "error" | "ready";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Group messages by date for date separators
function groupByDate(msgs: Message[]): Array<Message | string> {
  const result: Array<Message | string> = [];
  let lastDate = "";
  for (const msg of msgs) {
    const dateLabel = formatDate(msg.sentAt);
    if (dateLabel !== lastDate) {
      result.push(dateLabel);
      lastDate = dateLabel;
    }
    result.push(msg);
  }
  return result;
}

// ── Status states ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Pending Review", color: "text-amber-400" },
  1: { label: "Accepted", color: "text-neon-cyan" },
  2: { label: "Denied", color: "text-red-400" },
};

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isClient = msg.sender === 1;
  const isSystem = msg.sender === 2;

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[78%] flex flex-col gap-1 ${isClient ? "items-end" : "items-start"}`}
      >
        {!isClient && (
          <span className="text-[10px] text-white/25 px-1 mb-0.5">PhitDev</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isClient
              ? "bg-neon-cyan/20 text-white border border-neon-cyan/20 rounded-br-sm"
              : "bg-white/[0.06] text-white/85 border border-white/[0.08] rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-white/25 px-1">{formatTime(msg.sentAt)}</span>
      </div>
    </div>
  );
}

// ── Date separator ─────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[10px] text-white/25 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

// ── Empty/status screens ───────────────────────────────────────────────────

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">{children}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <CenteredScreen>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border border-neon-cyan/20 bg-neon-cyan/[0.04] flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-neon-cyan/40" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-sm text-white/30">Loading your conversation…</p>
      </div>
    </CenteredScreen>
  );
}

function ExpiredScreen() {
  return (
    <CenteredScreen>
      <div className="glass rounded-2xl p-8 space-y-5">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-amber-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/80 mb-2">Chat Link Expired</h1>
          <p className="text-sm text-white/40 leading-relaxed">
            This conversation link is no longer active. Chat links expire after the appointment is
            resolved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block mt-2 text-sm text-neon-cyan/60 hover:text-neon-cyan transition-colors"
        >
          ← Back to PhitDev
        </Link>
      </div>
    </CenteredScreen>
  );
}

function NotFoundScreen() {
  return (
    <CenteredScreen>
      <div className="glass rounded-2xl p-8 space-y-5">
        <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/80 mb-2">Not Found</h1>
          <p className="text-sm text-white/40">
            This chat link doesn&apos;t exist or may have been removed.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block mt-2 text-sm text-neon-cyan/60 hover:text-neon-cyan transition-colors"
        >
          ← Back to PhitDev
        </Link>
      </div>
    </CenteredScreen>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <CenteredScreen>
      <div className="glass rounded-2xl p-8 space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white/80 mb-2">Connection Error</h1>
          <p className="text-sm text-white/40">
            Couldn&apos;t reach the server. Please check your connection and try again.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="btn-outline-cyan text-sm"
        >
          Try Again
        </button>
      </div>
    </CenteredScreen>
  );
}

// ── Pending screen ─────────────────────────────────────────────────────────

function PendingScreen({ clientName }: { clientName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 space-y-4">
      <div className="w-16 h-16 rounded-full bg-amber-500/[0.06] border border-amber-500/15 flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-medium text-white/60">Hi {clientName},</p>
        <p className="text-sm text-white/35 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Your appointment request is under review. You&apos;ll receive an email once it&apos;s
          accepted, and this chat will become active.
        </p>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-pulse" />
        <span className="text-[11px] text-white/25">Awaiting response</span>
      </div>
    </div>
  );
}

// ── Denied screen ──────────────────────────────────────────────────────────

function DeniedScreen({ clientName }: { clientName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-500/[0.06] border border-red-500/15 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-medium text-white/60">Hi {clientName},</p>
        <p className="text-sm text-white/35 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Unfortunately this appointment request was not accepted. If you think this was in
          error, please{" "}
          <Link href="/book" className="text-neon-cyan/50 hover:text-neon-cyan transition-colors">
            submit a new request
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ClientChatPage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [chat, setChat] = useState<ClientChatData | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userScrolledUpRef = useRef(false);

  // ── Fetch chat data ──────────────────────────────────────────────────────

  const fetchChat = useCallback(
    async (isInitial = false) => {
      try {
        const res = await fetch(`${API_URL}/api/appointments/chat/${token}`);

        if (res.status === 410) {
          setPageState("expired");
          return;
        }
        if (res.status === 404) {
          setPageState("not-found");
          return;
        }
        if (!res.ok) {
          if (isInitial) setPageState("error");
          return;
        }

        const data: ClientChatData = await res.json();
        setChat(data);
        setLastMessageCount((prev) => {
          if (data.messages.length > prev) {
            return data.messages.length;
          }
          return prev;
        });
        if (isInitial) setPageState("ready");
      } catch {
        if (isInitial) setPageState("error");
      }
    },
    [token]
  );

  // Initial load
  useEffect(() => {
    if (!token) {
      setPageState("not-found");
      return;
    }
    fetchChat(true);
  }, [token, fetchChat]);

  // 8-second polling — only when page is ready and accepted
  useEffect(() => {
    if (pageState !== "ready" || chat?.status !== 1) return;

    pollTimerRef.current = setInterval(() => {
      fetchChat(false);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pageState, chat?.status, fetchChat]);

  // Auto-scroll when new messages arrive (only if user is near the bottom)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!chat) return;
    if (chat.messages.length > lastMessageCount - 1 && !userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages.length]);

  // ── Send message ─────────────────────────────────────────────────────────

  async function sendMessage() {
    const content = messageText.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(null);

    try {
      const res = await fetch(`${API_URL}/api/appointments/chat/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.status === 410) {
        setPageState("expired");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "Failed to send");
        setSendError(text || "Failed to send message");
        return;
      }

      const newMsg: Message = await res.json();
      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.some((m) => m.id === newMsg.id)
                ? prev.messages
                : [...prev.messages, newMsg],
            }
          : prev
      );
      setMessageText("");
      userScrolledUpRef.current = false;
      // Immediate re-poll to pick up any owner response
      fetchChat(false);
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (pageState === "loading") return <LoadingScreen />;
  if (pageState === "expired") return <ExpiredScreen />;
  if (pageState === "not-found") return <NotFoundScreen />;
  if (pageState === "error") return <ErrorScreen onRetry={() => fetchChat(true)} />;
  if (!chat) return <LoadingScreen />;

  const statusInfo = STATUS_LABELS[chat.status] ?? { label: "Unknown", color: "text-white/30" };
  const grouped = groupByDate(chat.messages);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav bar */}
      <header className="flex-shrink-0 border-b border-white/[0.08] bg-[rgba(10,10,15,0.95)] backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-gradient-hero text-base font-bold tracking-wide">
            PhitDev
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-white/35">Appointment Chat</span>
            <span
              className={`flex items-center gap-1.5 text-[11px] font-medium ${statusInfo.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  chat.status === 1
                    ? "bg-neon-cyan animate-pulse"
                    : chat.status === 0
                    ? "bg-amber-400"
                    : "bg-red-400"
                }`}
              />
              {statusInfo.label}
            </span>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {chat.status === 0 ? (
          <PendingScreen clientName={chat.clientName} />
        ) : chat.status === 2 ? (
          <>
            <DeniedScreen clientName={chat.clientName} />
            {/* Show any system/owner messages that were sent before denial */}
            {chat.messages.length > 0 && (
              <div className="px-4 pb-8">
                <p className="text-[10px] text-white/20 uppercase tracking-wider mb-4 text-center">
                  Previous messages
                </p>
                {grouped.map((item, i) =>
                  typeof item === "string" ? (
                    <DateSeparator key={`sep-${i}`} label={item} />
                  ) : (
                    <MessageBubble key={item.id} msg={item} />
                  )
                )}
              </div>
            )}
          </>
        ) : (
          // Accepted — full chat
          <>
            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-6"
              onScroll={(e) => {
                const el = e.currentTarget;
                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                userScrolledUpRef.current = distanceFromBottom > 100;
              }}
            >
              {chat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-12 h-12 rounded-full bg-neon-cyan/[0.05] border border-neon-cyan/10 flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-neon-cyan/20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-white/25">
                    Your chat is open. Send a message to get started.
                  </p>
                </div>
              ) : (
                grouped.map((item, i) =>
                  typeof item === "string" ? (
                    <DateSeparator key={`sep-${i}`} label={item} />
                  ) : (
                    <MessageBubble key={item.id} msg={item} />
                  )
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-white/[0.08] px-4 py-4 bg-[rgba(10,10,15,0.8)] backdrop-blur sticky bottom-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send)"
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                  {sendError && (
                    <p className="absolute -top-6 left-0 text-[11px] text-red-400">{sendError}</p>
                  )}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  className="flex-shrink-0 w-12 h-[72px] flex items-center justify-center rounded-xl bg-neon-cyan/15 border border-neon-cyan/25 text-neon-cyan hover:bg-neon-cyan/25 hover:border-neon-cyan/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Send message"
                >
                  {sending ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-white/15 mt-1.5 text-center">
                Updates automatically every {POLL_INTERVAL_MS / 1000}s
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
