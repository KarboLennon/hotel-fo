import type { RoomRow } from "@/server/queries/dashboard";
import { RoomCard } from "./room-card";

export function RoomGrid({ rooms, date }: { rooms: RoomRow[]; date: string }) {
  if (rooms.length === 0) return <p className="display text-muted text-center py-12">No Record Found</p>;
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
      {rooms.map((r) => <RoomCard key={r.id} room={r} date={date} />)}
    </div>
  );
}
