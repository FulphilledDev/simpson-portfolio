"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, resolveAssetUrl } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminSettingsDto {
  bio: string;
  skills: string[];
  contactEmail: string;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  twitterUrl: string | null;
  resumeUrl: string | null;
  profilePhotoUrl: string | null;
  ownerName: string;
  ownerTitle: string;
  appointmentDurationMinutes: number;
  companyName: string;
  companyLogoUrl: string | null;
}

interface ResumeVersionDto {
  id: number;
  fileName: string;
  url: string;
  uploadedAt: string;
  isActive: boolean;
}

interface GoogleCalendarStatusDto {
  isConnected: boolean;
  connectedEmail: string | null;
  calendarId: string | null;
  tokenExpiresAt: string | null;
  autoSync: boolean;
}

interface SettingsForm {
  ownerName: string;
  ownerTitle: string;
  bio: string;
  contactEmail: string;
  linkedInUrl: string;
  gitHubUrl: string;
  twitterUrl: string;
  skillInput: string;
  skills: string[];
  appointmentDurationMinutes: number;
  companyName: string;
}

const EMPTY_FORM: SettingsForm = {
  ownerName: "",
  ownerTitle: "",
  bio: "",
  contactEmail: "",
  linkedInUrl: "",
  gitHubUrl: "",
  twitterUrl: "",
  skillInput: "",
  skills: [],
  appointmentDurationMinutes: 30,
  companyName: "",
};

// ── Shared styles ──────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/20 focus:outline-none focus:border-neon-cyan/40 transition-colors";

// ── Field wrapper ──────────────────────────────────────────────────────────

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

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan flex-shrink-0">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-white/90">{title}</h2>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ── Skill Tag ──────────────────────────────────────────────────────────────

