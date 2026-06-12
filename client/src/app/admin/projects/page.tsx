"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { apiFetch } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProjectDto {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  techStack: string[];
  liveUrl: string | null;
  gitHubUrl: string | null;
  thumbnailUrl: string;
  gifDemoUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  title: string;
  shortDescription: string;
  longDescription: string;
  techStackRaw: string; // comma-separated editing
  liveUrl: string;
  gitHubUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
  thumbnail: File | null;
  gifDemo: File | null;
}

const EMPTY_FORM: FormState = {
  title: "",
  shortDescription: "",
  longDescription: "",
  techStackRaw: "",
  liveUrl: "",
  gitHubUrl: "",
  isFeatured: false,
  isActive: true,
  sortOrder: "0",
  thumbnail: null,
  gifDemo: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function parseTechStack(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toFormState(p: ProjectDto): FormState {
  return {
    title: p.title,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription ?? "",
    techStackRaw: p.techStack.join(", "),
    liveUrl: p.liveUrl ?? "",
    gitHubUrl: p.gitHubUrl ?? "",
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    sortOrder: String(p.sortOrder),
    thumbnail: null,
    gifDemo: null,
  };
}

function buildFormData(form: FormState, isEdit: boolean): FormData {
  const fd = new FormData();
  fd.append("Title", form.title.trim());
  fd.append("ShortDescription", form.shortDescription.trim());
  if (form.longDescription.trim()) fd.append("LongDescription", form.longDescription.trim());
  const tags = parseTechStack(form.techStackRaw);
  tags.forEach((t) => fd.append("TechStack", t));
  if (form.liveUrl.trim()) fd.append("LiveUrl", form.liveUrl.trim());
  if (form.gitHubUrl.trim()) fd.append("GitHubUrl", form.gitHubUrl.trim());
  fd.append("IsFeatured", String(form.isFeatured));
  if (isEdit) fd.append("IsActive", String(form.isActive));
  fd.append("SortOrder", form.sortOrder || "0");
  if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
  if (form.gifDemo) fd.append("gifDemo", form.gifDemo);
  return fd;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Drag handle icon ───────────────────────────────────────────────────────

function DragHandleIcon({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <button
      className="cursor-grab touch-none text-white/20 hover:text-white/50 transition-colors px-1 py-1"
      onPointerDown={(e) => controls.start(e)}
      aria-label="Drag to reorder"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="7" cy="5" r="1.5" />
        <circle cx="13" cy="5" r="1.5" />
        <circle cx="7" cy="10" r="1.5" />
        <circle cx="13" cy="10" r="1.5" />
        <circle cx="7" cy="15" r="1.5" />
        <circle cx="13" cy="15" r="1.5" />
      </svg>
    </button>
  );
}

// ── Project row ────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectDto;
  onEdit: (p: ProjectDto) => void;
  onDelete: (p: ProjectDto) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={project}
      dragListener={false}
      dragControls={controls}
      className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
      style={{ listStyle: "none" }}
    >
      {/* ── Mobile card layout (< sm) ── */}
      <div className="sm:hidden flex flex-col">
        {/* Thumbnail — full width */}
        <div className="w-full aspect-video overflow-hidden bg-white/[0.05]">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10" />
          )}
        </div>

        {/* Info below thumbnail */}
        <div className="px-3 py-3 space-y-2">
          {/* Title row + drag handle + actions */}
          <div className="flex items-start gap-2">
            <DragHandleIcon controls={controls} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90 leading-snug">{project.title}</p>
              <p className="text-[11px] text-white/35 font-mono">/{project.slug}</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => onEdit(project)}
                className="p-2 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10 active:bg-neon-cyan/15 transition-colors"
                aria-label="Edit project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(project)}
                className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors"
                aria-label="Delete project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.isFeatured && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/25 text-amber-400">
                Featured
              </span>
            )}
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
              project.isActive
                ? "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan"
                : "bg-white/[0.05] border-white/10 text-white/30"
            }`}>
              {project.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Tech stack */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.techStack.slice(0, 5).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/55">
                  {t}
                </span>
              ))}
              {project.techStack.length > 5 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">
                  +{project.techStack.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Short description */}
          <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">
            {project.shortDescription}
          </p>

          {/* Updated date */}
          <p className="text-[10px] text-white/20">Updated {formatDate(project.updatedAt)}</p>
        </div>
      </div>

      {/* ── Desktop row layout (sm+) ── */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-3">
        <DragHandleIcon controls={controls} />

        {/* Thumbnail */}
        <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-white/[0.05]">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10" />
          )}
        </div>

        {/* Title + slug */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate">{project.title}</p>
          <p className="text-[11px] text-white/30 truncate">/{project.slug}</p>
        </div>

        {/* Tech stack pills */}
        <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
          {project.techStack.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/50">
              {t}
            </span>
          ))}
          {project.techStack.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30">
              +{project.techStack.length - 3}
            </span>
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {project.isFeatured && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/25 text-amber-400">
              Featured
            </span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
            project.isActive
              ? "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan"
              : "bg-white/[0.05] border-white/10 text-white/30"
          }`}>
            {project.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Sort order */}
        <span className="text-[11px] text-white/25 w-6 text-center flex-shrink-0">
          {project.sortOrder}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-lg text-white/40 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
            aria-label="Edit project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label="Delete project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

