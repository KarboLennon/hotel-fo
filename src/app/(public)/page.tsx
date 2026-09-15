import Link from "next/link";
import { BedDouble, CalendarDays, CreditCard, UserRound } from "lucide-react";
import { SearchForm } from "@/components/booking/search-form";
import { getBookingSources, getRoomTypeAvailability } from "@/server/queries/public-booking";
import { formatMoney } from "@/lib/format";
import { SCHOOL_SHORT } from "@/lib/constants";
import { addDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: CalendarDays, title: "Pilih tanggal", text: "Tentukan check-in, check-out, jumlah tamu, dan lewat mana booking dilakukan (website atau OTA)." },
  { icon: BedDouble, title: "Pilih kamar", text: "Lihat tipe kamar yang masih tersedia di tanggal itu beserta harga per malam." },
  { icon: UserRound, title: "Isi data tamu", text: "Nama, kontak, identitas, dan permintaan khusus seperti yang diminta resepsionis." },
  { icon: CreditCard, title: "Pembayaran & booking", text: "Pilih bayar di hotel atau kartu kredit, lalu terima nomor reservasi RESN." },
];

export default async function LandingPage() {
  const today = startOfDay(new Date());
  const [sources, types] = await Promise.all([
    getBookingSources(),
    getRoomTypeAvailability({ arrival: today, departure: addDays(today, 1), nights: 1 }),
  ]);
  return (
    <>
      <section className="bg-ink text-paper px-6 pt-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="label text-accent mb-3">{SCHOOL_SHORT} Hotel · Booking Simulation</p>
          <h1 className="display text-4xl md:text-5xl leading-tight max-w-3xl">Rencanakan menginap, seperti tamu sungguhan.</h1>
          <p className="mt-4 max-w-2xl text-paper/75 text-[14px]">
            Halaman ini meniru booking engine hotel. Setiap booking yang dibuat di sini langsung muncul di aplikasi Front Office sebagai reservasi baru untuk dilatih: check-in, folio, sampai check-out.
          </p>
        </div>
      </section>
      <section className="px-6 -mt-12">
        <div className="max-w-5xl mx-auto"><SearchForm sources={sources} /></div>
      </section>

      <section id="rooms" className="px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <p className="label text-accent-2">Tipe kamar</p>
          <h2 className="display text-3xl mb-6">Pilihan kamar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {types.map((t) => (
              <article key={t.id} className="bg-paper border border-line p-5 flex flex-col gap-3">
                <div className="h-28 bg-paper-3 flex items-end p-3"><span className="label text-[9px]">{t.size} · {t.bed}</span></div>
                <h3 className="display text-xl">{t.name}</h3>
                <p className="text-[12px] text-muted flex-1">{t.blurb}</p>
                <div className="flex items-end justify-between border-t border-line-soft pt-3">
                  <span className="text-[11px] text-muted">{t.totalRooms} kamar · {t.available} tersedia malam ini</span>
                  <span><span className="display text-lg">{formatMoney(t.ratePerNight)}</span><span className="text-[10px] text-muted"> / malam</span></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-6 pb-16">
        <div className="max-w-5xl mx-auto border-t border-line pt-10">
          <p className="label text-accent-2">Cara booking</p>
          <h2 className="display text-3xl mb-6">Empat langkah</h2>
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
            Resepsionis? Masuk ke <Link href="/fo" className="text-accent-2 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">aplikasi Front Office</Link> untuk memproses reservasi yang masuk.
          </p>
        </div>
      </section>
    </>
  );
}
