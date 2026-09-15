import Link from "next/link";
import { cn } from "@/lib/cn";
import { ROOM_STATUS_COLOR } from "@/lib/constants";
import type { RoomRow } from "@/server/queries/dashboard";
import { MarkCleanButton } from "./mark-clean-button";

const STATUS_TEXT: Record<RoomRow["state"]["status"], string> = {
  VACANT: "text-status-vacant", OCCUPIED: "text-status-occupied", RESERVED: "text-status-reserved", OUT_OF_ORDER: "text-status-ooo",
};
const STATUS_LABEL: Record<RoomRow["state"]["status"], string> = { VACANT: "Vacant", OCCUPIED: "Occupied", RESERVED: "Reserved", OUT_OF_ORDER: "Out of Order" };

export function RoomCard({ room, date }: { room: RoomRow; date: string }) {
  const { state, reservation } = room;
  const href = reservation ? `/fo/reservations/${reservation.id}` : state.status === "VACANT" ? `/fo/reservations/new?roomId=${room.id}&date=${date}` : "/fo/out-of-order";
  const showMarkClean = state.isDirty && state.status === "VACANT";
  return (
    // The card is a plain box; the Link covers the info area and the Mark clean button (when shown)
    // gets its own row underneath, so the two interactive elements never overlap or nest.
    <div className="relative flex flex-col min-h-[74px] border border-line bg-paper hover:border-accent-2 focus-within:border-accent-2">
      <span className={cn("absolute left-0 top-0 bottom-0 w-[3px]", ROOM_STATUS_COLOR[state.status])} aria-hidden />
      <Link href={href} className="flex flex-1 flex-col justify-between gap-2 p-2.5 pl-3.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
        <div>
          <div className="display text-base leading-tight">{room.number}</div>
          <div className="text-[10px] text-muted">{room.typeName}</div>
        </div>
        <div className="flex items-end justify-between gap-1">
          {reservation ? <span className="text-[11px] truncate">{reservation.guestName}</span>
            : <span className={cn("label text-[8px] whitespace-nowrap", showMarkClean ? "text-status-dirty" : STATUS_TEXT[state.status])}>
                {showMarkClean ? "Vacant · Dirty" : STATUS_LABEL[state.status]}
              </span>}
          <span className="flex gap-1 items-center">
            {state.isDueOut && <span className="label text-[8px] text-status-reserved">Due out</span>}
            {state.isDirty && !showMarkClean && <span className="label text-[8px] text-status-dirty">Dirty</span>}
          </span>
        </div>
      </Link>
      {showMarkClean && (
        <div className="px-2.5 pb-2.5 pl-3.5">
          <MarkCleanButton roomId={room.id} className="w-full" />
        </div>
      )}
    </div>
  );
}
