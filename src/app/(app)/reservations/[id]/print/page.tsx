import { notFound } from "next/navigation";
import { getReservationDetail } from "@/server/queries/reservations";
import { PrintButton } from "@/components/reservation/print-button";
import { formatDateTime, formatMoney } from "@/lib/format";
import { RESERVATION_STATUS_LABEL } from "@/lib/constants";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getReservationDetail(id);
  if (!d) notFound();
  const rows: [string, string][] = [
    ["Reservation #", d.number], ["Folio #", d.folioNumber ?? "-"], ["Status", RESERVATION_STATUS_LABEL[d.status]],
    ["Guest", `${d.guest.firstName} ${d.guest.lastName}`], ["Email / Phone", `${d.guest.email}${d.guest.phone ? ` / ${d.guest.phone}` : ""}`],
    ["Room", `${d.room.number} · ${d.room.roomType.name}`], ["Arrival", formatDateTime(d.arrival)], ["Departure", formatDateTime(d.departure)],
    ["Nights / Pax", `${d.nights} night(s) · ${d.adults} adult, ${d.children} child, ${d.infants} infant`], ["Rate type", `${d.rateType.name} · ${formatMoney(d.ratePerNight)} / night`],
    ["Market place / Source", `${d.marketPlace.name}${d.source ? ` · ${d.source.name}` : ""}`], ["Voucher #", d.voucherNo ?? "-"], ["Notes", d.notes ?? "-"],
  ];
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div><p className="label">Reservation Confirmation</p><h1 className="display text-2xl">Hotel Front Office</h1></div>
        <PrintButton />
      </div>
      <table className="w-full text-[12px]">
        <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-line-soft"><th className="text-left label py-2 w-48">{k}</th><td className="py-2">{v}</td></tr>)}</tbody>
      </table>
      {d.specialRequests.length > 0 && <p className="mt-4 text-[12px]"><b>Special requests:</b> {d.specialRequests.map((s) => `${s.name} × ${s.qty}`).join(", ")}</p>}
      <p className="mt-8 text-[11px] text-muted">Booked by {d.bookedBy.name} · {formatDateTime(d.createdAt)}</p>
    </div>
  );
}
