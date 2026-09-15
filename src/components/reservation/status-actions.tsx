"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { transitionReservation } from "@/server/actions/reservation-status";
import { availableActions } from "@/server/services/status";
import type { ReservationStatus } from "@/lib/constants";

const LABEL = { CHECK_IN: "Check In", CANCEL: "Cancel", NO_SHOW: "No Show", VOID: "Void" } as const;

export function StatusActions({ id, status }: { id: string; status: ReservationStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const actions = availableActions(status);
  const run = (action: keyof typeof LABEL) => {
    if (action !== "CHECK_IN" && !confirm(`${LABEL[action]} reservasi ini?`)) return;
    start(async () => { const r = await transitionReservation(id, action); setError(r.ok ? null : r.message); if (r.ok) router.refresh(); });
  };
  return (
    <div className="no-print flex items-center gap-2 flex-wrap justify-end">
      {error && <span className="text-[12px] text-danger" role="alert">{error}</span>}
      <Link href={`/fo/reservations/${id}/print`} className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"><Button type="button" variant="ghost">Print</Button></Link>
      {actions.includes("VOID") && <Button type="button" variant="danger" loading={pending} onClick={() => run("VOID")}>Void</Button>}
      {actions.includes("NO_SHOW") && <Button type="button" variant="ghost" loading={pending} onClick={() => run("NO_SHOW")}>No Show</Button>}
      {actions.includes("CANCEL") && <Button type="button" variant="ghost" loading={pending} onClick={() => run("CANCEL")}>Cancel</Button>}
      {actions.includes("CHECK_IN") && <Button type="button" loading={pending} onClick={() => run("CHECK_IN")}>Check In</Button>}
      {actions.includes("CHECK_OUT") && <Link href={`/fo/reservations/${id}/checkout`} className="inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"><Button type="button">Check Out</Button></Link>}
    </div>
  );
}
