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
  const href = reservation ? `/reservations/${reservation.id}` : state.status === "VACANT" ? `/reservations/new?roomId=${room.id}&date=${date}` : "/out-of-order";
  const showMarkClean = state.isDirty && state.status === "VACANT";
  return (
    <div className="relative">
      <Link href={href} className="relative flex flex-col justify-between min-h-[74px] border border-line bg-paper p-2.5 pl-3.5 hover:border-accent-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
        <span className={cn("absolute left-0 top-0 bottom-0 w-[3px]", ROOM_STATUS_COLOR[state.status])} aria-hidden />
        <div>
          <div className="display text-base leading-tight">{room.number}</div>
          <div className="text-[10px] text-muted">{room.typeName}</div>
        </div>
        {/* When the Mark clean button is shown (absolutely positioned bottom-right), reserve its width so text never sits under it. */}
        <div className={cn("flex items-end justify-between gap-1", showMarkClean && "pr-[84px]")}>
          {reservation ? <span className="text-[11px] truncate">{reservation.guestName}</span>
            : showMarkClean ? <span className="label text-[8px] text-status-dirty">Vacant · Dirty</span>
            : <span className={cn("label text-[8px]", STATUS_TEXT[state.status])}>{STATUS_LABEL[state.status]}</span>}
          <span className="flex gap-1 items-center">
            {state.isDueOut && <span className="label text-[8px] text-status-reserved">Due out</span>}
            {state.isDirty && !showMarkClean && <span className="label text-[8px] text-status-dirty">Dirty</span>}
          </span>
        </div>
      </Link>
      {showMarkClean && (
        <div className="absolute right-2 bottom-2">
          <MarkCleanButton roomId={room.id} />
        </div>
      )}
    </div>
  );
}
