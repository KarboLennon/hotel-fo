import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { GuestForm } from "@/components/guests/guest-form";
import { getGuest } from "@/server/queries/guests";

export default async function GuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await getGuest(id);
  if (!g) notFound();
  return (<><PageHeader eyebrow="Guest Database" title={`${g.firstName} ${g.lastName}`} /><GuestForm defaultValues={g} guestId={id} /></>);
}
