"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GlowButton from "@/components/ui/GlowButton";
import { apiFetch } from "@/lib/api";

type ProjectType = "WebApp" | "API" | "MobileApp" | "Consultation" | "Other";

interface WeeklyAvailabilityDto {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

interface DayAvailabilityDto {
  isAvailable: boolean;
  availableStartTimes: string[];
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  projectType: ProjectType | "";
  budget: string;
  message: string;
  requestedDate: string;
  requestedTime: string;
}

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "WebApp", label: "Web Application" },
  { value: "API", label: "API / Backend Service" },
  { value: "MobileApp", label: "Mobile App" },
  { value: "Consultation", label: "General Consultation" },
  { value: "Other", label: "Other" },
];

const BUDGET_OPTIONS = [
  "Under $1,000",
  "$1,000 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000+",
  "Not sure yet",
];

const PROJECT_TYPE_ENUM_MAP: Record<ProjectType, number> = {
  WebApp: 0, API: 1, MobileApp: 2, Consultation: 3, Other: 4,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTimeDisplay(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookPage() {
  const [form, setForm] = useState<BookingForm>({
    name: "", email: "", phone: "", projectType: "", budget: "", message: "",
    requestedDate: "", requestedTime: "",
  });

  const [schedule, setSchedule] = useState<WeeklyAvailabilityDto[]>([]);
  const [daySlots, setDaySlots] = useState<DayAvailabilityDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<WeeklyAvailabilityDto[]>("/api/availability/schedule")
      .then((data) => setSchedule(data.filter((d) => d.isEnabled)))
      .catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value;
    setForm((prev) => ({ ...prev, requestedDate: date, requestedTime: "" }));
    setDaySlots(null);
    setError(null);
    if (!date) return;
    setLoadingSlots(true);
    try {
      const data = await apiFetch<DayAvailabilityDto>(`/api/availability/slots?date=${date}`);
      setDaySlots(data);
    } catch {
      setDaySlots({ isAvailable: false, availableStartTimes: [] });
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectType) { setError("Please select a project type."); return; }
    if (!form.requestedDate) { setError("Please select a preferred date."); return; }
    if (!form.requestedTime) { setError("Please select a preferred time."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          projectType: PROJECT_TYPE_ENUM_MAP[form.projectType as ProjectType],
          budget: form.budget || null,
          message: form.message.trim(),
          requestedDate: form.requestedDate,
          requestedTime: form.requestedTime + ":00",
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const enabledDays = schedule.length > 0
    ? schedule.map((s) => DAY_NAMES[s.dayOfWeek]).join(", ")
    : null;

  if (submitted) {
    return (
      <main className="bg-background min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.3)" }}>
            <svg className="w-10 h-10 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <GlassCard accent="cyan" padding="lg" className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Request Received!</h1>
            <p className="text-white/60 leading-relaxed">
              Thanks for reaching out. I&apos;ll review your request and get back to you within 1–2 business days.
              Check your inbox — you&apos;ll receive a confirmation shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/projects">
                <GlowButton variant="outline-cyan" className="w-full sm:w-auto">View My Work</GlowButton>
              </Link>
              <Link href="/">
                <GlowButton variant="ghost" className="w-full sm:w-auto">Back to Home</GlowButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="text-neon-cyan/70 text-sm uppercase tracking-widest font-medium">
            Let&apos;s Work Together
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Book a{" "}
            <span className="text-gradient-hero">Consultation</span>
          </h1>
          <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
            Tell me about your project and pick a time that works for you.
          </p>
          {enabledDays && (
            <p className="text-white/30 text-sm">Available: {enabledDays}</p>
          )}
        </div>

        <GlassCard accent="cyan" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-white/70">
                  Full Name <span className="text-neon-cyan">*</span>
                </label>
                <input id="name" name="name" type="text" required autoComplete="name"
                  value={form.name} onChange={handleChange} placeholder="Jane Smith"
                  className="form-input w-full" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-white/70">
                  Email Address <span className="text-neon-cyan">*</span>
                </label>
                <input id="email" name="email" type="email" required autoComplete="email"
                  value={form.email} onChange={handleChange} placeholder="jane@example.com"
                  className="form-input w-full" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-white/70">
                Phone <span className="text-white/30 font-normal">(optional)</span>
              </label>
              <input id="phone" name="phone" type="tel" autoComplete="tel"
                value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000"
                className="form-input w-full" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="projectType" className="block text-sm font-medium text-white/70">
                  Project Type <span className="text-neon-cyan">*</span>
                </label>
                <select id="projectType" name="projectType" required
                  value={form.projectType} onChange={handleChange} className="form-input w-full">
                  <option value="" disabled>Select a type…</option>
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="budget" className="block text-sm font-medium text-white/70">
                  Budget Range <span className="text-white/30 font-normal">(optional)</span>
                </label>
                <select id="budget" name="budget"
                  value={form.budget} onChange={handleChange} className="form-input w-full">
                  <option value="">Prefer not to say</option>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-white/70">
                Preferred Date &amp; Time <span className="text-neon-cyan">*</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="requestedDate" className="block text-xs text-white/40 uppercase tracking-wider">Date</label>
                  <input id="requestedDate" name="requestedDate" type="date"
                    min={todayStr()} value={form.requestedDate}
                    onChange={handleDateChange} className="form-input w-full" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="requestedTime" className="block text-xs text-white/40 uppercase tracking-wider">Time</label>
                  {loadingSlots ? (
                    <div className="form-input w-full text-white/30 text-sm">Loading times…</div>
                  ) : daySlots === null ? (
                    <div className="form-input w-full text-white/30 text-sm">Select a date first</div>
                  ) : !daySlots.isAvailable || daySlots.availableStartTimes.length === 0 ? (
                    <div className="rounded-lg px-3 py-2 text-sm text-amber-400/80 border border-amber-500/20 bg-amber-500/5">
                      No availability on this date. Please choose another day.
                    </div>
                  ) : (
                    <select id="requestedTime" name="requestedTime"
                      value={form.requestedTime} onChange={handleChange} className="form-input w-full">
                      <option value="" disabled>Select a time…</option>
                      {daySlots.availableStartTimes.map((t) => (
                        <option key={t} value={t}>{formatTimeDisplay(t)}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="block text-sm font-medium text-white/70">
                Tell Me About Your Project <span className="text-neon-cyan">*</span>
              </label>
              <textarea id="message" name="message" required rows={5}
                value={form.message} onChange={handleChange}
                placeholder="Describe what you need, your timeline, any relevant details…"
                className="form-input w-full resize-none" />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm text-red-400"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <GlowButton type="submit" variant="cyan" size="lg" loading={submitting} className="w-full">
              {submitting ? "Sending…" : "Send Request"}
            </GlowButton>

            <p className="text-center text-xs text-white/30">
              No spam. Your info is only used to respond to your inquiry.
            </p>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}