"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactListItem {
  id: number;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
  appointmentRequestId: number | null;
  projectCount: number;
  reviewCount: number;
}

interface ContactDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  appointmentRequestId: number | null;
  projectCount: number;
  reviewCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// ── Contact list row ───────────────────────────────────────────────────────

function ContactRow({
  contact,
  isSelected,
  onClick,
}: {
  contact: ContactListItem;
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
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/[0.08] flex items-center justify-center">
          <span className="text-[11px] font-semibold text-white/60">{getInitials(contact.name)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-white/90 truncate">{contact.name}</span>
            {contact.appointmentRequestId && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-cyan/[0.08] border border-neon-cyan/20 text-neon-cyan/70 flex-shrink-0">
                appt
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/35 truncate">
            <span className="truncate">{contact.email}</span>
            {contact.company && (
              <>
                <span className="text-white/15">·</span>
                <span className="truncate">{contact.company}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[11px] text-white/25">{formatDate(contact.createdAt)}</span>
          {contact.projectCount > 0 && (
            <span className="text-[10px] text-white/40">
              {contact.projectCount} project{contact.projectCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Detail / Edit panel ────────────────────────────────────────────────────

function ContactDetailPanel({
  contactId,
  onUpdated,
  onDeleted,
  onBack,
}: {
  contactId: number;
  onUpdated: (c: ContactListItem) => void;
  onDeleted: (id: number) => void;
  onBack?: () => void;
}) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setLoading(true);
    setEditing(false);
    setError(null);
    setConfirmDelete(false);
    apiFetch<ContactDetail>(`/api/contacts/${contactId}`, { authenticated: true })
      .then((c) => {
        setContact(c);
        setName(c.name);
        setEmail(c.email);
        setPhone(c.phone ?? "");
        setCompany(c.company ?? "");
        setNotes(c.notes ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [contactId]);

  async function handleSave() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<ContactDetail>(`/api/contacts/${contactId}`, {
        method: "PUT",
        authenticated: true,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          company: company.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      setContact(updated);
      setEditing(false);
      onUpdated({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        company: updated.company,
        createdAt: updated.createdAt,
        appointmentRequestId: updated.appointmentRequestId,
        projectCount: updated.projectCount,
        reviewCount: updated.reviewCount,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
        authenticated: true,
      });
      onDeleted(contactId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/30">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!contact) return null;

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

        {/* Avatar */}
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-white/[0.08] flex items-center justify-center">
          <span className="text-sm font-semibold text-white/70">{getInitials(contact.name)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white/90 truncate">{contact.name}</h2>
          <p className="text-[12px] text-white/40 mt-0.5 truncate">{contact.email}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <button
              onClick={() => { setEditing(true); setError(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.10] text-white/50 hover:text-white/90 hover:border-white/20 transition-colors"
            >
              Edit
            </button>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/[0.06] transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/40">Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
              >
                {deleting ? "…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 py-5 space-y-5">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {editing ? (
          /* ── Edit form ── */
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Edit Contact</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Company</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-neon-cyan/30 transition-colors"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!name.trim() || !email.trim() || saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium btn-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </span>
                ) : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(contact.name);
                  setEmail(contact.email);
                  setPhone(contact.phone ?? "");
                  setCompany(contact.company ?? "");
                  setNotes(contact.notes ?? "");
                  setError(null);
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            {/* Info grid */}
            <div className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02] space-y-3">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Contact Info</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-sm text-neon-cyan/70 hover:text-neon-cyan transition-colors truncate block">
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Phone</p>
                    <p className="text-sm text-white/70">{contact.phone}</p>
                  </div>
                )}
                {contact.company && (
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Company</p>
                    <p className="text-sm text-white/70">{contact.company}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Added</p>
                  <p className="text-sm text-white/70">{formatDate(contact.createdAt)}</p>
                </div>
              </div>

              {contact.notes && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-white/[0.08] rounded-xl p-3 bg-white/[0.02] text-center">
                <p className="text-2xl font-bold text-white/80">{contact.projectCount}</p>
                <p className="text-[11px] text-white/35 mt-0.5">Project{contact.projectCount !== 1 ? "s" : ""}</p>
              </div>
              <div className="border border-white/[0.08] rounded-xl p-3 bg-white/[0.02] text-center">
                <p className="text-2xl font-bold text-white/80">{contact.reviewCount}</p>
                <p className="text-[11px] text-white/35 mt-0.5">Review{contact.reviewCount !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Source appointment link */}
            {contact.appointmentRequestId && (
              <div className="border border-neon-cyan/[0.12] rounded-xl p-4 bg-neon-cyan/[0.03]">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Source</p>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-neon-cyan/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-white/60">Saved from appointment request</p>
                  <Link
                    href="/admin/appointments"
                    className="ml-auto text-[11px] text-neon-cyan/60 hover:text-neon-cyan transition-colors underline underline-offset-2 flex-shrink-0"
                  >
                    View →
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Add Contact modal ──────────────────────────────────────────────────────

function AddContactModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: ContactListItem) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiFetch<ContactDetail>("/api/contacts", {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          company: company.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      onCreated({
        id: created.id,
        name: created.name,
        email: created.email,
        company: created.company,
        createdAt: created.createdAt,
        appointmentRequestId: created.appointmentRequestId,
        projectCount: created.projectCount,
        reviewCount: created.reviewCount,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0e0e1a] border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-base font-semibold text-white/90">New Contact</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Name *</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-neon-cyan/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-neon-cyan/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-neon-cyan/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-neon-cyan/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any internal notes…"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-neon-cyan/30 transition-colors"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !email.trim() || saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium btn-glow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating…
              </span>
            ) : "Create Contact"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const data = await apiFetch<ContactListItem[]>("/api/contacts", { authenticated: true });
      setContacts(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, [loadContacts]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false)
    );
  });

  // Sort by createdAt desc
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function handleSelect(id: number) {
    setSelectedId(id);
    setMobileView("detail");
  }

  function handleBack() {
    setMobileView("list");
  }

  function handleUpdated(updated: ContactListItem) {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleDeleted(id: number) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
    setMobileView("list");
  }

  function handleCreated(c: ContactListItem) {
    setContacts((prev) => [c, ...prev]);
    setSelectedId(c.id);
    setMobileView("detail");
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      {/* Page header */}
      <div className={`px-4 md:px-8 py-4 md:py-5 border-b border-white/[0.08] flex-shrink-0 ${
        mobileView === "detail" ? "hidden md:block" : ""
      }`}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white/90">Contacts</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40">
            {contacts.length}
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium btn-glow-cyan"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company…"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-neon-cyan/25 transition-colors"
          />
        </div>
      </div>

      {/* Two-pane body */}
      <div className="flex flex-1 min-h-0">
        {/* Left — list */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-white/[0.08] overflow-y-auto ${
            mobileView === "detail" ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-white/30">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading…</span>
              </div>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-8">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-white/30 mb-1">
                {search ? "No contacts match your search" : "No contacts yet"}
              </p>
              {!search && (
                <p className="text-[12px] text-white/20">
                  Add one manually or save a contact from an appointment.
                </p>
              )}
            </div>
          ) : (
            sorted.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                isSelected={c.id === selectedId}
                onClick={() => handleSelect(c.id)}
              />
            ))
          )}
        </div>

        {/* Right — detail */}
        <div
          className={`flex-1 min-w-0 ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          } flex-col`}
        >
          {selectedId ? (
            <ContactDetailPanel
              key={selectedId}
              contactId={selectedId}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onBack={handleBack}
            />
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-white/25">Select a contact to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add contact modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