function SkillTag({
  skill,
  onRemove,
}: {
  skill: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
      {skill}
      <button
        type="button"
        onClick={onRemove}
        className="text-neon-cyan/60 hover:text-neon-cyan transition-colors leading-none"
        aria-label={`Remove ${skill}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ── Photo Upload ───────────────────────────────────────────────────────────

function ImageUploadSection({
  label,
  currentUrl,
  endpoint,
  fieldName,
  onUploaded,
  accept = "image/jpeg,image/png,image/webp",
  hint = "JPEG, PNG, or WebP · Max 5 MB",
  shape = "rounded-full",
}: {
  label: string;
  currentUrl: string | null;
  endpoint: string;
  fieldName: string;
  onUploaded: (url: string) => void;
  accept?: string;
  hint?: string;
  shape?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append(fieldName, file);
    try {
      const result = await apiFetch<Record<string, string>>(endpoint, {
        method: "POST",
        authenticated: true,
        body: fd,
      });
      const url = result.companyLogoUrl ?? result.profilePhotoUrl ?? "";
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className={`w-20 h-20 flex-shrink-0 overflow-hidden ring-2 ring-white/[0.08] ${shape}`}>
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={label} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        <GlowButton variant="outline-cyan" size="sm" loading={uploading} onClick={() => fileRef.current?.click()} type="button">
          {uploading ? "Uploading…" : "Change Image"}
        </GlowButton>
        <p className="text-[11px] text-white/30">{hint}</p>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function ProfilePhotoSection({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  return (
    <ImageUploadSection
      label="Profile photo"
      currentUrl={currentUrl}
      endpoint="/api/settings/photo"
      fieldName="photo"
      onUploaded={onUploaded}
      shape="rounded-full"
    />
  );
}

// ── Resume Manager Section ────────────────────────────────────────────────

function ResumeManagerSection() {
  const fileRef   = useRef<HTMLInputElement>(null);
  const apiUrl    = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

  const [versions,    setVersions]    = useState<ResumeVersionDto[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Email form state
  const [emailFormId,  setEmailFormId]  = useState<number | null>(null);
  const [emailTo,      setEmailTo]      = useState("");
  const [emailToName,  setEmailToName]  = useState("");
  const [sending,      setSending]      = useState(false);
  const [sendError,    setSendError]    = useState<string | null>(null);
  const [sentId,       setSentId]       = useState<number | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const data = await apiFetch<ResumeVersionDto[]>("/api/settings/resumes", { authenticated: true });
      setVersions(data);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setError("Only PDF, DOC, or DOCX files are accepted.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("File must be under 30 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("resume", file);
    try {
      await apiFetch("/api/settings/resumes", { method: "POST", authenticated: true, body: fd });
      await fetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleActivate(id: number) {
    try {
      await apiFetch(`/api/settings/resumes/${id}/activate`, { method: "PUT", authenticated: true });
      setVersions((vs) => vs.map((v) => ({ ...v, isActive: v.id === id })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate.");
    }
  }

  async function handleDelete(id: number, fileName: string) {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/settings/resumes/${id}`, { method: "DELETE", authenticated: true });
      setVersions((vs) => vs.filter((v) => v.id !== id));
      if (emailFormId === id) setEmailFormId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  function openEmailForm(id: number) {
    setEmailFormId(emailFormId === id ? null : id);
    setSendError(null);
    setSentId(null);
    setEmailTo("");
    setEmailToName("");
  }

  async function handleSendEmail(e: React.FormEvent, id: number) {
    e.preventDefault();
    if (!emailTo.trim()) { setSendError("Recipient email is required."); return; }
    setSending(true);
    setSendError(null);
    try {
      await apiFetch(`/api/settings/resumes/${id}/send`, {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({ toEmail: emailTo.trim(), toName: emailToName.trim() }),
      });
      setSentId(id);
      setEmailFormId(null);
      setEmailTo("");
      setEmailToName("");
      setTimeout(() => setSentId(null), 4000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  const hasVersions = versions.length > 0;

  return (
    <div className="space-y-3">
      {/* Upload zone — full when empty, compact row when files exist */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFile}
      />
      {hasVersions ? (
        /* Compact row */
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed transition-colors text-left
            ${uploading
              ? "border-neon-cyan/30 bg-neon-cyan/[0.03] cursor-wait"
              : "border-white/[0.10] hover:border-neon-cyan/40 hover:bg-neon-cyan/[0.03]"
            }`}
        >
          {uploading ? (
            <svg className="animate-spin w-4 h-4 text-neon-cyan/60 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          <span className="text-sm text-white/40">{uploading ? "Uploading…" : "Upload another version"}</span>
          <span className="ml-auto text-[11px] text-white/20">PDF, DOC, DOCX · 30 MB</span>
        </button>
      ) : (
        /* Full drop zone when no files yet */
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !uploading && fileRef.current?.click()}
          className={`relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer
            ${uploading
              ? "border-neon-cyan/30 bg-neon-cyan/[0.03] cursor-wait"
              : "border-white/[0.10] hover:border-neon-cyan/40 hover:bg-neon-cyan/[0.02]"
            }`}
        >
          {uploading ? (
            <svg className="animate-spin w-7 h-7 text-neon-cyan/60" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <div className="p-3 rounded-full bg-white/[0.04] transition-colors">
              <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white/60">
              {uploading ? "Uploading…" : "Click to upload resume"}
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">PDF, DOC, or DOCX · Max 30 MB</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 px-1">{error}</p>}

      {/* Versions list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/40">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading versions…
        </div>
      ) : versions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <svg className="w-8 h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-white/30">No resumes uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="rounded-xl overflow-hidden">
              {/* Row */}
              <div className={`flex items-center gap-3 p-3 border transition-colors ${
                v.isActive
                  ? "bg-neon-cyan/[0.06] border-neon-cyan/30"
                  : "bg-white/[0.02] border-white/[0.06]"
              } ${emailFormId === v.id ? "border-b-0 rounded-t-xl" : "rounded-xl"}`}>
                {/* File icon */}
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${v.isActive ? "bg-neon-cyan/10 text-neon-cyan" : "bg-white/[0.05] text-white/30"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/85 truncate">{v.fileName}</p>
                  <p className="text-[11px] text-white/35">
                    {new Date(v.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Sent success flash */}
                {sentId === v.id && (
                  <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 animate-pulse">
                    Sent ✓
                  </span>
                )}

                {/* Active badge */}
                {v.isActive && sentId !== v.id && (
                  <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                    Active
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {/* Download */}
                  <a
                    href={`${apiUrl}/api/settings/resumes/${v.id}/download`}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                    title="Download"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  {/* Email */}
                  <button
                    type="button"
                    onClick={() => openEmailForm(v.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      emailFormId === v.id
                        ? "text-neon-cyan bg-neon-cyan/[0.08]"
                        : "text-white/30 hover:text-neon-cyan hover:bg-neon-cyan/[0.06]"
                    }`}
                    title="Send by email"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {/* Activate */}
                  {!v.isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivate(v.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-neon-cyan hover:bg-neon-cyan/[0.08] transition-colors"
                      title="Set as active"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id, v.fileName)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Inline email form */}
              {emailFormId === v.id && (
                <form
                  onSubmit={(e) => handleSendEmail(e, v.id)}
                  className="px-3 py-3 bg-white/[0.02] border border-neon-cyan/20 border-t-0 rounded-b-xl space-y-2"
                >
                  <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Send &quot;{v.fileName}&quot; as attachment
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      required
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="Recipient email *"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={emailToName}
                      onChange={(e) => setEmailToName(e.target.value)}
                      placeholder="Recipient name (optional)"
                      className={inputCls}
                    />
                  </div>
                  {sendError && <p className="text-[11px] text-red-400">{sendError}</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <GlowButton type="submit" variant="cyan" size="sm" loading={sending}>
                      {sending ? "Sending…" : "Send Email"}
                    </GlowButton>
                    <GlowButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmailFormId(null)}
                    >
                      Cancel
                    </GlowButton>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Google Calendar Section ────────────────────────────────────────────────

function GoogleCalendarSection() {
  const [status, setStatus] = useState<GoogleCalendarStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [togglingSync, setTogglingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch<GoogleCalendarStatusDto>("/api/googlecalendar/status", {
        authenticated: true,
      });
      setStatus(data);
    } catch {
      // Not connected or error — treat as disconnected
      setStatus({ isConnected: false, connectedEmail: null, calendarId: null, tokenExpiresAt: null, autoSync: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Show success toast if redirected back from Google OAuth
    if (searchParams.get("gcal") === "connected") {
      // Status will auto-reflect connection
    }
  }, [fetchStatus, searchParams]);

  async function handleDisconnect() {
    if (!confirm("Disconnect Google Calendar? Slots won't auto-sync until you reconnect.")) return;
    setDisconnecting(true);
    setError(null);
    try {
      await apiFetch("/api/googlecalendar/disconnect", { method: "DELETE", authenticated: true });
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleAutoSync(enabled: boolean) {
    setTogglingSync(true);
    setError(null);
    try {
      await apiFetch("/api/googlecalendar/autosync", {
        method: "PATCH",
        authenticated: true,
        body: JSON.stringify(enabled),
      });
      setStatus((s) => s ? { ...s, autoSync: enabled } : s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update auto-sync.");
    } finally {
      setTogglingSync(false);
    }
  }

  function handleConnect() {
    const token = typeof window !== "undefined"
      ? (localStorage.getItem("phitdev_token") || sessionStorage.getItem("phitdev_token"))
      : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    // Redirect to API connect endpoint — API will redirect to Google OAuth
    window.location.href = `${apiUrl}/api/googlecalendar/connect${token ? `?access_token=${encodeURIComponent(token)}` : ""}`;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/40">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading calendar status…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status?.isConnected ? "bg-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.5)]" : "bg-white/20"}`} />
        <div className="flex-1">
          {status?.isConnected ? (
            <>
              <p className="text-sm font-medium text-white/85">Connected</p>
              <p className="text-[11px] text-white/40">
                {status.connectedEmail}
                {status.calendarId && ` · ${status.calendarId}`}
              </p>
              {status.tokenExpiresAt && (
                <p className="text-[11px] text-white/30 mt-0.5">
                  Token expires {new Date(status.tokenExpiresAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white/50">Not connected</p>
              <p className="text-[11px] text-white/30">Connect to sync availability slots with Google Calendar</p>
            </>
          )}
        </div>

        {status?.isConnected ? (
          <GlowButton
            variant="ghost"
            size="sm"
            loading={disconnecting}
            onClick={handleDisconnect}
            type="button"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm px-3 py-1.5 rounded-lg"
          >
            Disconnect
          </GlowButton>
        ) : (
          <GlowButton
            variant="outline-cyan"
            size="sm"
            onClick={handleConnect}
            type="button"
          >
            Connect
          </GlowButton>
        )}
      </div>

      {/* Auto-sync toggle */}
      {status?.isConnected && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-sm font-medium text-white/85">Auto-sync slots</p>
            <p className="text-[11px] text-white/40">Automatically sync availability slots to Google Calendar</p>
          </div>
          <button
            type="button"
            onClick={() => handleAutoSync(!status.autoSync)}
            disabled={togglingSync}
            className="flex-shrink-0 ml-4"
            aria-label="Toggle auto-sync"
          >
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              status.autoSync ? "bg-neon-cyan/40 border border-neon-cyan/50" : "bg-white/[0.08] border border-white/[0.12]"
            } ${togglingSync ? "opacity-50" : ""}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
                status.autoSync ? "translate-x-5 bg-neon-cyan" : "translate-x-0.5 bg-white/40"
              }`} />
            </div>
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 px-1">{error}</p>
      )}

      {searchParams.get("gcal") === "connected" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Google Calendar connected successfully!
        </div>
      )}
    </div>
  );
}

// ── About Section Manager ─────────────────────────────────────────────────

interface PrincipleItem { icon: string; name: string; description: string; }

interface AboutSectionData {
  header: string | null;
  principles: PrincipleItem[];
  aboutPhotoUrl: string | null;
}

interface AboutAssetItem {
  id: number;
  url: string;
  fileName: string;
  uploadedAt: string;
}

function AboutSectionManager({
  parentProfilePhotoUrl,
  onProfilePhotoChanged,
}: {
  parentProfilePhotoUrl: string | null;
  onProfilePhotoChanged: (url: string | null) => void;
}) {
  const [header,        setHeader]        = useState("");
  const [principles,    setPrinciples]    = useState<PrincipleItem[]>([]);
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState<string | null>(null);
  const [assets,        setAssets]        = useState<AboutAssetItem[]>([]);

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState<string | null>(null);
  const [activeAsset, setActiveAsset] = useState<number | null>(null);

  // Add / edit principle form
  const emptyPrinciple = { icon: "", name: "", description: "" };
  const [addForm,    setAddForm]    = useState<PrincipleItem>(emptyPrinciple);
  const [editIndex,  setEditIndex]  = useState<number | null>(null);

  const assetFileRef   = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [about, assetList] = await Promise.all([
        apiFetch<AboutSectionData>("/api/about"),
        apiFetch<AboutAssetItem[]>("/api/about/assets", { authenticated: true }),
      ]);
      setHeader(about.header ?? "");
      setPrinciples(about.principles ?? []);
      setAboutPhotoUrl(about.aboutPhotoUrl ?? null);
      setAssets(assetList);
    } catch {
      setError("Failed to load about section.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await apiFetch<AboutSectionData>("/api/about", {
        method: "PUT",
        authenticated: true,
        body: JSON.stringify({ header: header.trim() || null, principles }),
      });
      setHeader(result.header ?? "");
      setPrinciples(result.principles ?? []);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function commitPrinciple() {
    if (!addForm.name.trim()) return;
    if (editIndex !== null) {
      setPrinciples((prev) => prev.map((p, i) => (i === editIndex ? { ...addForm } : p)));
      setEditIndex(null);
    } else {
      setPrinciples((prev) => [...prev, { ...addForm }]);
    }
    setAddForm(emptyPrinciple);
  }

  function startEdit(index: number) {
    setAddForm({ ...principles[index] });
    setEditIndex(index);
  }

  function cancelEdit() {
    setAddForm(emptyPrinciple);
    setEditIndex(null);
  }

  function removePrinciple(index: number) {
    setPrinciples((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) cancelEdit();
  }

  async function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadErr("File must be under 10 MB."); return; }
    setUploading(true);
    setUploadErr(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const asset = await apiFetch<AboutAssetItem>("/api/about/assets", {
        method: "POST",
        authenticated: true,
        body: fd,
      });
      setAssets((prev) => [asset, ...prev]);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (assetFileRef.current) assetFileRef.current.value = "";
    }
  }

  async function handleSetProfile(assetId: number, assetUrl: string) {
    try {
      await apiFetch(`/api/about/assets/${assetId}/set-profile`, { method: "PUT", authenticated: true });
      onProfilePhotoChanged(assetUrl);
      setActiveAsset(null);
    } catch { setError("Failed to set profile photo."); }
  }

  async function handleSetAbout(assetId: number, assetUrl: string) {
    try {
      await apiFetch(`/api/about/assets/${assetId}/set-about`, { method: "PUT", authenticated: true });
      setAboutPhotoUrl(assetUrl);
      setActiveAsset(null);
    } catch { setError("Failed to set about photo."); }
  }

  async function handleDeleteAsset(assetId: number) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    const deletedAsset = assets.find((a) => a.id === assetId);
    try {
      await apiFetch(`/api/about/assets/${assetId}`, { method: "DELETE", authenticated: true });
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      if (deletedAsset?.url === aboutPhotoUrl) setAboutPhotoUrl(null);
      if (deletedAsset?.url === parentProfilePhotoUrl) onProfilePhotoChanged(null);
      setActiveAsset(null);
    } catch { setError("Failed to delete asset."); }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/40 py-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header field */}
      <Field label="Section Headline" hint='Displayed as the "About Me" heading. Leave blank to use the default.'>
        <input
          type="text"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder='e.g. Forged in Challenge. Built for Results.'
          className={inputCls}
        />
      </Field>

      {/* Principles */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">
          Principles <span className="text-white/25 font-normal normal-case tracking-normal">({principles.length})</span>
        </label>

        {principles.length > 0 && (
          <div className="space-y-2">
            {principles.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-xl mt-0.5 flex-shrink-0 w-7 text-center">{p.icon || "·"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">{p.name}</p>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{p.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button type="button" onClick={() => startEdit(i)}
                    className="p-1.5 text-white/25 hover:text-neon-cyan transition-colors rounded" title="Edit">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => removePrinciple(i)}
                    className="p-1.5 text-white/25 hover:text-red-400 transition-colors rounded" title="Remove">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit form */}
        <div className="p-3 rounded-lg border border-neon-cyan/15 bg-neon-cyan/[0.02] space-y-3">
          <p className="text-[10px] font-semibold text-neon-cyan/50 uppercase tracking-widest">
            {editIndex !== null ? "Edit Principle" : "Add Principle"}
          </p>
          <div className="flex gap-2">
            <input type="text" value={addForm.icon}
              onChange={(e) => setAddForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="🎯" maxLength={4}
              className={`${inputCls} w-14 text-center text-lg px-1`} />
            <input type="text" value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Principle name"
              className={`${inputCls} flex-1`} />
          </div>
          <textarea value={addForm.description}
            onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description…" rows={2}
            className={`${inputCls} resize-none`} />
          <div className="flex gap-2 justify-end">
            {editIndex !== null && (
              <GlowButton type="button" variant="ghost" size="sm" onClick={cancelEdit}>Cancel</GlowButton>
            )}
            <GlowButton type="button" variant="outline-cyan" size="sm" onClick={commitPrinciple}>
              {editIndex !== null ? "Update" : "Add"}
            </GlowButton>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <GlowButton type="button" variant="cyan" size="sm" loading={saving} onClick={handleSave}>
          Save About Section
        </GlowButton>
        {saved && (
          <span className="text-sm text-neon-cyan flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      {/* Assets gallery */}
      <div className="space-y-3 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Photo Assets
          </label>
          <div>
            <input ref={assetFileRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={handleAssetUpload} />
            <GlowButton type="button" variant="outline-cyan" size="sm" loading={uploading}
              onClick={() => assetFileRef.current?.click()}>
              {uploading ? "Uploading…" : "Upload Image"}
            </GlowButton>
          </div>
        </div>
        {uploadErr && <p className="text-[11px] text-red-400">{uploadErr}</p>}
        <p className="text-[11px] text-white/25">
          Click any image to select it, then use the actions below to assign or delete it.
          JPEG, PNG, WebP · 10 MB max.
        </p>

        {assets.length === 0 ? (
          <p className="text-sm text-white/25 italic">No assets uploaded yet.</p>
        ) : (
          <>
            {/* Filmstrip — overflow-x-auto, so NO absolute children inside */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {assets.map((asset) => {
                const resolvedUrl = resolveAssetUrl(asset.url);
                const isProfile = asset.url === parentProfilePhotoUrl;
                const isAbout   = asset.url === aboutPhotoUrl;
                const isActive  = activeAsset === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setActiveAsset(isActive ? null : asset.id)}
                    className={`relative flex-none w-[140px] aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      isActive
                        ? "border-neon-cyan/70 ring-1 ring-neon-cyan/30"
                        : isProfile || isAbout
                        ? "border-white/20"
                        : "border-white/[0.06] hover:border-white/20"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolvedUrl} alt={asset.fileName} className="w-full h-full object-cover" />
                    {(isProfile || isAbout) && (
                      <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                        {isProfile && (
                          <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-neon-cyan text-background leading-none">Hero</span>
                        )}
                        {isAbout && (
                          <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-neon-purple text-white leading-none">About</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action panel — rendered OUTSIDE the overflow container */}
            {activeAsset !== null && (() => {
              const asset = assets.find((a) => a.id === activeAsset);
              if (!asset) return null;
              const resolvedUrl = resolveAssetUrl(asset.url);
              return (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-neon-cyan/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolvedUrl} alt={asset.fileName}
                    className="w-12 h-10 object-cover rounded-lg flex-shrink-0 border border-white/10" />
                  <p className="text-xs text-white/50 flex-1 truncate min-w-0">{asset.fileName}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" onClick={() => handleSetProfile(asset.id, asset.url)}
                      title="Set as Profile (Hero)"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0" />
                      Hero
                    </button>
                    <button type="button" onClick={() => handleSetAbout(asset.id, asset.url)}
                      title="Set as About Me photo"
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-neon-purple bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-purple flex-shrink-0" />
                      About
                    </button>
                    <button type="button" onClick={() => handleDeleteAsset(asset.id)}
                      title="Delete asset"
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/[0.08] border border-white/[0.06] hover:border-red-400/20 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load settings ────────────────────────────────────────────────────────

  useEffect(() => {
    apiFetch<AdminSettingsDto>("/api/settings")
      .then((data) => {
        setForm({
          ownerName: data.ownerName,
          ownerTitle: data.ownerTitle,
          bio: data.bio,
          contactEmail: data.contactEmail,
          linkedInUrl: data.linkedInUrl ?? "",
          gitHubUrl: data.gitHubUrl ?? "",
          twitterUrl: data.twitterUrl ?? "",
          skillInput: "",
          skills: Array.isArray(data.skills) ? data.skills : [],
          appointmentDurationMinutes: data.appointmentDurationMinutes ?? 30,
          companyName: data.companyName ?? "",
        });
        setProfilePhotoUrl(data.profilePhotoUrl ?? null);
        setCompanyLogoUrl(data.companyLogoUrl ?? null);
      })
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  // ── Form helpers ─────────────────────────────────────────────────────────

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    const skill = form.skillInput.trim();
    if (!skill || form.skills.includes(skill)) {
      set("skillInput", "");
      return;
    }
    setForm((f) => ({ ...f, skills: [...f.skills, skill], skillInput: "" }));
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerName.trim() || !form.contactEmail.trim()) {
      setError("Owner name and contact email are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        authenticated: true,
        body: JSON.stringify({
          ownerName: form.ownerName.trim(),
          ownerTitle: form.ownerTitle.trim(),
          bio: form.bio.trim(),
          contactEmail: form.contactEmail.trim(),
          linkedInUrl: form.linkedInUrl.trim() || null,
          gitHubUrl: form.gitHubUrl.trim() || null,
          twitterUrl: form.twitterUrl.trim() || null,
          skills: form.skills,
          appointmentDurationMinutes: form.appointmentDurationMinutes,
          companyName: form.companyName.trim(),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-white/40">
          <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white/90">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage your profile, skills, and integrations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Branding ─────────────────────────────────────────────────── */}
        <GlassCard accent="cyan" padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
            title="Branding"
            description="Company name and logo displayed in the navbar and admin sidebar."
          />

          <div className="space-y-5">
            <Field label="Company Logo">
              <ImageUploadSection
                label="Company logo"
                currentUrl={companyLogoUrl}
                endpoint="/api/settings/logo"
                fieldName="logo"
                onUploaded={(url) => setCompanyLogoUrl(url)}
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                hint="JPEG, PNG, WebP, or SVG · Max 5 MB"
                shape="rounded-xl"
              />
            </Field>

            <Field label="Company Name" required>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Simpson Software"
                className={inputCls}
              />
            </Field>
          </div>
        </GlassCard>

        {/* ── Profile ─────────────────────────────────────────────────── */}
        <GlassCard accent="cyan" padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Profile"
            description="Your public-facing identity shown on the portfolio."
          />

          <div className="space-y-5">
            {/* Photo */}
            <Field label="Profile Photo">
              <ProfilePhotoSection
                currentUrl={profilePhotoUrl}
                onUploaded={(url) => setProfilePhotoUrl(url)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                  placeholder="Philip Simpson"
                  className={inputCls}
                />
              </Field>
              <Field label="Title">
                <input
                  type="text"
                  value={form.ownerTitle}
                  onChange={(e) => set("ownerTitle", e.target.value)}
                  placeholder="Full-Stack Developer"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="A short description about you and your work…"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Contact Email" required>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="hello@example.com"
                className={inputCls}
              />
            </Field>

            <Field label="Appointment Duration (minutes)" hint="Default length used when booking a consultation (30 = half hour)">
              <input
                type="number"
                min={15}
                max={240}
                step={15}
                value={form.appointmentDurationMinutes}
                onChange={(e) => set("appointmentDurationMinutes", parseInt(e.target.value, 10) || 30)}
                className={inputCls}
              />
            </Field>
          </div>
        </GlassCard>

        {/* ── About Me ─────────────────────────────────────────────────── */}
        <GlassCard accent="cyan" padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="About Me"
            description="Headline, principles, and photos shown in the About Me section."
          />
          <AboutSectionManager
            parentProfilePhotoUrl={profilePhotoUrl}
            onProfilePhotoChanged={(url) => setProfilePhotoUrl(url)}
          />
        </GlassCard>

        {/* ── Social Links ─────────────────────────────────────────────── */}
        <GlassCard padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
            title="Social Links"
            description="Links shown in your portfolio footer and contact section."
          />

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="LinkedIn URL">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </span>
                  <input
                    type="url"
                    value={form.linkedInUrl}
                    onChange={(e) => set("linkedInUrl", e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <Field label="GitHub URL">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  </span>
                  <input
                    type="url"
                    value={form.gitHubUrl}
                    onChange={(e) => set("gitHubUrl", e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Twitter / X URL">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </span>
                  <input
                    type="url"
                    value={form.twitterUrl}
                    onChange={(e) => set("twitterUrl", e.target.value)}
                    placeholder="https://x.com/yourhandle"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>
          </div>
        </GlassCard>

        {/* ── Skills ──────────────────────────────────────────────────── */}
        <GlassCard accent="purple" padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="Skills"
            description="Technologies and tools shown on your portfolio."
          />

          <div className="space-y-4">
            {/* Tag input */}
            <Field label="Add Skill" hint="Press Enter or comma to add">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.skillInput}
                  onChange={(e) => set("skillInput", e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="e.g. React, .NET, PostgreSQL"
                  className={`${inputCls} flex-1`}
                />
                <GlowButton
                  type="button"
                  variant="outline-cyan"
                  size="sm"
                  onClick={addSkill}
                  className="flex-shrink-0"
                >
                  Add
                </GlowButton>
              </div>
            </Field>

            {/* Tags list */}
            {form.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <SkillTag
                    key={skill}
                    skill={skill}
                    onRemove={() => removeSkill(skill)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30 italic">No skills added yet.</p>
            )}
          </div>
        </GlassCard>

        {/* ── Resume ───────────────────────────────────────────────────── */}
        <GlassCard padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Resume"
            description="Upload versions and choose which one is publicly linked."
          />
          <ResumeManagerSection />
        </GlassCard>

        {/* ── Google Calendar ───────────────────────────────────────────── */}
        <GlassCard padding="lg">
          <SectionHeader
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Google Calendar"
            description="Sync your availability slots with Google Calendar."
          />
          <GoogleCalendarSection />
        </GlassCard>

        {/* ── Save bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 py-4 border-t border-white/[0.06] sticky bottom-0 bg-background/90 backdrop-blur-md -mx-1 px-1 rounded-b-xl">
          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
          {saved && !error && (
            <p className="text-sm text-neon-cyan flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Settings saved!
            </p>
          )}
          {!error && !saved && <span />}

          <GlowButton
            type="submit"
            variant="cyan"
            size="sm"
            loading={saving}
            className="ml-auto"
          >
            Save Changes
          </GlowButton>
        </div>

      </form>
    </div>
  );
}
