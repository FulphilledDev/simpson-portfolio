"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";

// ── Types ──────────────────────────────────────────────────────────────────

interface AppointmentDto {
  id: number;
  name: string;
  email: string;
  projectType: number;
  status: number; // 0=Pending, 1=Accepted, 2=Denied
  submittedAt: string;
}

interface ReviewDto {
  id: number;
  submittedAt: string | null;
  isApproved: boolean;
  isPublished: boolean;
}

interface ProjectDto {
  id: number;
  isActive: boolean;
}

interface DashboardStats {
  pendingAppointments: number;
  pendingReviews: number;
  totalProjects: number;
  recentAppointments: AppointmentDto[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PROJECT_TYPE_LABELS: Record<number, string> = {
  0: "Web App",
  1: "API",
  2: "Mobile App",
  3: "Consultation",
  4: "Other",
};

function StatusBadge({ status }: { status: number }) {
  const map = {
    0: { label: "Pending", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    1: { label: "Accepted", cls: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20" },
    2: { label: "Denied", cls: "bg-red-500/15 text-red-400 border-red-500/25" },
  } as Record<number, { label: string; cls: string }>;

  const { label, cls } = map[status] ?? { label: "Unknown", cls: "bg-white/10 text-white/50 border-white/10" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | null;
  loading: boolean;
  accent: "cyan" | "purple" | "amber";
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

function StatCard({ label, value, loading, accent, icon, href, badge }: StatCardProps) {
  const accentStyles = {
    cyan: {
      icon: "bg-neon-cyan/10 text-neon-cyan",
      border: "border-t-neon-cyan/40",
      value: "text-neon-cyan",
      glow: "hover:shadow-[0_0_24px_rgba(0,245,255,0.08)]",
    },
    purple: {
      icon: "bg-neon-purple/10 text-neon-purple",
      border: "border-t-neon-purple/40",
      value: "text-neon-purple",
      glow: "hover:shadow-[0_0_24px_rgba(191,0,255,0.08)]",
    },
    amber: {
      icon: "bg-amber-500/10 text-amber-400",
      border: "border-t-amber-500/40",
      value: "text-amber-400",
      glow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.08)]",
    },
  };

  const s = accentStyles[accent];

  return (
    <Link href={href}>
      <GlassCard
        hoverable
        padding="lg"
        className={`border-t-2 ${s.border} ${s.glow} transition-all duration-300 group`}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg ${s.icon}`}>{icon}</div>
          {badge && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25`}>
              {badge}
            </span>
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <div className="h-9 w-16 bg-white/[0.06] rounded-md animate-pulse" />
          ) : (
            <p className={`text-4xl font-bold tabular-nums ${s.value}`}>{value ?? "—"}</p>
          )}
          <p className="mt-1 text-sm text-white/50 group-hover:text-white/70 transition-colors">{label}</p>
        </div>
      </GlassCard>
    </Link>
  );
}

// ── Skeleton rows ──────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3"><div className="h-4 bg-white/[0.06] rounded w-32 animate-pulse" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-white/[0.06] rounded w-44 animate-pulse" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-white/[0.06] rounded w-20 animate-pulse" /></td>
          <td className="px-4 py-3"><div className="h-5 bg-white/[0.06] rounded-full w-16 animate-pulse" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-white/[0.06] rounded w-24 animate-pulse" /></td>
        </tr>
      ))}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [appointments, reviews, projects] = await Promise.all([
          apiFetch<AppointmentDto[]>("/api/appointments", { authenticated: true }),
          apiFetch<ReviewDto[]>("/api/reviews/admin", { authenticated: true }),
          apiFetch<ProjectDto[]>("/api/projects"),
        ]);

        const recentAppointments = [...appointments]
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5);

        setStats({
          pendingAppointments: appointments.filter((a) => a.status === 0).length,
          pendingReviews: reviews.filter((r) => r.submittedAt !== null && !r.isPublished).length,
          totalProjects: projects.filter((p) => p.isActive).length,
          recentAppointments,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">Welcome back — here&rsquo;s what&rsquo;s happening.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatCard
          label="Pending Appointments"
          value={stats?.pendingAppointments ?? null}
          loading={loading}
          accent="amber"
          href="/admin/appointments"
          badge={!loading && stats && stats.pendingAppointments > 0 ? "Action needed" : undefined}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Reviews Awaiting Approval"
          value={stats?.pendingReviews ?? null}
          loading={loading}
          accent="purple"
          href="/admin/reviews"
          badge={!loading && stats && stats.pendingReviews > 0 ? "Review now" : undefined}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatCard
          label="Active Projects"
          value={stats?.totalProjects ?? null}
          loading={loading}
          accent="cyan"
          href="/admin/projects"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          }
        />
      </div>

      {/* Recent appointments */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white/80">Recent Appointments</h2>
          <Link
            href="/admin/appointments"
            className="text-xs text-neon-cyan/70 hover:text-neon-cyan transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-6 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-white/30 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <SkeletonRows />
              ) : stats && stats.recentAppointments.length > 0 ? (
                stats.recentAppointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-white/80 whitespace-nowrap">{appt.name}</td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">{appt.email}</td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                      {PROJECT_TYPE_LABELS[appt.projectType] ?? "Other"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3 text-white/40 whitespace-nowrap">{formatDate(appt.submittedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-white/25 text-sm">
                    No appointments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/projects"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl glass glass-hover text-sm font-medium text-white/60 hover:text-white/90 transition-all duration-200"
        >
          <span className="p-1.5 rounded-md bg-neon-cyan/10 text-neon-cyan">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          Add New Project
        </Link>
        <Link
          href="/admin/reviews"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl glass glass-hover text-sm font-medium text-white/60 hover:text-white/90 transition-all duration-200"
        >
          <span className="p-1.5 rounded-md bg-neon-purple/10 text-neon-purple">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          Request a Review
        </Link>
        <Link
          href="/admin/availability"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl glass glass-hover text-sm font-medium text-white/60 hover:text-white/90 transition-all duration-200"
        >
          <span className="p-1.5 rounded-md bg-white/10 text-white/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Manage Availability
        </Link>
      </div>
    </div>
  );
}
