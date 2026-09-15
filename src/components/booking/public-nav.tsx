import Image from "next/image";
import Link from "next/link";
import { SCHOOL_NAME, SCHOOL_SHORT } from "@/lib/constants";

const link = "label text-paper/80 hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

export function PublicNav() {
  return (
    <nav className="no-print flex items-center justify-between gap-6 px-6 h-16 bg-ink text-paper">
      <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" title={SCHOOL_NAME}>
        <Image src="/logo.png" alt={SCHOOL_NAME} width={40} height={40} priority />
        <span className="leading-tight">
          <span className="display text-lg block">{SCHOOL_SHORT} <span className="text-accent">Hotel</span></span>
          <span className="label text-[8px] text-paper/70 block">Booking Simulation · Praktik Siswa</span>
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/#rooms" className={link}>Kamar</Link>
        <Link href="/#how" className={link}>Cara Booking</Link>
        <Link href="/fo" className="label border border-paper/60 px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:translate-y-px">
          Front Office
        </Link>
      </div>
    </nav>
  );
}
