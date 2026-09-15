import { PageHeader } from "@/components/ui/page-header";
import { GuestForm } from "@/components/guests/guest-form";
import { emptyGuest } from "@/components/reservation/defaults";

export default function NewGuestPage() {
  return (<><PageHeader eyebrow="Guest Database" title="New Guest" /><GuestForm defaultValues={emptyGuest()} /></>);
}
