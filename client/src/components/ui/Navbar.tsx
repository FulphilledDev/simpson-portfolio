"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavbarProps {
  companyName: string;
  companyLogoUrl?: string | null;
}

const links = [
  { href: "/", label: "Home", exact: true },
  { href: "/projects", label: "Projects" },
  { href: "/book", label: "Book a Call" },
];

export default function Navbar({ companyName, companyLogoUrl }: NavbarProps) {
  const pathname = usePathname();

  // Hide on all admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0 group"
          aria-label={companyName || "Home"}
        >
          {companyLogoUrl ? (
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src={companyLogoUrl}
                alt={companyName}
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center flex-shrink-0 border border-neon-cyan/20 group-hover:border-neon-cyan/50 transition-colors">
              <span className="text-xs font-black text-gradient-hero select-none leading-none">
                {companyName ? companyName[0] : "S"}
              </span>
            </div>
          )}
          <span className="text-sm font-bold text-white/85 group-hover:text-white transition-colors tracking-wide hidden sm:block">
            {companyName || "Simpson Software"}
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-neon-cyan bg-neon-cyan/[0.08] border border-neon-cyan/20"
                    : "text-white/50 hover:text-white/85 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
