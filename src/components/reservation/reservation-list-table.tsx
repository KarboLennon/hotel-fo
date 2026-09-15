"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import type { ReservationListRow } from "@/server/queries/reservations";
import { formatDate, formatDateTime } from "@/lib/format";
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_TEXT } from "@/lib/constants";

const columns: ColumnDef<ReservationListRow, unknown>[] = [
  { accessorKey: "number", header: "Res. No" },
  { accessorKey: "roomNumber", header: "Room" },
  { accessorKey: "lastName", header: "Last Name" },
  { accessorKey: "firstName", header: "First Name" },
  { accessorKey: "createdAt", header: "Res. Date", cell: ({ getValue }) => formatDateTime(getValue<Date>()) },
  { accessorKey: "arrival", header: "Arrival", cell: ({ getValue }) => formatDate(getValue<Date>()) },
  { accessorKey: "departure", header: "Departure", cell: ({ getValue }) => formatDate(getValue<Date>()) },
  { accessorKey: "sourceName", header: "Source" },
  { accessorKey: "voucherNo", header: "Voucher No" },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => RESERVATION_STATUS_LABEL[getValue<ReservationListRow["status"]>()] },
];

export function ReservationListTable({ rows }: { rows: ReservationListRow[] }) {
  const router = useRouter();
  return <DataTable columns={columns} data={rows} onRowClick={(r) => router.push(`/fo/reservations/${r.id}`)} rowClassName={(r) => RESERVATION_STATUS_TEXT[r.status]} />;
}
