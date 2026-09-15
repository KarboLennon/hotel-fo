import Image from "next/image";
import Link from "next/link";
import { SCHOOL_NAME, SCHOOL_SHORT } from "@/lib/constants";

const link = "label text-paper/80 hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

export function PublicNav() {
  return (
    <nav className="no-print flex items-center justify-between gap-4 px-4 sm:px-6 min-h-16 py-2 bg-ink text-paper">
      <Link href="/" className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" title={SCHOOL_NAME}>
        <Image src="/logo.png" alt={SCHOOL_NAME} width={40} height={40} priority className="size-9 sm:size-10" />
        <span className="leading-tight whitespace-nowrap">
          <span className="display text-base sm:text-lg block">{SCHOOL_SHORT} <span className="text-accent">Hotel</span></span>
          <span className="label text-[8px] text-paper/70 hidden sm:block">Hotel &amp; Suites · Serpong</span>
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <Link href="/#rooms" className={`${link} hidden md:inline`}>Kamar</Link>
        <Link href="/#how" className={`${link} hidden md:inline`}>Cara Memesan</Link>
        <Link href="/fo" className="label whitespace-nowrap border border-paper/60 px-3 sm:px-4 py-2 text-paper hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:translate-y-px">
          Front Office
        </Link>
      </div>
    </nav>
  );
}
