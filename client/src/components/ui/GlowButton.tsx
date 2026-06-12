import { ButtonHTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "purple" | "outline-cyan" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
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

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = "cyan", size = "md", loading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          variantMap[variant],
          // Only override size for non-ghost variants that don't already include padding
          variant !== "ghost" && variant !== "outline-cyan" && sizeMap[size],
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

GlowButton.displayName = "GlowButton";

export default GlowButton;
