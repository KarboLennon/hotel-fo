"use client";
import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function Dialog({ open, onOpenChange, title, children, width = "max-w-lg" }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; width?: string;
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 bg-ink/40 z-40" />
        <RD.Content className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] ${width} bg-paper border border-line focus:outline-none`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <RD.Title className="display text-lg">{title}</RD.Title>
            <RD.Close className="text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" aria-label="Close"><X size={16} /></RD.Close>
          </div>
          <div className="p-4">{children}</div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
