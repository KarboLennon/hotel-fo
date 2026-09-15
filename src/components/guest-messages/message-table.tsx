"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageDialog, emptyMessage } from "./message-dialog";
import type { GuestMessageRow, getInHouseGuests } from "@/server/queries/guest-messages";
import { deleteGuestMessage } from "@/server/actions/guest-messages";
import { formatDate } from "@/lib/format";

const columns: ColumnDef<GuestMessageRow, unknown>[] = [
  { accessorKey: "roomNumber", header: "Room" }, { accessorKey: "firstName", header: "First Name" }, { accessorKey: "lastName", header: "Last Name" },
  { accessorKey: "fromName", header: "From" }, { accessorKey: "message", header: "Message", cell: ({ getValue }) => <span className="block max-w-56 truncate">{getValue<string>()}</span> },
  { accessorKey: "company", header: "Company" }, { accessorKey: "phone", header: "Phone No" },
  { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => formatDate(getValue<Date>()) },
  { accessorKey: "delivered", header: "Delivered", cell: ({ getValue }) => (getValue<boolean>() ? "Yes" : "No") },
];

export function MessageTable({ rows, inHouse, undeliveredOnly }: { rows: GuestMessageRow[]; inHouse: Awaited<ReturnType<typeof getInHouseGuests>>; undeliveredOnly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<GuestMessageRow | null | "new">(null);
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <Checkbox label="Show Undelivered message Only" checked={undeliveredOnly} onChange={(e) => router.push(e.target.checked ? "/guest-messages?undelivered=1" : "/guest-messages")} />
        <Button type="button" onClick={() => setEditing("new")}>New</Button>
      </div>
      <DataTable columns={columns} data={rows} onRowClick={(r) => setEditing(r)} rowClassName={(r) => (r.delivered ? "text-muted" : undefined)} />
      {editing && editing !== "new" && (
        <div className="flex justify-end mt-2">
          <Button type="button" variant="danger" size="sm" loading={pending} onClick={() => { if (confirm("Hapus pesan ini?")) start(async () => { await deleteGuestMessage(editing.id); setEditing(null); router.refresh(); }); }}>Delete selected</Button>
        </div>
      )}
      <MessageDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} inHouse={inHouse}
        initial={editing && editing !== "new" ? editing.input : emptyMessage()} messageId={editing && editing !== "new" ? editing.id : undefined} />
    </>
  );
}
