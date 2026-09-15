import { PageHeader } from "@/components/ui/page-header";
import { MessageTable } from "@/components/guest-messages/message-table";
import { listGuestMessages, getInHouseGuests } from "@/server/queries/guest-messages";

export default async function GuestMessagesPage({ searchParams }: { searchParams: Promise<{ undelivered?: string }> }) {
  const sp = await searchParams;
  const undeliveredOnly = sp.undelivered === "1";
  const [rows, inHouse] = await Promise.all([listGuestMessages(undeliveredOnly), getInHouseGuests()]);
  return (
    <>
      <PageHeader eyebrow={`${rows.length} record(s)`} title="Guest Message(s)" />
      <MessageTable rows={rows} inHouse={inHouse} undeliveredOnly={undeliveredOnly} />
    </>
  );
}
