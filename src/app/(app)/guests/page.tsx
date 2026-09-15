import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { GuestTable } from "@/components/guests/guest-table";
import { listGuests } from "@/server/queries/guests";

export default async function GuestsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = { lastName: sp.lastName || undefined, firstName: sp.firstName || undefined, idNumber: sp.idNumber || undefined, phone: sp.phone || undefined, inHouseOnly: sp.inHouseOnly === "on" };
  const rows = await listGuests(q);
  return (
    <>
      <PageHeader eyebrow={`${rows.length} record(s)`} title="Guest Database" actions={<Link href="/guests/new" className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"><Button type="button">New</Button></Link>} />
      <form action="/guests" className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end border border-line p-3 mb-4">
        <Field label="Last name"><Input name="lastName" defaultValue={q.lastName ?? ""} /></Field>
        <Field label="First name"><Input name="firstName" defaultValue={q.firstName ?? ""} /></Field>
        <Field label="ID number"><Input name="idNumber" defaultValue={q.idNumber ?? ""} /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={q.phone ?? ""} /></Field>
        <Checkbox name="inHouseOnly" label="In House Guest Only" defaultChecked={q.inHouseOnly} className="pb-2" />
        <Button type="submit" variant="ghost">Search</Button>
      </form>
      <GuestTable rows={rows} />
    </>
  );
}
