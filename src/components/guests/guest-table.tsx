"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import type { GuestListRow } from "@/server/queries/guests";

const columns: ColumnDef<GuestListRow, unknown>[] = [
  { accessorKey: "guestType", header: "Guest Type" }, { accessorKey: "name", header: "Guest Name" }, { accessorKey: "country", header: "Country" },
  { accessorKey: "source", header: "Source" }, { accessorKey: "email", header: "Email" }, { accessorKey: "city", header: "City" }, { accessorKey: "phone", header: "Phone" },
  { id: "more", header: "", enableSorting: false, cell: () => <span className="text-accent-2 underline">More Details</span> },
];

export function GuestTable({ rows }: { rows: GuestListRow[] }) {
  const router = useRouter();
  return <DataTable columns={columns} data={rows} onRowClick={(r) => router.push(`/fo/guests/${r.id}`)} />;
}
