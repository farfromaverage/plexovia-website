"use client";

import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────
   Plexovia Button — two variants
   primary  : gold pill, CSS hover only (no spring, no magnetic, no scale)
   ghost    : transparent, warm border, underline on hover
   Design ref: Stripe — clean, intentional, no physics effects on buttons
   Both: minimum 44px touch target for 35–55 audience
─────────────────────────────────────────────── */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const sizeClasses = {
    sm: "text-sm px-4 py-2.5 min-h-[40px]",
    md: "text-sm px-6 py-3 min-h-[44px]",
    lg: "text-base px-8 py-4 min-h-[52px]",
  };

  const variantClasses = {
    primary: "btn-gold",
    ghost:   "btn-ghost",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        "relative rounded-full font-medium tracking-wide",
        "inline-flex items-center justify-center gap-2",
        "cursor-pointer select-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────
   ButtonLink — renders <a> with all the same styling
   Use for navigation CTAs that aren't form submissions
────────────────────────────────────────────────────── */
interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const sizeClasses = {
    sm: "text-sm px-4 py-2.5 min-h-[40px]",
    md: "text-sm px-6 py-3 min-h-[44px]",
    lg: "text-base px-8 py-4 min-h-[52px]",
  };

  const variantClasses = {
    primary: "btn-gold",
    ghost:   "btn-ghost",
  };

  return (
    <a
      className={cn(
        "relative rounded-full font-medium tracking-wide",
        "inline-flex items-center justify-center gap-2",
        "cursor-pointer select-none no-underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
