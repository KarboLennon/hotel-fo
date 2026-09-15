import { PageHeader } from "@/components/ui/page-header";
import { MarkDialog } from "@/components/out-of-order/mark-dialog";
import { OooTable } from "@/components/out-of-order/ooo-table";
import { listOutOfOrder, getRoomsForSelect } from "@/server/queries/out-of-order";

export default async function OutOfOrderPage() {
  const [rows, rooms] = await Promise.all([listOutOfOrder(), getRoomsForSelect()]);
  return (
    <>
      <PageHeader eyebrow={`${rows.filter((r) => r.active).length} active`} title="Out of Order Room List" actions={<MarkDialog rooms={rooms} />} />
      <OooTable rows={rows} />
    </>
  );
}
