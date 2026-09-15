"use client";
import { useTransition } from "react";
import { markRoomClean } from "@/server/actions/rooms";
import { Button } from "@/components/ui/button";

export function MarkCleanButton({ roomId }: { roomId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" loading={pending} className="px-2 py-1 text-[8px]"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); start(async () => { await markRoomClean(roomId); }); }}>
      Mark clean
    </Button>
  );
}
