import Link from "next/link";
import { addDays, format, isSameDay } from "date-fns";
import { cn } from "@/lib/cn";
import { buildDashboardHref } from "@/server/queries/dashboard";
import type { getStayView } from "@/server/queries/stay-view";

type Data = Awaited<ReturnType<typeof getStayView>>;
const BAR: Record<string, string> = { RESERVED: "bg-status-reserved", CHECKED_IN: "bg-status-occupied" };

export function StayTimeline({ data, start, days, params }: { data: Data; start: Date; days: number; params: Record<string, string | undefined> }) {
  const cols = `140px repeat(${days}, minmax(52px, 1fr))`;
  const today = new Date();
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="display text-lg">{format(start, "MMMM yyyy")}</div>
        <div className="flex gap-1">
          {[7, 15, 30].map((d) => (
            <Link key={d} href={buildDashboardHref({ days: String(d) }, params)}
              className={cn("label px-3 py-1.5 border border-line hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent", days === d && "bg-accent border-accent text-paper")}>{d} Days</Link>
          ))}
        </div>
      </div>
      <div className="border border-line overflow-x-auto">
        <div className="grid min-w-[900px]" style={{ gridTemplateColumns: cols }}>
          <div className="label px-3 py-2 border-b border-r border-line bg-paper-2 sticky left-0 z-10">Room</div>
          {dates.map((d) => (
            <div key={d.toISOString()} className={cn("px-1 py-2 border-b border-line bg-paper-2 text-center text-[10px] text-muted", isSameDay(d, today) && "text-accent-2 font-semibold")}>
              <div>{format(d, "d")}</div><div className="label text-[8px]">{format(d, "EEE")}</div>
            </div>
          ))}
          {data.rooms.map((room) => (
            <div key={room.id} className="contents">
              <div className="px-3 py-1.5 border-b border-r border-line-soft sticky left-0 z-10 bg-paper">
                <span className="display text-[13px]">{room.number}</span> <span className="text-[10px] text-muted">{room.typeName}</span>
              </div>
              <div className="relative border-b border-line-soft grid" style={{ gridColumn: `2 / ${days + 2}`, gridTemplateColumns: `repeat(${days}, minmax(52px, 1fr))` }}>
                {dates.map((d, i) => <div key={i} className={cn("border-r border-line-soft min-h-8", isSameDay(d, today) && "bg-paper-2")} />)}
                {room.bars.map((b) => (
                  <Link key={b.reservationId} href={`/fo/reservations/${b.reservationId}`} title={b.guestName}
                    className={cn("absolute top-1 bottom-1 mx-0.5 px-1.5 text-[10px] text-paper truncate leading-6 hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink", BAR[b.status])}
                    style={{ left: `${(b.startIdx / days) * 100}%`, width: `calc(${((b.endIdx - b.startIdx) / days) * 100}% - 4px)` }}>
                    {b.guestName}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
