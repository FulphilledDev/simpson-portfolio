import { HTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Add a cyan glow on hover */
  hoverable?: boolean;
  /** Add a neon cyan border accent at the top */
  accent?: "cyan" | "purple" | "none";
  /** Internal padding preset */
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  none: "",
};

const accentMap = {
  cyan: "border-t-neon-cyan/40",
  purple: "border-t-neon-purple/40",
  none: "",
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, hoverable = false, accent = "none", padding = "md", children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          "glass rounded-xl",
          paddingMap[padding],
          hoverable && "glass-hover cursor-pointer",
          accent !== "none" && `border-t-2 ${accentMap[accent]}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
