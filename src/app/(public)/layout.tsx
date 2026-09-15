import { PublicNav } from "@/components/booking/public-nav";
import { SCHOOL_NAME } from "@/lib/constants";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper-2">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="no-print border-t border-line px-6 py-5 text-[11px] text-muted flex flex-wrap justify-between gap-2">
        <span>{SCHOOL_NAME} · Simulasi booking untuk praktik Front Office. Tidak ada transaksi nyata.</span>
        <span>Tax 21% · Check-in 14:00 · Check-out 12:00</span>
      </footer>
    </div>
  );
}
