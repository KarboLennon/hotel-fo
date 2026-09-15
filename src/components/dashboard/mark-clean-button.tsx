"use client";
import { useState, useTransition } from "react";
import { markRoomClean } from "@/server/actions/rooms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function MarkCleanButton({ roomId, className }: { roomId: string; className?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Button variant="ghost" size="sm" loading={pending} className={cn("px-2 py-1 text-[8px]", className)} title={error ?? undefined}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        start(async () => { const r = await markRoomClean(roomId); setError(r.ok ? null : r.message); });
      }}>
      <span className={error ? "text-danger" : undefined}>Mark clean</span>
    </Button>
  );
}
