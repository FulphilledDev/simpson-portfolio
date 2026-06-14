"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// ── Nav items ──────────────────────────────────────────────────────────────

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    exact: true,
  },
  {
    href: "/admin/appointments",
    label: "Appointments",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/contacts",
    label: "Contacts",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    href: "/admin/availability",
    label: "Availability",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Sidebar (needs useAuth, must be inside AuthProvider) ──────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5149";

function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [companyName, setCompanyName] = useState("Simpson Software");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.companyName) setCompanyName(data.companyName);
        if (data.companyLogoUrl) setCompanyLogoUrl(data.companyLogoUrl);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-[rgba(255,255,255,0.02)] border-r border-white/[0.08]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-1">
          {companyLogoUrl ? (
            <div className="relative w-7 h-7 flex-shrink-0">
              <Image
                src={companyLogoUrl}
                alt={companyName}
                fill
                className="object-contain"
                sizes="28px"
              />
            </div>
          ) : null}
          <span className="text-gradient-hero text-lg font-bold tracking-wide">{companyName}</span>
        </div>
        <p className="text-[11px] text-white/30 uppercase tracking-widest">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[0_0_12px_rgba(91,200,245,0.08)]"
                  : "text-white/50 hover:text-white/90 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        {user && (
          <div className="px-3 mb-3">
            <p className="text-xs font-medium text-white/70 truncate">{user.name}</p>
            <p className="text-[11px] text-white/35 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400/80 hover:bg-red-500/[0.06] border border-transparent hover:border-red-500/10 transition-all duration-200"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Mobile bottom navigation ──────────────────────────────────────────────

const primaryNavItems = navItems.filter((item) =>
  ["/admin", "/admin/appointments", "/admin/settings"].includes(item.href)
);

const moreNavItems = navItems.filter((item) =>
  !["/admin", "/admin/appointments", "/admin/settings"].includes(item.href)
);

function MobileBottomNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isMoreActive = moreNavItems.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <>
      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 flex md:hidden bg-surface/95 backdrop-blur-xl border-t border-white/[0.10]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2.5 gap-1.5 text-[11px] font-medium transition-colors duration-200 ${
                isActive ? "text-neon-cyan" : "text-white/45"
              }`}
            >
              <span className={`p-2 rounded-xl transition-all duration-200 ${isActive ? "bg-neon-cyan/10" : ""}`}>
                {item.icon}
              </span>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setSheetOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2.5 gap-1.5 text-[11px] font-medium transition-colors duration-200 ${
            isMoreActive ? "text-neon-cyan" : "text-white/45"
          }`}
        >
          <span className={`p-2 rounded-xl transition-all duration-200 ${isMoreActive ? "bg-neon-cyan/10" : ""}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </span>
          <span className="leading-none">More</span>
        </button>
      </nav>

      {/* More sheet backdrop */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* More sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[70] md:hidden transition-transform duration-300 ease-out ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="bg-surface border-t border-white/[0.12] rounded-t-2xl overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Sheet nav items */}
          <div className="px-4 py-3 space-y-1">
            {moreNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                      : "text-white/60 hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Divider + Sign Out */}
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] mt-1">
            <button
              onClick={() => { setSheetOpen(false); logout(); }}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium text-red-400/70 hover:bg-red-500/[0.07] border border-transparent hover:border-red-500/10 transition-all duration-200"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Inner layout (has access to AuthContext) ──────────────────────────────

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}

// ── Root admin layout (provides AuthContext) ──────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
