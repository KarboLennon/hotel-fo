"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface SearchValues { arrival: string; departure: string; adults: number; children: number; source: string }

const cell = "flex flex-col gap-1 px-5 py-4";
const lbl = "label text-[9px]";
const field = "bg-transparent text-[15px] text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent";

export function SearchForm({ sources, initial, compact = false }: { sources: { id: string; name: string }[]; initial?: Partial<SearchValues>; compact?: boolean }) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [v, setV] = useState<SearchValues>({
    arrival: initial?.arrival ?? today, departure: initial?.departure ?? format(addDays(new Date(), 1), "yyyy-MM-dd"),
    adults: initial?.adults ?? 2, children: initial?.children ?? 0, source: initial?.source ?? "direct",
  });
  const nights = Math.max(0, differenceInCalendarDays(parseISO(v.departure), parseISO(v.arrival)));
  const set = (patch: Partial<SearchValues>) => setV((s) => {
    const next = { ...s, ...patch };
    if (patch.arrival && next.departure <= patch.arrival) next.departure = format(addDays(parseISO(patch.arrival), 1), "yyyy-MM-dd");
    return next;
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams({ arrival: v.arrival, departure: v.departure, adults: String(v.adults), children: String(v.children), source: v.source });
    router.push(`/book/rooms?${p}`);
  };
  return (
    <form onSubmit={submit} className={cn("bg-paper border border-line grid grid-cols-1 md:grid-cols-[1.1fr_1fr_0.8fr_auto] divide-y md:divide-y-0 md:divide-x divide-line", compact && "text-[13px]")}>
      <div className={cell}>
        <span className={lbl}>Check-in · Check-out{nights > 0 && ` · ${nights} malam`}</span>
        <div className="flex items-center gap-2">
          <input type="date" min={today} value={v.arrival} onChange={(e) => set({ arrival: e.target.value })} className={field} aria-label="Check-in" required />
          <span className="text-muted">–</span>
          <input type="date" min={v.arrival} value={v.departure} onChange={(e) => set({ departure: e.target.value })} className={field} aria-label="Check-out" required />
        </div>
      </div>
      <div className={cell}>
        <span className={lbl}>Tamu</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[13px]">Dewasa
            <select value={v.adults} onChange={(e) => set({ adults: Number(e.target.value) })} className={field} aria-label="Dewasa">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
          <label className="flex items-center gap-1.5 text-[13px]">Anak
            <select value={v.children} onChange={(e) => set({ children: Number(e.target.value) })} className={field} aria-label="Anak">{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
        </div>
      </div>
      <div className={cell}>
        <span className={lbl}>Booking lewat</span>
        <select value={v.source} onChange={(e) => set({ source: e.target.value })} className={field} aria-label="Sumber booking">
          {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex items-center px-4 py-3">
        <Button type="submit" className="w-full md:w-auto px-6 py-3"><Search size={14} /> Cari Kamar</Button>
      </div>
    </form>
  );
}