// ── Form field ─────────────────────────────────────────────────────────────

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

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/20 focus:outline-none focus:border-neon-cyan/40 transition-colors";

const textareaCls = inputCls + " resize-none";

// ── File input ─────────────────────────────────────────────────────────────

function FileInput({
  label,
  hint,
  accept,
  currentUrl,
  onChange,
}: {
  label: string;
  hint?: string;
  accept: string;
  currentUrl?: string | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        {displayUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt="preview"
            className="w-16 h-10 object-cover rounded border border-white/[0.08] flex-shrink-0"
          />
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] text-white/50 text-sm hover:border-neon-cyan/30 hover:text-neon-cyan/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {displayUrl ? "Replace file" : "Choose file"}
        </button>
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleChange} />
      </div>
    </Field>
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

// ── Project modal ──────────────────────────────────────────────────────────

function ProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectDto | null; // null = create
  onClose: () => void;
  onSaved: (p: ProjectDto) => void;
}) {
  const isEdit = project !== null;
  const [form, setForm] = useState<FormState>(isEdit ? toFormState(project) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.shortDescription.trim()) {
      setError("Title and short description are required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const fd = buildFormData(form, isEdit);
      const saved = await apiFetch<ProjectDto>(
        isEdit ? `/api/projects/${project.id}` : "/api/projects",
        {
          method: isEdit ? "PUT" : "POST",
          authenticated: true,
          body: fd,
        }
      );
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 glass flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Project" : "New Project"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <Field label="Title" required>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="My Awesome Project"
            />
          </Field>

          {/* Short description */}
          <Field label="Short Description" required>
            <textarea
              className={textareaCls}
              rows={2}
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One-line summary shown in the project grid…"
            />
          </Field>

          {/* Long description */}
          <Field label="Long Description" hint="Shown on the project detail page. Markdown not supported.">
            <textarea
              className={textareaCls}
              rows={4}
              value={form.longDescription}
              onChange={(e) => set("longDescription", e.target.value)}
              placeholder="Full description of the project…"
            />
          </Field>

          {/* Tech stack */}
          <Field label="Tech Stack" hint="Comma-separated list, e.g. React, Node.js, PostgreSQL">
            <input
              className={inputCls}
              value={form.techStackRaw}
              onChange={(e) => set("techStackRaw", e.target.value)}
              placeholder="Next.js, TypeScript, Tailwind CSS"
            />
            {/* Preview pills */}
            {parseTechStack(form.techStackRaw).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parseTechStack(form.techStackRaw).map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Field>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Live URL">
              <input
                className={inputCls}
                type="url"
                value={form.liveUrl}
                onChange={(e) => set("liveUrl", e.target.value)}
                placeholder="https://example.com"
              />
            </Field>
            <Field label="GitHub URL">
              <input
                className={inputCls}
                type="url"
                value={form.gitHubUrl}
                onChange={(e) => set("gitHubUrl", e.target.value)}
                placeholder="https://github.com/user/repo"
              />
            </Field>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <Toggle
              label="Featured"
              checked={form.isFeatured}
              onChange={(v) => set("isFeatured", v)}
            />
            {isEdit && (
              <Toggle
                label="Active"
                checked={form.isActive}
                onChange={(v) => set("isActive", v)}
              />
            )}
          </div>

          {/* Sort order */}
          <Field label="Sort Order" hint="Lower numbers appear first">
            <input
              className={inputCls + " w-24"}
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </Field>

          {/* Files */}
          <div className="space-y-4 pt-1 border-t border-white/[0.06]">
            <FileInput
              label="Thumbnail"
              hint={isEdit ? "Leave empty to keep existing image" : "PNG/JPG/WebP recommended"}
              accept="image/*"
              currentUrl={isEdit ? project.thumbnailUrl : null}
              onChange={(f) => set("thumbnail", f)}
            />
            <FileInput
              label="GIF Demo"
              hint={isEdit ? "Leave empty to keep existing GIF" : "Animated GIF for demo preview"}
              accept="image/gif,video/*"
              currentUrl={isEdit ? project.gifDemoUrl : null}
              onChange={(f) => set("gifDemo", f)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <GlowButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </GlowButton>
            <GlowButton type="submit" variant="cyan" size="sm" loading={saving}>
              {isEdit ? "Save Changes" : "Create Project"}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm ─────────────────────────────────────────────────────────

function DeleteConfirm({
  project,
  onClose,
  onDeleted,
}: {
  project: ProjectDto;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        authenticated: true,
      });
      onDeleted(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative z-10 w-full max-w-md" accent="none">
        <h2 className="text-lg font-semibold text-white mb-2">Delete Project?</h2>
        <p className="text-sm text-white/60 mb-1">
          This will soft-delete{" "}
          <span className="text-white/85 font-medium">{project.title}</span>.
        </p>
        <p className="text-xs text-white/35 mb-6">The project will be hidden from the public site.</p>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <GlowButton variant="ghost" onClick={onClose}>
            Cancel
          </GlowButton>
          <GlowButton
            variant="purple"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
            className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
          >
            Delete
          </GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [editTarget, setEditTarget] = useState<ProjectDto | null | undefined>(undefined); // undefined=closed, null=create, ProjectDto=edit
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);

  // Reorder save state
  const [reordering, setReordering] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const originalOrder = useRef<ProjectDto[]>([]);

  // ── Load projects ────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ProjectDto[]>("/api/projects", {
        authenticated: true,
      });
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
      setProjects(sorted);
      originalOrder.current = sorted;
      setOrderChanged(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Drag reorder ─────────────────────────────────────────────────────────

  function handleReorder(newOrder: ProjectDto[]) {
    setProjects(newOrder);
    const changed = newOrder.some((p, i) => p.id !== originalOrder.current[i]?.id);
    setOrderChanged(changed);
  }

  async function saveOrder() {
    setReordering(true);
    try {
      const payload = projects.map((p, i) => ({ id: p.id, sortOrder: i }));
      await apiFetch("/api/projects/reorder", {
        method: "PUT",
        authenticated: true,
        body: JSON.stringify(payload),
      });
      // Update local sort orders
      const updated = projects.map((p, i) => ({ ...p, sortOrder: i }));
      setProjects(updated);
      originalOrder.current = updated;
      setOrderChanged(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setReordering(false);
    }
  }

  function cancelReorder() {
    setProjects([...originalOrder.current]);
    setOrderChanged(false);
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  function handleSaved(saved: ProjectDto) {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    originalOrder.current = projects;
    setEditTarget(undefined);
  }

  function handleDeleted(id: number) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
            {projects.filter((p) => p.isActive).length !== projects.length &&
              ` · ${projects.filter((p) => p.isActive).length} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orderChanged && (
            <>
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={cancelReorder}
                disabled={reordering}
              >
                Cancel
              </GlowButton>
              <GlowButton
                variant="cyan"
                size="sm"
                loading={reordering}
                onClick={saveOrder}
              >
                Save Order
              </GlowButton>
            </>
          )}
          <GlowButton
            variant="cyan"
            size="sm"
            onClick={() => setEditTarget(null)}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </span>
          </GlowButton>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={load} className="text-xs text-red-400/70 hover:text-red-400 underline">
            Retry
          </button>
        </div>
      )}

      {/* Drag hint */}
      {!loading && projects.length > 0 && (
        <p className="text-[11px] text-white/20">
          Drag rows to reorder, then click &ldquo;Save Order&rdquo; to persist.
        </p>
      )}

      {/* Table */}
      <GlassCard padding="none" className="overflow-hidden">
        {/* Column headers */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="w-5 flex-shrink-0" /> {/* drag handle */}
          <div className="w-12 flex-shrink-0" /> {/* thumbnail */}
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider flex-1">
            Title
          </p>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-[200px] hidden md:block">
            Tech Stack
          </p>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-[110px]">
            Status
          </p>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider w-6 text-center hidden sm:block">
            #
          </p>
          <div className="w-[60px]" /> {/* actions */}
        </div>

        {loading ? (
          // Skeleton
          <div className="divide-y divide-white/[0.04]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-4 h-4 rounded bg-white/[0.05]" />
                <div className="w-12 h-8 rounded bg-white/[0.05]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/[0.05] rounded w-1/3" />
                  <div className="h-2.5 bg-white/[0.04] rounded w-1/4" />
                </div>
                <div className="hidden md:flex gap-1">
                  <div className="h-5 w-14 bg-white/[0.04] rounded" />
                  <div className="h-5 w-14 bg-white/[0.04] rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="h-5 w-14 bg-white/[0.04] rounded-full" />
                  <div className="h-5 w-12 bg-white/[0.04] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
              <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <p className="text-sm text-white/35">No projects yet</p>
            <button
              onClick={() => setEditTarget(null)}
              className="text-xs text-neon-cyan/60 hover:text-neon-cyan underline"
            >
              Add your first project
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={projects}
            onReorder={handleReorder}
            className="divide-y divide-white/[0.04]"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                onEdit={(proj) => setEditTarget(proj)}
                onDelete={(proj) => setDeleteTarget(proj)}
              />
            ))}
          </Reorder.Group>
        )}
      </GlassCard>

      {/* Updated timestamps footer */}
      {!loading && projects.length > 0 && (
        <p className="text-[11px] text-white/20 text-right">
          Last updated {formatDate(projects.reduce((a, b) =>
            new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
          ).updatedAt)}
        </p>
      )}

      {/* Modals */}
      {editTarget !== undefined && (
        <ProjectModal
          project={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
