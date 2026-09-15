import * as React from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "w-full bg-paper border border-line px-2.5 py-1.5 text-[13px] text-ink placeholder:text-muted " +
  "hover:border-muted focus:outline-none focus:border-accent focus-visible:ring-1 focus-visible:ring-accent " +
  "disabled:bg-paper-2 disabled:text-muted aria-invalid:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClass, className)} {...props} />,
);
Input.displayName = "Input";
