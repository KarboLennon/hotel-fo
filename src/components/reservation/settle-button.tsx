"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { settleReservation } from "@/server/actions/checkout";

export function SettleButton({ reservationId, balance }: { reservationId: string; balance: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const settled = Math.abs(balance) < 0.005;
  return (
    <div className="flex items-center gap-3 justify-end">
      {error && <span className="text-[12px] text-danger" role="alert">{error}</span>}
      {!settled && <span className="text-[12px] text-muted">Lunasi balance untuk check out</span>}
      <Button disabled={!settled} loading={pending} onClick={() => start(async () => { const r = await settleReservation(reservationId); if (r.ok) { router.push(`/fo/reservations/${reservationId}`); router.refresh(); } else setError(r.message); })}>
        Settle & Check Out
      </Button>
    </div>
  );
}
