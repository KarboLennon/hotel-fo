import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/reservation/print-button";
import { getPublicConfirmation } from "@/server/queries/public-booking";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { SCHOOL_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getPublicConfirmation(id);
  if (!c) notFound();
  const rows: [string, string][] = [
    ["Nomor reservasi", c.number], ["Nama tamu", c.guestName], ["Email / Telepon", `${c.email}${c.phone ? ` · ${c.phone}` : ""}`],
    ["Kamar", `${c.roomType} · No. ${c.roomNumber}`], ["Check-in", `${formatDate(c.arrival)} · 14:00`], ["Check-out", `${formatDate(c.departure)} · 12:00`],
    ["Tamu", `${c.adults} dewasa${c.children ? `, ${c.children} anak` : ""} · ${c.nights} malam`], ["Booking lewat", `${c.channel}${c.voucherNo ? ` · Voucher ${c.voucherNo}` : ""}`],
    ["Pembayaran", c.settlementMethod === "CREDIT" ? `Kartu kredit ${c.cardType} **** ${c.cardLast4}` : "Bayar di hotel"],
    ["Harga", `${formatMoney(c.ratePerNight)} × ${c.nights} malam + pajak ${c.taxPercent}%`], ["Total", formatMoney(c.rate.total)],
    ...(c.notes ? [["Permintaan khusus", c.notes] as [string, string]] : []),
  ];
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="bg-paper border border-line p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="label text-accent-2">Langkah 4 dari 4 · Selesai</p>
            <h1 className="display text-3xl flex items-center gap-2"><CheckCircle2 className="text-status-vacant" size={26} /> Booking diterima</h1>
            <p className="text-[12px] text-muted mt-1">{SCHOOL_NAME} · dibuat {formatDateTime(c.createdAt)}</p>
          </div>
          <div className="text-right"><p className="label">Reservation #</p><p className="display text-2xl text-accent-2">{c.number}</p></div>
        </div>
        <table className="w-full text-[12px]">
          <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-line-soft"><th className="text-left label py-2 w-44 align-top">{k}</th><td className="py-2">{v}</td></tr>)}</tbody>
        </table>
        <p className="mt-6 text-[11px] text-muted">Simpan nomor reservasi Anda dan tunjukkan bersama identitas saat tiba di resepsionis. Check-in mulai pukul 14:00, check-out pukul 12:00.</p>
        <div className="no-print flex flex-wrap justify-end gap-2 mt-6">
          <Link href="/" className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"><Button type="button" variant="ghost">Booking lagi</Button></Link>
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
