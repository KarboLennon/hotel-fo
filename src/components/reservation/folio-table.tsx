import { formatDate, formatMoney } from "@/lib/format";
import type { ReservationDetail } from "@/server/queries/reservations";

const KIND: Record<string, string> = { ROOM_CHARGE: "Room", TAX: "Tax", EXTRA: "Extra", SPECIAL_REQUEST: "Request", PAYMENT: "Payment", DEPOSIT: "Deposit" };

export function FolioTable({ lines, balance }: { lines: ReservationDetail["lines"]; balance: number }) {
  return (
    <table className="w-full text-[12px] border border-line">
      <thead className="bg-paper-2"><tr>{["Date", "Type", "Description", "Amount"].map((h) => <th key={h} className="label text-left px-3 py-1.5 border-b border-line last:text-right">{h}</th>)}</tr></thead>
      <tbody>
        {lines.length === 0 && <tr><td colSpan={4} className="display text-muted text-center py-8">No charges yet</td></tr>}
        {lines.map((l) => (
          <tr key={l.id} className="border-b border-line-soft">
            <td className="px-3 py-1.5">{formatDate(l.date)}</td><td className="px-3 py-1.5">{KIND[l.kind]}</td><td className="px-3 py-1.5">{l.description}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(l.amount)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot><tr className="bg-paper-2"><td colSpan={3} className="label text-ink px-3 py-2">Balance</td><td className="display text-base text-right px-3 py-2 tabular-nums">{formatMoney(balance)}</td></tr></tfoot>
    </table>
  );
}
