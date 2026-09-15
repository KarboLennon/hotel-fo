"use client";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function DataTable<T>({ columns, data, onRowClick, rowClassName, emptyText = "No Record Found", dense = true }: {
  columns: ColumnDef<T, unknown>[]; data: T[]; onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined; emptyText?: string; dense?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  const pad = dense ? "px-3 py-1.5" : "px-3 py-2.5";
  return (
    <div className="border border-line overflow-x-auto">
      <table className="w-full text-[12px] whitespace-nowrap">
        <thead className="sticky top-0 bg-paper-2">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className={cn("label text-left font-semibold border-b border-line select-none", pad, h.column.getCanSort() && "cursor-pointer hover:text-ink")}
                  onClick={h.column.getToggleSortingHandler()}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: " ▲", desc: " ▼" }[h.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center text-muted py-12 display text-base">{emptyText}</td></tr>
          ) : table.getRowModel().rows.map((row) => (
            <tr key={row.id} onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn("border-b border-line-soft last:border-b-0", onRowClick && "cursor-pointer hover:bg-paper-2", rowClassName?.(row.original))}>
              {row.getVisibleCells().map((cell) => <td key={cell.id} className={pad}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
