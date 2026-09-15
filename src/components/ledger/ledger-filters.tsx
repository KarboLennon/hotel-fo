import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { LedgerFilter } from "@/server/queries/ledger";
import type { ReservationOptions } from "@/server/queries/options";

export function LedgerFilters({ f, options }: { f: LedgerFilter; options: ReservationOptions }) {
  return (
    <form action="/guest-ledger" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 items-end border border-line p-3 mb-4">
      <Field label="From date"><Input type="date" name="from" defaultValue={f.from} /></Field>
      <Field label="To date"><Input type="date" name="to" defaultValue={f.to} /></Field>
      <Field label="Guest name"><Input name="guestName" defaultValue={f.guestName ?? ""} /></Field>
      <Field label="Market place"><Select name="marketPlaceId" defaultValue={f.marketPlaceId ?? ""}><option value="">Select</option>{options.marketPlaces.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
      <Field label="Source"><Select name="sourceId" defaultValue={f.sourceId ?? ""}><option value="">-- N/A --</option>{options.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
      <Field label="Room type"><Select name="roomTypeId" defaultValue={f.roomTypeId ?? ""}><option value="">-- All --</option>{options.roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      <Field label="Looking for"><Select name="lookingFor" defaultValue={f.lookingFor}><option value="inhouse">In House</option><option value="checkedout">Checked Out</option><option value="reserved">Reserved</option></Select></Field>
      <Button type="submit">Search</Button>
    </form>
  );
}
