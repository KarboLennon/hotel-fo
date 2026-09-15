import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReservationListTable } from "@/components/reservation/reservation-list-table";
import { listReservations, type ListFilter } from "@/server/queries/reservations";
import { cn } from "@/lib/cn";

const FILTERS: [ListFilter, string][] = [["active", "Active"], ["cancelled", "Cancelled"], ["noshow", "No Show"], ["void", "Void"], ["all", "All"]];

export default async function ReservationListPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const sp = await searchParams;
  const filter = (FILTERS.some(([f]) => f === sp.filter) ? sp.filter : "active") as ListFilter;
  const q = sp.q ?? "";
  const rows = await listReservations(filter, q);
  return (
    <>
      <PageHeader eyebrow={`${rows.length} record(s)`} title="Reservation List"
        actions={<>
          <form className="flex gap-2" action="/fo/reservations"><input type="hidden" name="filter" value={filter} /><Input name="q" defaultValue={q} placeholder="Search res. no, last name, room, voucher" className="w-72" /><Button variant="ghost" type="submit">Search</Button></form>
          <Link href="/fo/reservations/new" className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"><Button type="button">New</Button></Link>
        </>} />
      <div className="flex gap-4 mb-3">
        {FILTERS.map(([f, label]) => (
          <Link key={f} href={`/fo/reservations?filter=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={filter === f ? "page" : undefined}
            className={cn("label flex items-center gap-1.5 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent", filter === f && "text-ink")}>
            <span className={cn("size-2.5 border border-line", filter === f && "bg-accent border-accent")} aria-hidden />{label}
          </Link>
        ))}
      </div>
      <ReservationListTable rows={rows} />
      <p className="mt-2 text-[10px] text-muted">Void = red · No Show = orange · Cancelled = blue · Active = green</p>
    </>
  );
}
