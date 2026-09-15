import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean;
}

const base = "inline-flex items-center justify-center gap-2 font-label uppercase tracking-[0.15em] font-semibold border transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 " +
  "disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px";
const variants: Record<Variant, string> = {
  primary: "bg-accent border-accent text-paper hover:bg-accent-2 hover:border-accent-2",
  ghost: "bg-transparent border-line text-accent-2 hover:bg-paper-2 hover:border-accent-2",
  danger: "bg-transparent border-danger text-danger hover:bg-danger hover:text-paper",
};
const sizes: Record<Size, string> = { sm: "text-[9px] px-3 py-1.5", md: "text-[10px] px-4 py-2.5" };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <span className="inline-block size-3 border-2 border-current border-t-transparent animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
