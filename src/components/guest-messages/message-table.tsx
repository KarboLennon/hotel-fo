"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageDialog, emptyMessage } from "./message-dialog";
import type { GuestMessageRow, getInHouseGuests } from "@/server/queries/guest-messages";
import { formatDate } from "@/lib/format";

const EMPTY = emptyMessage();

const columns: ColumnDef<GuestMessageRow, unknown>[] = [
  { accessorKey: "roomNumber", header: "Room" }, { accessorKey: "firstName", header: "First Name" }, { accessorKey: "lastName", header: "Last Name" },
  { accessorKey: "fromName", header: "From" }, { accessorKey: "message", header: "Message", cell: ({ getValue }) => <span className="block max-w-56 truncate">{getValue<string>()}</span> },
  { accessorKey: "company", header: "Company" }, { accessorKey: "phone", header: "Phone No" },
  { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => formatDate(getValue<Date>()) },
  { accessorKey: "delivered", header: "Delivered", cell: ({ getValue }) => (getValue<boolean>() ? "Yes" : "No") },
];

export function MessageTable({ rows, inHouse, undeliveredOnly }: { rows: GuestMessageRow[]; inHouse: Awaited<ReturnType<typeof getInHouseGuests>>; undeliveredOnly: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<GuestMessageRow | null | "new">(null);
  const initial = useMemo(() => (editing && editing !== "new" ? editing.input : EMPTY), [editing]);
  const currentLabel = editing && editing !== "new" ? `${editing.roomNumber} · ${editing.firstName} ${editing.lastName}` : undefined;
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <Checkbox label="Show Undelivered message Only" checked={undeliveredOnly} onChange={(e) => router.push(e.target.checked ? "/guest-messages?undelivered=1" : "/guest-messages")} />
        <Button type="button" onClick={() => setEditing("new")}>New</Button>
      </div>
      <DataTable columns={columns} data={rows} onRowClick={(r) => setEditing(r)} rowClassName={(r) => (r.delivered ? "text-muted" : undefined)} />
      <MessageDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} inHouse={inHouse}
        initial={initial} messageId={editing && editing !== "new" ? editing.id : undefined} currentLabel={currentLabel} />
    </>
  );
}
