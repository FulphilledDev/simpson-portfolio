"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";

// ── Field ──────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
        {label}
        {required && <span className="text-neon-cyan ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/30">{hint}</p>}
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? "bg-neon-cyan/40 border border-neon-cyan/50" : "bg-white/[0.08] border border-white/[0.12]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-4 bg-neon-cyan" : "translate-x-0.5 bg-white/40"
          }`}
        />
      </div>
      <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{label}</span>
    </button>
  );
}


// ── Types ──────────────────────────────────────────────────────────────────

type SlotType = "Consultation" | "FollowUp" | "ProjectReview" | "Other";

interface AvailabilitySlotDto {
  id: number;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  type: SlotType;
  isPublic: boolean;
  notes: string | null;
  appointmentRequestId: number | null;
}

interface BlockedSlotDto {
  id: number;
  start: string;
  end: string;
  reason: string | null;
}

interface AvailabilityForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: SlotType;
  isPublic: boolean;
  notes: string;
}

interface BlockedForm {
  start: string;
  end: string;
  reason: string;
}

const EMPTY_AVAIL: AvailabilityForm = {
  title: "", date: "", startTime: "", endTime: "", type: "Consultation", isPublic: true, notes: "",
};
const EMPTY_BLOCKED: BlockedForm = { start: "", end: "", reason: "" };

const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  Consultation: "Consultation",
  FollowUp: "Follow-Up",
  ProjectReview: "Project Review",
  Other: "Other",
};
const SLOT_TYPE_COLORS: Record<SlotType, string> = {
  Consultation: "text-neon-cyan border-neon-cyan/20 bg-neon-cyan/10",
  FollowUp: "text-purple-400 border-purple-500/25 bg-purple-500/15",
  ProjectReview: "text-amber-400 border-amber-500/25 bg-amber-500/15",
  Other: "text-white/50 border-white/10 bg-white/5",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function toTimeInput(t: string | null) { return t ? t.slice(0, 5) : ""; }

function toDateTimeLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SlotTypeBadge({ type }: { type: SlotType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${SLOT_TYPE_COLORS[type]}`}>
      {SLOT_TYPE_LABELS[type]}
    </span>
  );
}

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/20 focus:outline-none focus:border-neon-cyan/40 transition-colors";
const selectCls =
  "w-full bg-[#0a0a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 focus:outline-none focus:border-neon-cyan/40 transition-colors";

// ── Slot Modal ─────────────────────────────────────────────────────────────

