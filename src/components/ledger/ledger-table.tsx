"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import type { LedgerRow } from "@/server/queries/ledger";
import { formatDate, formatMoney } from "@/lib/format";

const columns: ColumnDef<LedgerRow, unknown>[] = [
  { accessorKey: "roomNumber", header: "Room" }, { accessorKey: "reservationNumber", header: "Reservation#" }, { accessorKey: "folioNumber", header: "Folio#" },
  { accessorKey: "voucherNo", header: "Voucher#" },
  { accessorKey: "arrival", header: "Arrival", cell: ({ getValue }) => formatDate(getValue<Date>()) },
  { accessorKey: "departure", header: "Departure", cell: ({ getValue }) => formatDate(getValue<Date>()) },
  { accessorKey: "guestName", header: "Guest Name" }, { accessorKey: "email", header: "Email" }, { accessorKey: "phone", header: "Phone" },
  { accessorKey: "identity", header: "Identity#" }, { accessorKey: "bookedBy", header: "Booked By" }, { accessorKey: "sourceName", header: "Source" },
  { accessorKey: "roomType", header: "Room Type" }, { accessorKey: "rateType", header: "Rate Type" },
  { accessorKey: "balance", header: "Balance", cell: ({ getValue }) => <span className="tabular-nums">{formatMoney(getValue<number>())}</span> },
  { accessorKey: "pax", header: "Pax" },
];

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const router = useRouter();
  return <DataTable columns={columns} data={rows} onRowClick={(r) => router.push(`/reservations/${r.id}`)} />;
}
