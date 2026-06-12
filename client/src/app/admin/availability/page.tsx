"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";

// ── Types ──────────────────────────────────────────────────────────────────

interface WeeklyAvailabilityDto {
  id: number;
  dayOfWeek: number;
  startTime: string;  // "HH:mm:ss"
  endTime: string;
  isEnabled: boolean;
}

interface BlockedSlotDto {
  id: number;
  start: string;
  end: string;
  reason: string | null;
}

interface BlockedForm {
  start: string;
  end: string;
  reason: string;
}

const EMPTY_BLOCKED: BlockedForm = { start: "", end: "", reason: "" };

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Helpers ────────────────────────────────────────────────────────────────

function toTimeInput(t: string) { return t ? t.slice(0, 5) : ""; }

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function toDateTimeLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/20 focus:outline-none focus:border-neon-cyan/40 transition-colors";

// ── Field ──────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
        {label}{required && <span className="text-neon-cyan ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── BlockedModal ──────────────────────────────────────────────────────────

function BlockedModal({ blocked, onClose, onSaved }: {
  blocked: BlockedSlotDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = blocked !== null;
  const [form, setForm] = useState<BlockedForm>(
    blocked
      ? { start: toDateTimeLocalInput(blocked.start), end: toDateTimeLocalInput(blocked.end), reason: blocked.reason ?? "" }
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
        await apiFetch(`/api/blockedslots/${blocked.id}`, { method: "PUT", authenticated: true, body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/blockedslots", { method: "POST", authenticated: true, body: JSON.stringify(body) });
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">{isEdit ? "Edit Blocked Period" : "Block Time"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Start" required>
            <input type="datetime-local" value={form.start} onChange={(e) => set("start", e.target.value)} className={inputCls} />
          </Field>
          <Field label="End" required>
            <input type="datetime-local" value={form.end} onChange={(e) => set("end", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Reason">
            <input type="text" value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="e.g. Vacation, Holiday…" className={inputCls} />
          </Field>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <GlowButton type="button" variant="ghost" onClick={onClose}>Cancel</GlowButton>
            <GlowButton type="submit" variant="cyan" size="sm" loading={saving}>{isEdit ? "Save Changes" : "Block Period"}</GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── DeleteConfirm ─────────────────────────────────────────────────────────

function DeleteConfirm({ title, description, onClose, onConfirm, deleting }: {
  title: string; description: string; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative z-10 w-full max-w-md" accent="none">
        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-white/60 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <GlowButton variant="ghost" onClick={onClose}>Cancel</GlowButton>
          <GlowButton variant="purple" size="sm" loading={deleting} onClick={onConfirm}
            className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">
            Delete
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ── WeeklyScheduleEditor ─────────────────────────────────────────────────

interface DayRow {
  dayOfWeek: number;
  isEnabled: boolean;
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
  existingId: number | null;
}

function buildDefaultRows(schedule: WeeklyAvailabilityDto[]): DayRow[] {
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const existing = schedule.find((s) => s.dayOfWeek === dow);
    return {
      dayOfWeek: dow,
      isEnabled: existing?.isEnabled ?? false,
      startTime: existing ? toTimeInput(existing.startTime) : "09:00",
      endTime: existing ? toTimeInput(existing.endTime) : "17:00",
      existingId: existing?.id ?? null,
    };
  });
}

function WeeklyScheduleEditor({ schedule, onRefresh }: {
  schedule: WeeklyAvailabilityDto[];
  onRefresh: () => void;
}) {
  const [rows, setRows] = useState<DayRow[]>(() => buildDefaultRows(schedule));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setRows(buildDefaultRows(schedule));
    setSaved(false);
  }, [schedule]);

  function updateRow(idx: number, patch: Partial<DayRow>) {
    setSaved(false);
    setSaveError(null);
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  async function saveAll() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await Promise.all(
        rows.map((row) =>
          apiFetch("/api/availability", {
            method: "POST",
            authenticated: true,
            body: JSON.stringify({
              dayOfWeek: row.dayOfWeek,
              startTime: row.startTime + ":00",
              endTime: row.endTime + ":00",
              isEnabled: row.isEnabled,
            }),
          })
        )
      );
      setSaved(true);
      onRefresh();
    } catch {
      setSaveError("Failed to save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard accent="none" padding="none">
      <div className="px-4 md:px-6 py-4 border-b border-white/[0.06]">
        <h2 className="text-base font-semibold text-white">Weekly Schedule</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Set your recurring availability. Clients can request any open slot within these windows.
        </p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((row, idx) => (
          <div key={row.dayOfWeek} className={`px-4 md:px-6 py-3.5 transition-colors ${!row.isEnabled ? "opacity-50" : ""}`}>
            {/* Line 1: toggle + day name */}
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => updateRow(idx, { isEnabled: !row.isEnabled })}
                className="flex-shrink-0"
                aria-label={`Toggle ${DAY_LABELS[row.dayOfWeek]}`}
              >
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  row.isEnabled ? "bg-neon-cyan/40 border border-neon-cyan/50" : "bg-white/[0.08] border border-white/[0.12]"
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                    row.isEnabled ? "translate-x-5 bg-neon-cyan" : "translate-x-0.5 bg-white/40"
                  }`} />
                </div>
              </button>
              <span className="text-sm font-semibold text-white/90">{DAY_LABELS[row.dayOfWeek]}</span>
            </div>

            {/* Line 2: time inputs indented under day name */}
            <div className="flex items-center gap-2 pl-[56px]">
              <input
                type="time"
                value={row.startTime}
                onChange={(e) => updateRow(idx, { startTime: e.target.value })}
                disabled={!row.isEnabled}
                className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-white/85 focus:outline-none focus:border-neon-cyan/40 transition-colors disabled:opacity-40 [color-scheme:dark]"
              />
              <span className="text-white/30 text-xs font-medium flex-shrink-0">to</span>
              <input
                type="time"
                value={row.endTime}
                onChange={(e) => updateRow(idx, { endTime: e.target.value })}
                disabled={!row.isEnabled}
                className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2.5 text-sm text-white/85 focus:outline-none focus:border-neon-cyan/40 transition-colors disabled:opacity-40 [color-scheme:dark]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Single save footer */}
      <div className="px-4 md:px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
        {saved && (
          <span className="text-sm text-neon-cyan/80">✓ Schedule saved</span>
        )}
        {saveError && (
          <span className="text-sm text-red-400">{saveError}</span>
        )}
        {!saved && !saveError && <span />}
        <GlowButton variant="cyan" size="sm" loading={saving} onClick={saveAll}>
          Save Schedule
        </GlowButton>
      </div>
    </GlassCard>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = "schedule" | "blocked";

export default function AvailabilityPage() {
  const [tab, setTab] = useState<Tab>("schedule");

  const [schedule, setSchedule] = useState<WeeklyAvailabilityDto[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [blocked, setBlocked] = useState<BlockedSlotDto[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [blockedModal, setBlockedModal] = useState<BlockedSlotDto | null | "new">(null);
  const [blockedToDelete, setBlockedToDelete] = useState<BlockedSlotDto | null>(null);
  const [deletingBlocked, setDeletingBlocked] = useState(false);

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const data = await apiFetch<WeeklyAvailabilityDto[]>("/api/availability/schedule");
      setSchedule(data);
    } catch { /* ignore */ } finally { setScheduleLoading(false); }
  }, []);

  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    setBlockedError(null);
    try {
      const data = await apiFetch<BlockedSlotDto[]>("/api/blockedslots", { authenticated: true });
      setBlocked(data.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
    } catch (err) {
      setBlockedError(err instanceof Error ? err.message : "Failed to load blocked periods.");
    } finally { setBlockedLoading(false); }
  }, []);

  useEffect(() => { loadSchedule(); loadBlocked(); }, [loadSchedule, loadBlocked]);

  async function deleteBlocked(b: BlockedSlotDto) {
    setDeletingBlocked(true);
    try {
      await apiFetch(`/api/blockedslots/${b.id}`, { method: "DELETE", authenticated: true });
      setBlockedToDelete(null);
      loadBlocked();
    } catch { /* keep modal open */ } finally { setDeletingBlocked(false); }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Availability</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Manage your weekly schedule and block specific periods.
          </p>
        </div>
        {tab === "blocked" && (
          <GlowButton variant="cyan" size="sm" onClick={() => setBlockedModal("new")}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Block Time
            </span>
          </GlowButton>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-full md:w-fit">
        {(["schedule", "blocked"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
              tab === t
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {t === "schedule" ? "Weekly Schedule" : "Blocked Periods"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "schedule" && (
        scheduleLoading ? (
          <GlassCard accent="none" padding="lg">
            <p className="text-white/40 text-sm">Loading schedule…</p>
          </GlassCard>
        ) : (
          <WeeklyScheduleEditor schedule={schedule} onRefresh={loadSchedule} />
        )
      )}

      {tab === "blocked" && (
        blockedLoading ? (
          <GlassCard accent="none" padding="lg">
            <p className="text-white/40 text-sm">Loading blocked periods…</p>
          </GlassCard>
        ) : blockedError ? (
          <GlassCard accent="none" padding="lg">
            <p className="text-red-400 text-sm">{blockedError}</p>
            <GlowButton variant="ghost" size="sm" onClick={loadBlocked} className="mt-3">Retry</GlowButton>
          </GlassCard>
        ) : blocked.length === 0 ? (
          <GlassCard accent="none" padding="lg">
            <p className="text-white/40 text-sm">No blocked periods. Click &quot;Block Time&quot; to restrict specific dates.</p>
          </GlassCard>
        ) : (
          <GlassCard accent="none" padding="none">
            <div className="divide-y divide-white/[0.04]">
              {blocked.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 px-4 md:px-6 py-3.5">
                  <div className="space-y-1 min-w-0">
                    <div className="space-y-0.5">
                      <p className="text-sm text-white/85">{formatDateTime(b.start)}</p>
                      <p className="text-sm text-white/50">→ {formatDateTime(b.end)}</p>
                    </div>
                    {b.reason && <p className="text-xs text-white/40 italic">{b.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setBlockedModal(b)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setBlockedToDelete(b)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )
      )}

      {/* Blocked Modal */}
      {blockedModal !== null && (
        <BlockedModal
          blocked={blockedModal === "new" ? null : blockedModal}
          onClose={() => setBlockedModal(null)}
          onSaved={() => { setBlockedModal(null); loadBlocked(); }}
        />
      )}

      {/* Delete Confirm */}
      {blockedToDelete && (
        <DeleteConfirm
          title="Remove Blocked Period"
          description={`This will unblock the period starting ${formatDateTime(blockedToDelete.start)}.`}
          onClose={() => setBlockedToDelete(null)}
          onConfirm={() => deleteBlocked(blockedToDelete)}
          deleting={deletingBlocked}
        />
      )}
    </div>
  );
}