function SlotModal({
  slot,
  onClose,
  onSaved,
}: {
  slot: AvailabilitySlotDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = slot !== null;
  const [form, setForm] = useState<AvailabilityForm>(
    slot
      ? {
          title: slot.title,
          date: slot.date,
          startTime: toTimeInput(slot.startTime),
          endTime: toTimeInput(slot.endTime),
          type: slot.type,
          isPublic: slot.isPublic,
          notes: slot.notes ?? "",
        }
      : EMPTY_AVAIL
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AvailabilityForm>(key: K, value: AvailabilityForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      setError("Title and date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      type: form.type,
      isPublic: form.isPublic,
      notes: form.notes.trim() || null,
      appointmentRequestId: slot?.appointmentRequestId ?? null,
    };
    try {
      if (isEdit) {
        await apiFetch(`/api/availability/${slot.id}`, {
          method: "PUT", authenticated: true, body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/availability", {
          method: "POST", authenticated: true, body: JSON.stringify(body),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save slot.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto glass rounded-2xl">
        <div className="sticky top-0 z-10 glass flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Slot" : "New Availability Slot"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Free Consultation"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as SlotType)}
                className={selectCls}
              >
                {(Object.keys(SLOT_TYPE_LABELS) as SlotType[]).map((t) => (
                  <option key={t} value={t}>{SLOT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="End Time">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Toggle
            label="Visible on public booking page"
            checked={form.isPublic}
            onChange={(v) => set("isPublic", v)}
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlowButton type="button" variant="ghost" onClick={onClose}>Cancel</GlowButton>
            <GlowButton type="submit" variant="cyan" size="sm" loading={saving}>
              {isEdit ? "Save Changes" : "Create Slot"}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Blocked Modal ──────────────────────────────────────────────────────────

function BlockedModal({
  blocked,
  onClose,
  onSaved,
}: {
  blocked: BlockedSlotDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = blocked !== null;
  const [form, setForm] = useState<BlockedForm>(
    blocked
      ? {
          start: toDateTimeLocalInput(blocked.start),
          end: toDateTimeLocalInput(blocked.end),
          reason: blocked.reason ?? "",
        }
      : EMPTY_BLOCKED
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof BlockedForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.start || !form.end) { setError("Start and end are required."); return; }
    if (new Date(form.end) <= new Date(form.start)) { setError("End must be after start."); return; }
    setSaving(true);
    setError(null);
    const body = {
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      reason: form.reason.trim() || null,
    };
    try {
      if (isEdit) {
        await apiFetch(`/api/blockedslots/${blocked.id}`, {
          method: "PUT", authenticated: true, body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/blockedslots", {
          method: "POST", authenticated: true, body: JSON.stringify(body),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blocked period.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass rounded-2xl">
        <div className="sticky top-0 z-10 glass flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Blocked Period" : "Block Time"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Start" required>
            <input
              type="datetime-local"
              value={form.start}
              onChange={(e) => set("start", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="End" required>
            <input
              type="datetime-local"
              value={form.end}
              onChange={(e) => set("end", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Reason">
            <input
              type="text"
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="e.g. Vacation, Holiday…"
              className={inputCls}
            />
          </Field>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlowButton type="button" variant="ghost" onClick={onClose}>Cancel</GlowButton>
            <GlowButton type="submit" variant="cyan" size="sm" loading={saving}>
              {isEdit ? "Save Changes" : "Block Period"}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────

function DeleteConfirm({
  title,
  description,
  onClose,
  onConfirm,
  deleting,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative z-10 w-full max-w-md" accent="none">
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-white/60 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <GlowButton variant="ghost" onClick={onClose}>Cancel</GlowButton>
          <GlowButton
            variant="purple"
            size="sm"
            loading={deleting}
            onClick={onConfirm}
            className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
          >
            Delete
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = "slots" | "blocked";

export default function AvailabilityPage() {
  const [tab, setTab] = useState<Tab>("slots");

  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotModal, setSlotModal] = useState<AvailabilitySlotDto | null | "new">(null);
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlotDto | null>(null);
  const [deletingSlot, setDeletingSlot] = useState(false);

  const [blocked, setBlocked] = useState<BlockedSlotDto[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [blockedModal, setBlockedModal] = useState<BlockedSlotDto | null | "new">(null);
  const [blockedToDelete, setBlockedToDelete] = useState<BlockedSlotDto | null>(null);
  const [deletingBlocked, setDeletingBlocked] = useState(false);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const data = await apiFetch<AvailabilitySlotDto[]>("/api/availability/admin", { authenticated: true });
      setSlots(data.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : "Failed to load slots.");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    setBlockedError(null);
    try {
      const data = await apiFetch<BlockedSlotDto[]>("/api/blockedslots", { authenticated: true });
      setBlocked(data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
    } catch (err) {
      setBlockedError(err instanceof Error ? err.message : "Failed to load blocked periods.");
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
    loadBlocked();
  }, [loadSlots, loadBlocked]);

  async function deleteSlot(slot: AvailabilitySlotDto) {
    setDeletingSlot(true);
    try {
      await apiFetch(`/api/availability/${slot.id}`, { method: "DELETE", authenticated: true });
      setSlotToDelete(null);
      loadSlots();
    } catch { /* keep modal open */ } finally { setDeletingSlot(false); }
  }

  async function deleteBlocked(b: BlockedSlotDto) {
    setDeletingBlocked(true);
    try {
      await apiFetch(`/api/blockedslots/${b.id}`, { method: "DELETE", authenticated: true });
      setBlockedToDelete(null);
      loadBlocked();
    } catch { /* keep modal open */ } finally { setDeletingBlocked(false); }
  }

  const today = new Date().toISOString().slice(0, 10);
  const loading = tab === "slots" ? slotsLoading : blockedLoading;
  const error = tab === "slots" ? slotsError : blockedError;
  const reload = tab === "slots" ? loadSlots : loadBlocked;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Availability</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {slots.length} slot{slots.length !== 1 ? "s" : ""}
            {blocked.length > 0 && ` · ${blocked.length} blocked period${blocked.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <GlowButton
          variant="cyan"
          size="sm"
          onClick={() => tab === "slots" ? setSlotModal("new") : setBlockedModal("new")}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {tab === "slots" ? "Add Slot" : "Block Time"}
          </span>
        </GlowButton>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {(["slots", "blocked"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t === "slots" ? "Availability Slots" : "Blocked Periods"}
            {t === "slots" && slots.length > 0 && <span className="ml-2 text-xs opacity-60">{slots.length}</span>}
            {t === "blocked" && blocked.length > 0 && <span className="ml-2 text-xs opacity-60">{blocked.length}</span>}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={reload} className="text-xs text-red-400/70 hover:text-red-400 underline">
            Retry
          </button>
        </div>
      )}

      {/* ── Slots tab ── */}
      {tab === "slots" && (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01]">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-28 flex-shrink-0">Date</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex-1">Title</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-28 hidden md:block">Type</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-36 hidden lg:block">Time</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-16 text-center">Public</p>
            <div className="w-[60px]" />
          </div>

          {loading ? (
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-24 h-3 bg-white/[0.05] rounded" />
                  <div className="flex-1 h-3 bg-white/[0.05] rounded" />
                  <div className="hidden md:block w-20 h-5 bg-white/[0.04] rounded-full" />
                  <div className="hidden lg:block w-24 h-3 bg-white/[0.04] rounded" />
                  <div className="w-12 h-5 bg-white/[0.04] rounded-full" />
                </div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-white/35">No availability slots yet</p>
              <button
                onClick={() => setSlotModal("new")}
                className="text-xs text-neon-cyan/60 hover:text-neon-cyan underline"
              >
                Add your first slot
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {slots.map((slot) => {
                const isPast = slot.date < today;
                return (
                  <div
                    key={slot.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${isPast ? "opacity-50" : ""}`}
                  >
                    <p className="text-sm text-white/60 w-28 flex-shrink-0 tabular-nums">
                      {formatDateShort(slot.date)}
                    </p>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/90 truncate">{slot.title}</p>
                      {slot.notes && <p className="text-[11px] text-white/30 truncate">{slot.notes}</p>}
                    </div>
                    <div className="hidden md:block w-28 flex-shrink-0">
                      <SlotTypeBadge type={slot.type} />
                    </div>
                    <p className="hidden lg:block text-xs text-white/40 w-36 flex-shrink-0">
                      {slot.startTime
                        ? `${formatTime(slot.startTime)}${slot.endTime ? ` – ${formatTime(slot.endTime)}` : ""}`
                        : "—"}
                    </p>
                    <div className="w-16 flex-shrink-0 flex justify-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        slot.isPublic
                          ? "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan"
                          : "bg-white/[0.05] border-white/10 text-white/30"
                      }`}>
                        {slot.isPublic ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSlotModal(slot)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                        aria-label="Edit slot"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setSlotToDelete(slot)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete slot"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Blocked Periods tab ── */}
      {tab === "blocked" && (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01]">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex-1">Start</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex-1">End</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex-1 hidden md:block">Reason</p>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-16 text-center">Status</p>
            <div className="w-[60px]" />
          </div>

          {loading ? (
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="flex-1 h-3 bg-white/[0.05] rounded" />
                  <div className="flex-1 h-3 bg-white/[0.05] rounded" />
                  <div className="hidden md:block flex-1 h-3 bg-white/[0.04] rounded" />
                  <div className="w-12 h-5 bg-white/[0.04] rounded-full" />
                </div>
              ))}
            </div>
          ) : blocked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-sm text-white/35">No blocked periods</p>
              <button
                onClick={() => setBlockedModal("new")}
                className="text-xs text-neon-cyan/60 hover:text-neon-cyan underline"
              >
                Block a time period
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {blocked.map((b) => {
                const isPast = new Date(b.end) < new Date();
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${isPast ? "opacity-50" : ""}`}
                  >
                    <p className="text-sm text-white/75 flex-1 min-w-0 truncate tabular-nums">
                      {formatDateTime(b.start)}
                    </p>
                    <p className="text-sm text-white/75 flex-1 min-w-0 truncate tabular-nums">
                      {formatDateTime(b.end)}
                    </p>
                    <p className="hidden md:block text-sm text-white/40 flex-1 min-w-0 truncate">
                      {b.reason || "—"}
                    </p>
                    <div className="w-16 flex-shrink-0 flex justify-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        isPast
                          ? "bg-white/[0.05] border-white/10 text-white/30"
                          : "bg-red-500/10 border-red-500/25 text-red-400"
                      }`}>
                        {isPast ? "Past" : "Active"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setBlockedModal(b)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                        aria-label="Edit blocked period"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setBlockedToDelete(b)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete blocked period"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* ── Modals ── */}
      {slotModal !== null && (
        <SlotModal
          slot={slotModal === "new" ? null : slotModal}
          onClose={() => setSlotModal(null)}
          onSaved={() => { setSlotModal(null); loadSlots(); }}
        />
      )}
      {blockedModal !== null && (
        <BlockedModal
          blocked={blockedModal === "new" ? null : blockedModal}
          onClose={() => setBlockedModal(null)}
          onSaved={() => { setBlockedModal(null); loadBlocked(); }}
        />
      )}
      {slotToDelete && (
        <DeleteConfirm
          title="Delete Slot?"
          description={`This will permanently remove "${slotToDelete.title}" on ${formatDateShort(slotToDelete.date)}.`}
          onClose={() => setSlotToDelete(null)}
          onConfirm={() => deleteSlot(slotToDelete)}
          deleting={deletingSlot}
        />
      )}
      {blockedToDelete && (
        <DeleteConfirm
          title="Remove Blocked Period?"
          description={`"${blockedToDelete.reason || "Blocked"}" from ${formatDateTime(blockedToDelete.start)} to ${formatDateTime(blockedToDelete.end)} will be removed.`}
          onClose={() => setBlockedToDelete(null)}
          onConfirm={() => deleteBlocked(blockedToDelete)}
          deleting={deletingBlocked}
        />
      )}
    </div>
  );
}
