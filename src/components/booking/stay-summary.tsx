import Image from "next/image";
import { formatDate, formatMoney } from "@/lib/format";
import type { Stay } from "@/server/services/booking";
import type { RateBreakdown } from "@/server/services/rate";

export function StaySummary({ stay, adults, kids, channel, roomType, image, ratePerNight, rate, taxPercent }: {
  stay: Stay; adults: number; kids: number; channel: string; roomType?: string; image?: string; ratePerNight?: number; rate?: RateBreakdown; taxPercent?: number;
}) {
  const row = (k: string, v: React.ReactNode, strong = false) => (
    <div className="flex justify-between gap-3 py-1.5 border-b border-line-soft text-[12px]"><span className="text-muted">{k}</span><span className={strong ? "display text-base" : "text-right"}>{v}</span></div>
  );
  return (
    <aside className="bg-paper border border-line p-4">
      {image && roomType && (
        <div className="relative h-32 -mx-4 -mt-4 mb-4 overflow-hidden"><Image src={image} alt={roomType} fill sizes="400px" className="object-cover" /></div>
      )}
      <p className="label text-accent-2 mb-2">Ringkasan</p>
      {row("Check-in", `${formatDate(stay.arrival)} · 14:00`)}
      {row("Check-out", `${formatDate(stay.departure)} · 12:00`)}
      {row("Lama menginap", `${stay.nights} malam`)}
      {row("Tamu", `${adults} dewasa${kids ? `, ${kids} anak` : ""}`)}
      {row("Booking lewat", channel)}
      {roomType && row("Tipe kamar", roomType)}
      {rate && ratePerNight !== undefined && (
        <>
          {row("Harga kamar", `${formatMoney(ratePerNight)} × ${stay.nights}`)}
          {row(`Pajak ${taxPercent}%`, formatMoney(rate.tax))}
          <div className="flex justify-between items-center pt-3"><span className="label text-ink">Total</span><span className="display text-xl tabular-nums">{formatMoney(rate.total)}</span></div>
        </>
      )}
    </aside>
  );
}
