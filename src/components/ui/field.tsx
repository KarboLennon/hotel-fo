import * as React from "react";
import { cn } from "@/lib/cn";

export function Field({ label, htmlFor, error, hint, className, children }: {
  label: string; htmlFor?: string; error?: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-[11px] text-muted">{label}</label>
      {children}
      {error ? <p className="text-[11px] text-danger" role="alert">{error}</p> : hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
