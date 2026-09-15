import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/auth";
import { NavLink } from "./nav-link";
import { formatDate } from "@/lib/format";
import { SCHOOL_NAME, SCHOOL_SHORT } from "@/lib/constants";

const LINKS = [
  ["/fo", "Dashboard"], ["/fo/reservations", "Reservation"], ["/fo/guest-ledger", "Guest Ledger"],
  ["/fo/guests", "Guests"], ["/fo/guest-messages", "Messages"], ["/fo/out-of-order", "Out of Order"],
] as const;

export function TopNav({ user }: { user: { name: string; role: string } }) {
  return (
    <nav className="no-print flex items-center justify-between gap-6 px-6 h-14 border-b border-line-soft bg-paper">
      <div className="flex items-center gap-7">
        <Link href="/fo" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" title={SCHOOL_NAME}>
          <Image src="/logo.png" alt={SCHOOL_NAME} width={36} height={36} priority />
          <span className="leading-tight">
            <span className="display text-base block">{SCHOOL_SHORT} <span className="text-accent">FO</span></span>
            <span className="label text-[8px] block">Front Office Practice</span>
          </span>
        </Link>
        <div className="flex items-center gap-5">{LINKS.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}</div>
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted">
        <span>{formatDate(new Date())}</span>
        <span className="text-ink">{user.name}</span>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button className="label hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:translate-y-px">Sign out</button>
        </form>
      </div>
    </nav>
  );
}
