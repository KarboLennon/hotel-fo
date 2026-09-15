import * as React from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: React.ReactNode }

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, ...props }, ref) => (
  <label className={cn("inline-flex items-center gap-2 text-[12px] cursor-pointer", props.disabled && "opacity-50 cursor-not-allowed", className)}>
    <input ref={ref} type="checkbox" className="size-3.5 accent-accent border border-line hover:border-muted disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-invalid:outline aria-invalid:outline-1 aria-invalid:outline-danger" {...props} />
    {label}
  </label>
));
Checkbox.displayName = "Checkbox";
