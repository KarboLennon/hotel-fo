"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const go = (d: string) => { const p = new URLSearchParams(sp.toString()); p.set("date", d); router.push(`/?${p}`); };
  const shift = (n: number) => go(format(addDays(parseISO(date), n), "yyyy-MM-dd"));
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => shift(-1)} aria-label="Previous day">‹</Button>
      <Input type="date" value={date} onChange={(e) => e.target.value && go(e.target.value)} className="w-36 py-1 text-[12px]" aria-label="Date" />
      <Button variant="ghost" size="sm" onClick={() => shift(1)} aria-label="Next day">›</Button>
      <Button variant="ghost" size="sm" onClick={() => go(format(new Date(), "yyyy-MM-dd"))}>Today</Button>
    </div>
  );
}
