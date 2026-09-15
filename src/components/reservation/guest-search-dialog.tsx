"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchGuests } from "@/server/actions/guests";
import type { GuestSummary } from "@/server/queries/guests";

export function GuestSearchDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (g: GuestSummary) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<GuestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const run = async () => { setLoading(true); setRows(await searchGuests(q)); setLoading(false); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Find guest" width="max-w-2xl">
      <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Last name, first name, ID number, phone" autoFocus />
        <Button type="submit" loading={loading}>Search</Button>
      </form>
      <div className="border border-line max-h-80 overflow-auto">
        {rows.length === 0 ? <p className="display text-muted text-center py-8">No Record Found</p> : (
          <table className="w-full text-[12px]">
            <thead className="bg-paper-2"><tr>{["Name", "ID", "Phone", "Email", "City", ""].map((h) => <th key={h} className="label text-left px-3 py-1.5 border-b border-line">{h}</th>)}</tr></thead>
            <tbody>{rows.map((g) => (
              <tr key={g.id} className="border-b border-line-soft hover:bg-paper-2">
                <td className="px-3 py-1.5">{g.lastName}, {g.firstName}</td><td className="px-3 py-1.5">{g.idType} {g.idNumber}</td>
                <td className="px-3 py-1.5">{g.phone}</td><td className="px-3 py-1.5">{g.email}</td><td className="px-3 py-1.5">{g.city}</td>
                <td className="px-3 py-1.5 text-right"><Button size="sm" variant="ghost" type="button" onClick={() => { onPick(g); onOpenChange(false); }}>Select</Button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </Dialog>
  );
}
