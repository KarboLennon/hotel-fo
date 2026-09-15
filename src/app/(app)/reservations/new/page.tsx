import { PageHeader } from "@/components/ui/page-header";
import { ReservationForm } from "@/components/reservation/reservation-form";
import { getReservationOptions } from "@/server/queries/options";
import { newReservationDefaults } from "@/components/reservation/defaults";
import { parseDateParam } from "@/server/queries/dashboard";

export default async function NewReservationPage({ searchParams }: { searchParams: Promise<{ roomId?: string; date?: string }> }) {
  const sp = await searchParams;
  const options = await getReservationOptions();
  const defaults = newReservationDefaults(options, { roomId: sp.roomId, date: parseDateParam(sp.date) });
  const room = options.roomTypes.flatMap((t) => t.rooms.map((r) => ({ ...r, typeName: t.name }))).find((r) => r.id === sp.roomId);
  return (
    <>
      <PageHeader eyebrow="Reservation" title={room ? `Room ${room.number} · ${room.typeName}` : "New Reservation"} />
      <ReservationForm options={options} defaultValues={defaults} />
    </>
  );
}
