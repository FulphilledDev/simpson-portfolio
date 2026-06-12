"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
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
  resumeUrl: string;
  skillInput: string;
  skills: string[];
}

const EMPTY_FORM: SettingsForm = {
  ownerName: "",
  ownerTitle: "",
  bio: "",
  contactEmail: "",
  linkedInUrl: "",
  gitHubUrl: "",
  twitterUrl: "",
  resumeUrl: "",
  skillInput: "",
  skills: [],
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

function ProfilePhotoSection({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, or WebP accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);

    try {
      const result = await apiFetch<{ profilePhotoUrl: string }>("/api/settings/photo", {
        method: "POST",
        authenticated: true,
        body: fd,
      });
      onUploaded(result.profilePhotoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-white/[0.08]">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Profile photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Upload controls */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        <GlowButton
          variant="outline-cyan"
          size="sm"
          loading={uploading}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          {uploading ? "Uploading…" : "Change Photo"}
        </GlowButton>
        <p className="text-[11px] text-white/30">JPEG, PNG, or WebP · Max 5 MB</p>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>
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

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
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
          resumeUrl: data.resumeUrl ?? "",
          skillInput: "",
          skills: Array.isArray(data.skills) ? data.skills : [],
        });
        setProfilePhotoUrl(data.profilePhotoUrl ?? null);
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
          resumeUrl: form.resumeUrl.trim() || null,
          skills: form.skills,
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
                  placeholder="Phillip Simpson"
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

              <Field label="Resume URL">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <input
                    type="url"
                    value={form.resumeUrl}
                    onChange={(e) => set("resumeUrl", e.target.value)}
                    placeholder="https://example.com/resume.pdf"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>
          </div>
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
        <div className="flex items-center justify-between gap-4 py-4 border-t border-white/[0.06] sticky bottom-0 bg-[#0a0a0f]/80 backdrop-blur-md -mx-1 px-1 rounded-b-xl">
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
