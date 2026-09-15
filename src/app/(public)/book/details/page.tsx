import Link from "next/link";
import { StaySummary } from "@/components/booking/stay-summary";
import { BookingDetailsForm } from "@/components/booking/booking-details-form";
import { getStayQuote, resolveBookingSearch } from "@/server/queries/public-booking";

export const dynamic = "force-dynamic";

export default async function DetailsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const resolved = await resolveBookingSearch(sp);
  const quote = resolved.ok && sp.roomTypeId ? await getStayQuote(resolved.stay, sp.roomTypeId) : null;
  if (!resolved.ok || !quote) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-danger mb-4" role="alert">{resolved.ok ? "Tipe kamar tidak ditemukan" : resolved.message}</p>
        <Link href="/" className="text-accent-2 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">Kembali ke pencarian</Link>
      </div>
    );
  }
  const { search, stay, channel, taxPercent } = resolved;
  const back = new URLSearchParams({ arrival: search.arrival, departure: search.departure, adults: String(search.adults), children: String(search.children), source: search.source });
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <p className="label text-accent-2">Langkah 3 dari 4</p>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 mb-4">
        <h1 className="display text-2xl sm:text-3xl">Data tamu &amp; pembayaran</h1>
        <Link href={`/book/rooms?${back}`} className="label whitespace-nowrap hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">‹ Ganti kamar</Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
        <BookingDetailsForm search={search} roomTypeId={quote.type.id} />
        {/* On phones the summary (what you are booking) comes first; on wide screens it sits beside the form. */}
        <div className="order-first lg:order-none">
          <StaySummary stay={stay} adults={search.adults} kids={search.children} channel={channel.name}
            roomType={quote.type.name} image={quote.type.image} ratePerNight={quote.type.ratePerNight} rate={quote.rate} taxPercent={taxPercent} />
        </div>
      </div>
    </div>
  );
}
