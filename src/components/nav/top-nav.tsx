import Link from "next/link";
import { signOut } from "@/auth";
import { NavLink } from "./nav-link";
import { formatDate } from "@/lib/format";

const LINKS = [
  ["/", "Dashboard"], ["/reservations", "Reservation"], ["/guest-ledger", "Guest Ledger"],
  ["/guests", "Guests"], ["/guest-messages", "Messages"], ["/out-of-order", "Out of Order"],
] as const;

export function TopNav({ user }: { user: { name: string; role: string } }) {
  return (
    <nav className="no-print flex items-center justify-between gap-6 px-6 h-14 border-b border-line-soft bg-paper">
      <div className="flex items-center gap-7">
        <Link href="/" className="display text-lg">Hotel <span className="text-accent">FO</span></Link>
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
