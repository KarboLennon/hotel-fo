import Image from "next/image";
import Link from "next/link";
import { SearchForm } from "@/components/booking/search-form";
import { StaySummary } from "@/components/booking/stay-summary";
import { Button } from "@/components/ui/button";
import { getBookingSources, getRoomTypeAvailability, resolveBookingSearch } from "@/server/queries/public-booking";
import { calculateRate } from "@/server/services/rate";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RoomsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [resolved, sources] = await Promise.all([resolveBookingSearch(sp), getBookingSources()]);
  if (!resolved.ok) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-danger mb-4" role="alert">{resolved.message}</p>
        <SearchForm sources={sources} initial={{ arrival: sp.arrival, departure: sp.departure, source: sp.source }} />
      </div>
    );
  }
  const { search, stay, channel, taxPercent } = resolved;
  const types = await getRoomTypeAvailability(stay);
  const qs = new URLSearchParams({ arrival: search.arrival, departure: search.departure, adults: String(search.adults), children: String(search.children), source: search.source });
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <SearchForm sources={sources} initial={search} compact />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div>
          <p className="label text-accent-2">Langkah 2 dari 4</p>
          <h1 className="display text-3xl mb-4">Pilih kamar</h1>
          <div className="space-y-3">
            {types.map((t) => {
              const rate = calculateRate({ ratePerNight: t.ratePerNight, nights: stay.nights, taxPercent });
              const full = t.available === 0;
              return (
                <article key={t.id} className="bg-paper border border-line p-4 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-4">
                  <div className="relative h-32 md:h-full min-h-32 overflow-hidden">
                    <Image src={t.image} alt={t.name} fill sizes="180px" className="object-cover" />
                  </div>
                  <div>
                    <h2 className="display text-xl">{t.name}</h2>
                    <p className="text-[11px] text-muted">{t.size} · {t.bed}</p>
                    <p className="text-[12px] mt-2">{t.blurb}</p>
                    <p className={`label text-[9px] mt-3 ${full ? "text-danger" : "text-status-vacant"}`}>{full ? "Penuh di tanggal ini" : `${t.available} kamar tersedia`}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2 md:min-w-44">
                    <div className="text-right">
                      <div><span className="price text-xl">{formatMoney(t.ratePerNight)}</span><span className="text-[10px] text-muted"> / malam</span></div>
                      <div className="text-[11px] text-muted">Total {stay.nights} malam + pajak: <b className="text-ink">{formatMoney(rate.total)}</b></div>
                    </div>
                    {full ? <Button disabled>Penuh</Button> : (
                      <Link href={`/book/details?${qs}&roomTypeId=${t.id}`} className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"><Button type="button">Pilih</Button></Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <StaySummary stay={stay} adults={search.adults} kids={search.children} channel={channel.name} />
      </div>
    </div>
  );
}
