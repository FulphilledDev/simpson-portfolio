"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { startConnection } from "@/lib/signalr";


// ── Types ──────────────────────────────────────────────────────────────────

interface ConversationPreview {
  appointmentRequestId: number;
  clientName: string;
  clientEmail: string;
  status: number; // 0=Pending 1=Accepted 2=Denied
  lastMessage: string | null;
  lastMessageAt: string | null;
  ownerUnreadCount: number;
  clientUnreadCount: number;
}

interface AppointmentDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  projectType: number;
  budget: string | null;
  message: string;
  status: number;
  submittedAt: string;
  respondedAt: string | null;
  ownerNotes: string | null;
  clientToken: string;
  scheduledDate: string | null; // "YYYY-MM-DD"
  scheduledTime: string | null; // "HH:MM:SS"
}

interface Message {
  id: number;
  appointmentRequestId: number;
  sender: number; // 0=Owner 1=Client 2=System
  content: string;
  sentAt: string;
  isReadByOwner: boolean;
  isReadByClient: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  0: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  1: { label: "Accepted", cls: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20" },
  2: { label: "Denied", cls: "bg-red-500/15 text-red-400 border-red-500/25" },
};

const PROJECT_TYPE_MAP: Record<number, string> = {
  0: "Web App",
  1: "API",
  2: "Mobile App",
  3: "Consultation",
  4: "Other",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScheduled(date: string, time: string) {
  // date = "YYYY-MM-DD", time = "HH:MM:SS"
  const [h, m] = time.split(":");
  const d = new Date(date + "T00:00:00");
  const timeStr = new Date(0, 0, 0, Number(h), Number(m)).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${timeStr}`;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  const { label, cls } = STATUS_MAP[status] ?? {
    label: "Unknown",
    cls: "bg-white/10 text-white/50 border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
    >
      {label}
    </span>
  );
}

// ── Conversation list item ─────────────────────────────────────────────────

function ConversationItem({
  conv,
  isSelected,
  onClick,
}: {
  conv: ConversationPreview;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-white/[0.05] transition-all duration-200 ${
        isSelected
          ? "bg-neon-cyan/[0.06] border-l-[3px] border-l-neon-cyan"
          : "hover:bg-white/[0.03] border-l-[3px] border-l-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-white/90 truncate">{conv.clientName}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {conv.ownerUnreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-neon-cyan text-[10px] font-bold text-black">
              {conv.ownerUnreadCount}
            </span>
          )}
          {conv.lastMessageAt && (
            <span className="text-[11px] text-white/30">{formatRelative(conv.lastMessageAt)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={conv.status} />
        <span className="text-[11px] text-white/35 truncate flex-1">
          {conv.lastMessage ?? conv.clientEmail}
        </span>
      </div>
    </button>
  );
}

// ── Chat message bubble ────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isOwner = msg.sender === 0;
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
    <div className={`flex ${isOwner ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[72%] flex flex-col gap-1 ${isOwner ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwner
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

// ── Schedule time panel ────────────────────────────────────────────────────

function ScheduleTimePanel({
  appointment,
  onScheduled,
}: {
  appointment: AppointmentDetail;
  onScheduled: (updated: AppointmentDetail) => void;
}) {
  const hasExisting = !!(appointment.scheduledDate && appointment.scheduledTime);

  // Pre-fill from existing scheduled values or empty
  const [date, setDate] = useState(appointment.scheduledDate ?? "");
  const [time, setTime] = useState(
    appointment.scheduledTime ? appointment.scheduledTime.substring(0, 5) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSchedule() {
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await apiFetch<AppointmentDetail>(
        `/api/appointments/${appointment.id}/schedule`,
        {
          method: "PATCH",
          authenticated: true,
          body: JSON.stringify({
            date,
            time: `${time}:00`,
            // Send the browser's UTC offset so the calendar event lands at the correct local time.
            // JS getTimezoneOffset() returns minutes *west* of UTC (negative for east), so negate it.
            utcOffsetMinutes: -new Date(`${date}T${time}`).getTimezoneOffset(),
          }),
        }
      );
      onScheduled(updated);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          {hasExisting ? "Update Appointment Time" : "Add Appointment Time"}
        </p>
        {hasExisting && (
          <span className="text-[11px] text-neon-cyan/60 bg-neon-cyan/[0.06] border border-neon-cyan/20 rounded px-2 py-0.5">
            Scheduled: {formatScheduled(appointment.scheduledDate!, appointment.scheduledTime!)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setSuccess(false); }}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/30 transition-colors [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => { setTime(e.target.value); setSuccess(false); }}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/30 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && (
        <p className="text-xs text-neon-cyan/70">
          ✓ Client notified and calendar {hasExisting ? "updated" : "event created"}
        </p>
      )}

      <button
        onClick={handleSchedule}
        disabled={!date || !time || submitting}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed btn-glow-cyan"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </span>
        ) : hasExisting ? (
          "Update Time"
        ) : (
          "Set Appointment Time"
        )}
      </button>
    </div>
  );
}

// ── Respond panel ──────────────────────────────────────────────────────────

function RespondPanel({
  appointment,
  onResponded,
}: {
  appointment: AppointmentDetail;
  onResponded: (updated: AppointmentDetail) => void;
}) {
  const [decision, setDecision] = useState<1 | 2 | null>(null);
  const [ownerNotes, setOwnerNotes] = useState(appointment.ownerNotes ?? "");
  const [responseMessage, setResponseMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRespond() {
    if (!decision) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiFetch<AppointmentDetail>(
        `/api/appointments/${appointment.id}/respond`,
        {
          method: "PATCH",
          authenticated: true,
          body: JSON.stringify({
            status: decision,
            ownerNotes: ownerNotes.trim() || null,
            responseMessage: responseMessage.trim() || null,
          }),
        }
      );
      onResponded(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to respond");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02] space-y-3">
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        Respond to Request
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => setDecision(1)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
            decision === 1
              ? "bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan"
              : "border-white/[0.08] text-white/45 hover:border-neon-cyan/30 hover:text-neon-cyan/70"
          }`}
        >
          ✓ Accept
        </button>
        <button
          onClick={() => setDecision(2)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
            decision === 2
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : "border-white/[0.08] text-white/45 hover:border-red-500/30 hover:text-red-400/70"
          }`}
        >
          ✕ Deny
        </button>
      </div>

      <textarea
        value={ownerNotes}
        onChange={(e) => setOwnerNotes(e.target.value)}
        placeholder="Internal notes (not sent to client)…"
        rows={2}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-neon-cyan/30 transition-colors"
      />

      <textarea
        value={responseMessage}
        onChange={(e) => setResponseMessage(e.target.value)}
        placeholder="Message to client (optional, sent via email)…"
        rows={2}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-neon-cyan/30 transition-colors"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleRespond}
        disabled={!decision || submitting}
        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          decision === 2
            ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
            : decision === 1
            ? "btn-glow-cyan text-sm"
            : "border border-white/[0.08] text-white/30"
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </span>
        ) : decision === 1 ? (
          "Accept Appointment"
        ) : decision === 2 ? (
          "Deny Appointment"
        ) : (
          "Select a response above"
        )}
      </button>
    </div>
  );
}

// ── Detail + chat panel ────────────────────────────────────────────────────

function AppointmentDetailPanel({
  appointmentId,
  onConversationUpdate,
  onBack,
}: {
  appointmentId: number;
  onConversationUpdate: () => void;
  onBack?: () => void;
}) {
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageIdRef = useRef<number>(0);

  // Merge incoming messages (dedup by id, preserving order)
  function mergeMessages(prev: Message[], incoming: Message[]): Message[] {
    const existingIds = new Set(prev.map((m) => m.id));
    const newOnes = incoming.filter((m) => !existingIds.has(m.id));
    return newOnes.length ? [...prev, ...newOnes] : prev;
  }

  // Load detail + messages
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setAppointment(null);
    Promise.all([
      apiFetch<AppointmentDetail>(`/api/appointments/${appointmentId}`, {
        authenticated: true,
      }),
      apiFetch<Message[]>(`/api/appointments/${appointmentId}/messages`, {
        authenticated: true,
      }),
    ])
      .then(([appt, msgs]) => {
        setAppointment(appt);
        setMessages(msgs);
        // Mark owner as read
        apiFetch(`/api/appointments/${appointmentId}/messages/read`, {
          method: "PATCH",
          authenticated: true,
        })
          .then(() => onConversationUpdate())
          .catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // SignalR — join group and listen for NewMessage
  useEffect(() => {
    let mounted = true;
    let conn: Awaited<ReturnType<typeof startConnection>> | null = null;

    function joinGroup() {
      conn?.invoke("JoinAppointment", appointmentId).catch(console.error);
    }

    startConnection()
      .then((c) => {
        if (!mounted) return;
        conn = c;
        joinGroup();
        // Re-join the group after automatic reconnection (covers hot-reload / network drops)
        c.onreconnected(() => { if (mounted) joinGroup(); });
        c.on("NewMessage", (msg: Message) => {
          if (!mounted) return;
          if (msg.id) latestMessageIdRef.current = Math.max(latestMessageIdRef.current, msg.id);
          setMessages((prev) => mergeMessages(prev, [msg]));
          apiFetch(`/api/appointments/${appointmentId}/messages/read`, {
            method: "PATCH",
            authenticated: true,
          })
            .then(() => onConversationUpdate())
            .catch(() => {});
        });
      })
      .catch(console.error);

    return () => {
      mounted = false;
      if (conn) {
        conn.invoke("LeaveAppointment", appointmentId).catch(() => {});
        conn.off("NewMessage");
      }
    };
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5s polling fallback — catches any SignalR-missed messages
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const latest = await apiFetch<Message[]>(
          `/api/appointments/${appointmentId}/messages`,
          { authenticated: true }
        );
        setMessages((prev) => mergeMessages(prev, latest));
      } catch {
        // silently ignore poll errors
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [appointmentId]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = messageText.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/api/appointments/${appointmentId}/messages`, {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({ content }),
      });
      // Optimistically add own message immediately (SignalR also fires but dedups)
      setMessages((prev) => mergeMessages(prev, [msg]));
      setMessageText("");
      onConversationUpdate();
    } catch (e) {
      console.error(e);
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/30">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-white/[0.08] flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-colors"
            aria-label="Back to list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white/90 truncate">{appointment.name}</h2>
          <p className="text-[12px] text-white/40 mt-0.5 truncate">{appointment.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded">
            {PROJECT_TYPE_MAP[appointment.projectType]}
          </span>
          <StatusBadge status={appointment.status} />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Client details */}
        <div className="px-4 md:px-6 py-5 border-b border-white/[0.06] space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {appointment.phone && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Phone</p>
                <p className="text-sm text-white/70">{appointment.phone}</p>
              </div>
            )}
            {appointment.budget && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Budget</p>
                <p className="text-sm text-white/70">{appointment.budget}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Submitted</p>
              <p className="text-sm text-white/70">{formatDate(appointment.submittedAt)}</p>
            </div>
            {appointment.respondedAt && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
                  Responded
                </p>
                <p className="text-sm text-white/70">{formatDate(appointment.respondedAt)}</p>
              </div>
            )}
          </div>

          {/* Request message */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
              Request Message
            </p>
            <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              {appointment.message}
            </div>
          </div>

          {/* Owner notes (read-only after respond) */}
          {appointment.ownerNotes && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                Your Notes
              </p>
              <p className="text-sm text-white/50 italic">{appointment.ownerNotes}</p>
            </div>
          )}

          {/* Respond — only for Pending */}
          {appointment.status === 0 && (
            <RespondPanel
              appointment={appointment}
              onResponded={(updated) => {
                setAppointment(updated);
                onConversationUpdate();
              }}
            />
          )}

          {/* Schedule appointment time — only for Accepted */}
          {appointment.status === 1 && (
            <ScheduleTimePanel
              appointment={appointment}
              onScheduled={(updated) => {
                setAppointment(updated);
                onConversationUpdate();
              }}
            />
          )}

          {/* Client chat link */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-white/25">Client chat link:</span>
            <a
              href={`/appointment/chat/${appointment.clientToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-neon-cyan/50 hover:text-neon-cyan transition-colors underline underline-offset-2 font-mono truncate"
            >
              /appointment/chat/{appointment.clientToken.substring(0, 8)}…
            </a>
          </div>
        </div>

        {/* Chat messages */}
        <div className="px-4 md:px-6 py-4">
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-4">Conversation</p>
          {messages.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-8">No messages yet.</p>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input — only for Accepted appointments */}
      {appointment.status === 1 && (
        <div className="px-4 md:px-6 py-4 border-t border-white/[0.08] flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-neon-cyan/30 transition-colors"
            />
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
          <p className="text-[10px] text-white/20 mt-1.5">
            Chat is available for accepted appointments only.
          </p>
        </div>
      )}

      {/* Denied — show note */}
      {appointment.status === 2 && (
        <div className="px-4 md:px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
          <p className="text-[12px] text-white/25 text-center">
            This appointment was denied. Chat is disabled.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type FilterKey = "all" | "pending" | "accepted" | "denied";

export default function AdminAppointmentsPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  // Mobile: track whether we're showing list or detail
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const touchStartXRef = useRef<number | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiFetch<ConversationPreview[]>(
        "/api/appointments/conversations",
        { authenticated: true }
      );
      setConversations(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

  const counts: Record<FilterKey, number> = {
    all: conversations.length,
    pending: conversations.filter((c) => c.status === 0).length,
    accepted: conversations.filter((c) => c.status === 1).length,
    denied: conversations.filter((c) => c.status === 2).length,
  };

  const filtered = conversations.filter((c) => {
    if (filter === "pending") return c.status === 0;
    if (filter === "accepted") return c.status === 1;
    if (filter === "denied") return c.status === 2;
    return true;
  });

  // Sort: pending first, then by last message time desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 0 && b.status !== 0) return -1;
    if (b.status === 0 && a.status !== 0) return 1;
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(0).getTime();
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(0).getTime();
    return tb - ta;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.ownerUnreadCount, 0);

  const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "denied", label: "Denied" },
  ];

  function handleSelectConversation(id: number) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function handleBack() {
    setMobileView("list");
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      {/* Page header — hidden on mobile when viewing detail */}
      <div className={`px-4 md:px-8 py-4 md:py-5 border-b border-white/[0.08] flex-shrink-0 ${
        mobileView === "detail" ? "hidden md:block" : ""
      }`}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white/90">Appointments</h1>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-neon-cyan text-[11px] font-bold text-black">
              {totalUnread}
            </span>
          )}
        </div>
        <p className="text-sm text-white/30 mt-0.5 hidden sm:block">
          Manage client appointment requests and conversations
        </p>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left: conversation list */}
        {/* On mobile: full width, hidden when detail is open */}
        {/* On desktop: always visible as fixed-width panel */}
        <div className={`${
          mobileView === "detail" ? "hidden" : "flex"
        } md:flex w-full md:w-80 flex-shrink-0 flex-col md:border-r border-white/[0.08]`}>
          {/* Filter tabs */}
          <div className="flex border-b border-white/[0.08] bg-white/[0.01]">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 py-3 text-[12px] font-medium transition-colors capitalize ${
                  filter === key
                    ? "text-neon-cyan border-b-2 border-neon-cyan -mb-px"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={`ml-1 text-[11px] ${
                    filter === key ? "text-neon-cyan/50" : "text-white/25"
                  }`}>({counts[key]})</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-white/25">No appointments</p>
                <p className="text-[11px] text-white/15 mt-1">
                  {filter !== "all" ? `No ${filter} appointments` : "None yet"}
                </p>
              </div>
            ) : (
              sorted.map((conv) => (
                <ConversationItem
                  key={conv.appointmentRequestId}
                  conv={conv}
                  isSelected={selectedId === conv.appointmentRequestId}
                  onClick={() => handleSelectConversation(conv.appointmentRequestId)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail + chat */}
        {/* On mobile: full width, only shown when detail is open */}
        {/* On desktop: always visible as flex-1 */}
        <div
          className={`${
            mobileView === "list" ? "hidden" : "flex"
          } md:flex flex-1 flex-col min-w-0 min-h-0`}
          onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartXRef.current === null) return;
            const dx = touchStartXRef.current - e.changedTouches[0].clientX;
            touchStartXRef.current = null;
            // Swipe left ≥ 60px → go back (only on mobile)
            if (dx >= 60 && mobileView === "detail") handleBack();
          }}
        >
          {selectedId !== null ? (
            <AppointmentDetailPanel
              key={selectedId}
              appointmentId={selectedId}
              onConversationUpdate={loadConversations}
              onBack={handleBack}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full bg-neon-cyan/[0.05] border border-neon-cyan/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neon-cyan/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-white/30">Select an appointment to view details</p>
              <p className="text-[11px] text-white/15 mt-1">
                Client info, request details, and chat all in one place
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
