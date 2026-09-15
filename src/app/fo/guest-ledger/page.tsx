import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { LedgerFilters } from "@/components/ledger/ledger-filters";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { RevenueDialog } from "@/components/ledger/revenue-dialog";
import { getLedger, type LedgerFilter, type LookingFor } from "@/server/queries/ledger";
import { getReservationOptions } from "@/server/queries/options";
import { formatMoney } from "@/lib/format";

export default async function GuestLedgerPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const f: LedgerFilter = {
    from: isDate(sp.from) ? sp.from! : today, to: isDate(sp.to) ? sp.to! : today,
    guestName: sp.guestName || undefined, marketPlaceId: sp.marketPlaceId || undefined, sourceId: sp.sourceId || undefined, roomTypeId: sp.roomTypeId || undefined,
    lookingFor: (["inhouse", "checkedout", "reserved"].includes(sp.lookingFor ?? "") ? sp.lookingFor : "inhouse") as LookingFor,
  };
  const [{ rows, breakdown, totalBalance }, options] = await Promise.all([getLedger(f), getReservationOptions()]);
  return (
    <>
      <PageHeader eyebrow={`${rows.length} record(s)`} title="Guest Ledger" actions={<RevenueDialog breakdown={breakdown} total={totalBalance} />} />
      <LedgerFilters f={f} options={options} />
      <LedgerTable rows={rows} />
      <p className="mt-2 text-right text-[12px]">Total balance: <span className="display text-base">{formatMoney(totalBalance)}</span></p>
    </>
  );
}
