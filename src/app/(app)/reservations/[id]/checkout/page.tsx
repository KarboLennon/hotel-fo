import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FolioTable } from "@/components/reservation/folio-table";
import { PaymentForm } from "@/components/reservation/payment-form";
import { SettleButton } from "@/components/reservation/settle-button";
import { getReservationDetail } from "@/server/queries/reservations";
import { formatDateTime } from "@/lib/format";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getReservationDetail(id);
  if (!d) notFound();
  if (d.status !== "CHECKED_IN") redirect(`/reservations/${id}`);
  return (
    <>
      <PageHeader eyebrow={`Check Out · ${d.number} · Folio ${d.folioNumber}`} title={`${d.guest.firstName} ${d.guest.lastName} · Room ${d.room.number}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-4">
          <FolioTable lines={d.lines} balance={d.balance} />
          <PaymentForm reservationId={d.id} suggested={d.balance} />
        </div>
        <div className="space-y-4">
          <div className="border border-line p-3 text-[12px] space-y-1">
            <p className="label mb-2">Stay</p>
            <p>Arrival: {formatDateTime(d.arrival)}</p><p>Departure: {formatDateTime(d.departure)}</p><p>Nights: {d.nights}</p>
            <p>Rate: {d.rateType.name}</p><p>Settlement: {d.settlementMethod}{d.cardType ? ` · ${d.cardType} **** ${d.cardLast4}` : ""}</p>
          </div>
          <SettleButton reservationId={d.id} balance={d.balance} />
        </div>
      </div>
    </>
  );
}
