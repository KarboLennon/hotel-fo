"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import type { OooRow } from "@/server/queries/out-of-order";
import { unmarkOutOfOrder } from "@/server/actions/out-of-order";
import { formatDate } from "@/lib/format";

export function OooTable({ rows }: { rows: OooRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const columns: ColumnDef<OooRow, unknown>[] = [
    { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => formatDate(getValue<Date>()) },
    { id: "range", header: "O/O Date", accessorFn: (r) => r.fromDate, cell: ({ row }) => `${formatDate(row.original.fromDate)} → ${row.original.toDate ? formatDate(row.original.toDate) : "open"}` },
    { accessorKey: "roomTypeName", header: "Room Type" },
    { accessorKey: "roomNumber", header: "Room" },
    { accessorKey: "remark", header: "Remark" },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => row.original.active
        ? <Button
            size="sm"
            variant="ghost"
            loading={pendingId === row.original.id}
            onClick={() => {
              const id = row.original.id;
              setPendingId(id);
              start(async () => {
                try {
                  const r = await unmarkOutOfOrder(id);
                  if (r.ok) {
                    setError(null);
                    router.refresh();
                  } else {
                    setError(r.message);
                  }
                } finally {
                  setPendingId(null);
                }
              });
            }}
          >Unmark O/O</Button>
        : <span className="label text-[8px]">Closed</span> },
  ];
  return (
    <>
      {error && <p className="mb-2 text-[12px] text-danger" role="alert">{error}</p>}
      <DataTable columns={columns} data={rows} rowClassName={(r) => (r.active ? undefined : "text-muted")} />
    </>
  );
}
