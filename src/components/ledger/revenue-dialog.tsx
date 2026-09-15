"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

const LABEL: Record<string, string> = { ROOM_CHARGE: "Room charge", TAX: "Tax", EXTRA: "Extra charge", SPECIAL_REQUEST: "Special request", PAYMENT: "Payments", DEPOSIT: "Deposits" };

export function RevenueDialog({ breakdown, total }: { breakdown: Record<string, number>; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>Revenue Break Down</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Revenue break down">
        <dl className="text-[12px]">
          {Object.entries(breakdown).map(([k, v]) => <div key={k} className="flex justify-between py-1.5 border-b border-line-soft"><dt className="text-muted">{LABEL[k] ?? k}</dt><dd className="tabular-nums">{formatMoney(v)}</dd></div>)}
          <div className="flex justify-between py-2 mt-1 bg-paper-2 -mx-4 px-4"><dt className="label text-ink">Outstanding balance</dt><dd className="price text-base tabular-nums">{formatMoney(total)}</dd></div>
        </dl>
      </Dialog>
    </>
  );
}
