"use client";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import type { RoomRow } from "@/server/queries/dashboard";
import { formatDateTime, formatMoney } from "@/lib/format";
import { ROOM_STATUS_COLOR } from "@/lib/constants";
import { cn } from "@/lib/cn";

const columns: ColumnDef<RoomRow, unknown>[] = [
  { id: "status", header: "", enableSorting: false, cell: ({ row }) => <span className={cn("inline-block size-2.5", ROOM_STATUS_COLOR[row.original.state.status])} aria-label={row.original.state.status} /> },
  { accessorKey: "number", header: "Room", cell: ({ getValue }) => <span className="display text-[13px]">{getValue<string>()}</span> },
  { accessorKey: "typeName", header: "Room Type" },
  { id: "guest", header: "Guest Name", accessorFn: (r) => r.reservation?.guestName ?? "" },
  { id: "arrival", header: "Arrival", accessorFn: (r) => r.reservation?.arrival ?? null, cell: ({ getValue }) => { const v = getValue<Date | null>(); return v ? formatDateTime(v) : ""; } },
  { id: "departure", header: "Departure", accessorFn: (r) => r.reservation?.departure ?? null, cell: ({ getValue }) => { const v = getValue<Date | null>(); return v ? formatDateTime(v) : ""; } },
  { id: "folio", header: "Folio #", accessorFn: (r) => r.reservation?.folioNumber ?? "" },
  { id: "resno", header: "Reservation #", accessorFn: (r) => r.reservation?.number ?? "" },
  { id: "voucher", header: "Voucher #", accessorFn: (r) => r.reservation?.voucherNo ?? "" },
  { id: "source", header: "Source", accessorFn: (r) => r.reservation?.sourceName ?? "" },
  { id: "rate", header: "Rate Type", accessorFn: (r) => r.reservation?.rateTypeName ?? "" },
  { id: "balance", header: "Balance", accessorFn: (r) => r.reservation?.balance ?? null, cell: ({ getValue }) => { const v = getValue<number | null>(); return v === null ? "" : <span className="tabular-nums">{formatMoney(v)}</span>; } },
  { id: "pax", header: "Pax (A/C)", accessorFn: (r) => (r.reservation ? `${r.reservation.adults}/${r.reservation.children}` : "") },
];

export function RoomListTable({ rooms, date }: { rooms: RoomRow[]; date: string }) {
  const router = useRouter();
  return (
    <div className="mt-4">
      <DataTable columns={columns} data={rooms}
        onRowClick={(r) => router.push(r.reservation ? `/fo/reservations/${r.reservation.id}` : `/fo/reservations/new?roomId=${r.id}&date=${date}`)}
        rowClassName={(r) => (r.state.status === "OCCUPIED" ? "bg-paper-2" : undefined)} />
    </div>
  );
}
