import Image from "next/image";
import Link from "next/link";
import { BedDouble, CalendarDays, CreditCard, UserRound } from "lucide-react";
import { SearchForm } from "@/components/booking/search-form";
import { getBookingSources, getRoomTypeAvailability } from "@/server/queries/public-booking";
import { formatMoney } from "@/lib/format";
import { SCHOOL_SHORT } from "@/lib/constants";
import { addDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: CalendarDays, title: "Pilih tanggal", text: "Tentukan tanggal check-in dan check-out, jumlah tamu, serta kanal pemesanan Anda." },
  { icon: BedDouble, title: "Pilih kamar", text: "Bandingkan tipe kamar yang tersedia lengkap dengan harga per malam dan total menginap." },
  { icon: UserRound, title: "Lengkapi data tamu", text: "Isi nama, kontak, identitas, dan permintaan khusus agar kedatangan Anda disiapkan dengan baik." },
  { icon: CreditCard, title: "Konfirmasi", text: "Pilih cara pembayaran dan terima nomor reservasi Anda seketika." },
];

export default async function LandingPage() {
  const today = startOfDay(new Date());
  const [sources, types] = await Promise.all([
    getBookingSources(),
    getRoomTypeAvailability({ arrival: today, departure: addDays(today, 1), nights: 1 }),
  ]);
  return (
    <>
      <section className="relative bg-ink text-paper px-6 pt-24 pb-32 overflow-hidden">
        <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        {/* Ink overlay keeps the headline legible over any photo while staying on the token palette. */}
        <div className="absolute inset-0 bg-ink/60" aria-hidden />
        <div className="relative max-w-5xl mx-auto">
          <p className="label text-paper mb-3">{SCHOOL_SHORT} Hotel · Serpong, Tangerang Selatan</p>
          <h1 className="display text-4xl md:text-6xl leading-tight max-w-3xl">Ketenangan yang terasa sejak Anda tiba.</h1>
          <p className="mt-4 max-w-2xl text-paper/85 text-[14px]">
            Kamar dan suite bergaya klasik, layanan yang penuh perhatian, dan harga terbaik saat Anda memesan langsung. Pilih tanggal, temukan kamar, dan kami siapkan sisanya.
          </p>
        </div>
      </section>
      {/* Pulled up over the hero; needs its own stacking context so the hero photo cannot paint over it. */}
      <section className="relative z-10 px-6 -mt-12">
        <div className="max-w-5xl mx-auto"><SearchForm sources={sources} /></div>
      </section>

      <section id="rooms" className="px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <p className="label text-accent-2">Tipe kamar</p>
          <h2 className="display text-3xl mb-6">Pilihan kamar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {types.map((t) => (
              <article key={t.id} className="bg-paper border border-line p-5 flex flex-col gap-3">
                <div className="relative h-44 overflow-hidden">
                  <Image src={t.image} alt={t.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  <span className="absolute left-3 bottom-3 label text-[9px] text-paper bg-ink/70 px-2 py-1">{t.size} · {t.bed}</span>
                </div>
                <h3 className="display text-xl">{t.name}</h3>
                <p className="text-[12px] text-muted flex-1">{t.blurb}</p>
                <div className="flex items-end justify-between border-t border-line-soft pt-3">
                  <span className="text-[11px] text-muted">{t.totalRooms} kamar · {t.available} tersedia malam ini</span>
                  <span><span className="price text-lg">{formatMoney(t.ratePerNight)}</span><span className="text-[10px] text-muted"> / malam</span></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-6 pb-16">
        <div className="max-w-5xl mx-auto border-t border-line pt-10">
          <p className="label text-accent-2">Cara memesan</p>
          <h2 className="display text-3xl mb-6">Empat langkah menuju kamar Anda</h2>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-paper border border-line p-5">
                <div className="flex items-center gap-2 mb-2"><s.icon size={16} className="text-accent" /><span className="label">Langkah {i + 1}</span></div>
                <h3 className="display text-lg mb-1">{s.title}</h3>
                <p className="text-[12px] text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[12px] text-muted">
            Staf hotel: kelola reservasi yang masuk melalui <Link href="/fo" className="text-accent-2 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">aplikasi Front Office</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
