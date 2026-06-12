import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { ReactNode } from "react";

interface GlowLinkProps {
  href: string;
  variant?: "cyan" | "purple" | "outline-cyan" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
  external?: boolean;
}

const variantMap = {
  cyan: "btn-glow-cyan",
  purple: "btn-glow-purple",
  "outline-cyan": "btn-outline-cyan",
  ghost: "text-white/70 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-colors",
};

const sizeMap = {
  sm: "text-sm px-4 py-2",
  md: "text-base px-6 py-3",
  lg: "text-lg px-8 py-4",
};

export default function GlowLink({
  href,
  variant = "cyan",
  size = "md",
  className,
  children,
  external = false,
}: GlowLinkProps) {
  const classes = twMerge(
    variantMap[variant],
    variant !== "ghost" && variant !== "outline-cyan" && sizeMap[size],
    "inline-block",
    className
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
