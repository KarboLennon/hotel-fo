"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import type { OooRow } from "@/server/queries/out-of-order";
import { unmarkOutOfOrder } from "@/server/actions/out-of-order";
import { formatDate } from "@/lib/format";

export function OooTable({ rows }: { rows: OooRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const columns: ColumnDef<OooRow, unknown>[] = [
    { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => formatDate(getValue<Date>()) },
    { id: "range", header: "O/O Date", accessorFn: (r) => r.fromDate, cell: ({ row }) => `${formatDate(row.original.fromDate)} → ${row.original.toDate ? formatDate(row.original.toDate) : "open"}` },
    { accessorKey: "roomTypeName", header: "Room Type" },
    { accessorKey: "roomNumber", header: "Room" },
    { accessorKey: "remark", header: "Remark" },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => row.original.active
        ? <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { await unmarkOutOfOrder(row.original.id); router.refresh(); })}>Unmark O/O</Button>
        : <span className="label text-[8px]">Closed</span> },
  ];
  return <DataTable columns={columns} data={rows} rowClassName={(r) => (r.active ? undefined : "text-muted")} />;
}
