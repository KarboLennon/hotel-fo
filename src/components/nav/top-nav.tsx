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
    <nav className="no-print border-b border-line-soft bg-paper px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4 h-14">
        <Link href="/fo" className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" title={SCHOOL_NAME}>
          <Image src="/logo.png" alt={SCHOOL_NAME} width={36} height={36} priority />
          <span className="leading-tight whitespace-nowrap">
            <span className="display text-base block">{SCHOOL_SHORT} <span className="text-accent">FO</span></span>
            <span className="label text-[8px] hidden sm:block">Front Office Practice</span>
          </span>
        </Link>
        {/* Wide screens: links inline. Phones: links move to a scrollable row below (see second div). */}
        <div className="hidden lg:flex items-center gap-5">{LINKS.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}</div>
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-muted shrink-0">
          <span className="hidden sm:inline">{formatDate(new Date())}</span>
          <span className="text-ink truncate max-w-28 sm:max-w-none">{user.name}</span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="label hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:translate-y-px">Sign out</button>
          </form>
        </div>
      </div>
      <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
        <div className="flex items-center gap-5 h-10 whitespace-nowrap">{LINKS.map(([href, label]) => <NavLink key={href} href={href}>{label}</NavLink>)}</div>
      </div>
    </nav>
  );
}
