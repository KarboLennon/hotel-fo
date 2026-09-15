import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReservationForm } from "@/components/reservation/reservation-form";
import { StatusActions } from "@/components/reservation/status-actions";
import { detailToFormValues } from "@/components/reservation/defaults";
import { getReservationOptions } from "@/server/queries/options";
import { getReservationDetail } from "@/server/queries/reservations";
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_TEXT } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, options] = await Promise.all([getReservationDetail(id), getReservationOptions()]);
  if (!detail) notFound();
  const mode = detail.status === "RESERVED" ? "editable" : detail.status === "CHECKED_IN" ? "stayLocked" : "readOnly";
  return (
    <>
      <PageHeader eyebrow={`Reservation ${detail.number}`} title={`Room ${detail.room.number} · ${detail.room.roomType.name}`}
        actions={<><span className={`label ${RESERVATION_STATUS_TEXT[detail.status]} mr-4`}>{RESERVATION_STATUS_LABEL[detail.status]}</span><StatusActions id={detail.id} status={detail.status} /></>} />
      <ReservationForm options={options} defaultValues={detailToFormValues(detail)} reservationId={detail.id} mode={mode}
        docs={{ number: detail.number, folioNumber: detail.folioNumber }} />
      <footer className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-muted border-t border-line pt-3">
        <span>Booked by: <b className="text-ink">{detail.bookedBy.name}</b> · {formatDateTime(detail.createdAt)}</span>
        <span>Check in by: <b className="text-ink">{detail.checkedInBy?.name ?? "—"}</b>{detail.checkedInAt && ` · ${formatDateTime(detail.checkedInAt)}`}</span>
        <span>Check out by: <b className="text-ink">{detail.checkedOutBy?.name ?? "—"}</b>{detail.checkedOutAt && ` · ${formatDateTime(detail.checkedOutAt)}`}</span>
      </footer>
    </>
  );
}
