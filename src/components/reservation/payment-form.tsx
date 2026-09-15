"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addFolioLine } from "@/server/actions/checkout";

export function PaymentForm({ reservationId, suggested }: { reservationId: string; suggested: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"PAYMENT" | "DEPOSIT" | "EXTRA">("PAYMENT");
  const [amount, setAmount] = useState(suggested > 0 ? String(suggested) : "");
  const [description, setDescription] = useState("Cash");
  const [error, setError] = useState<string | null>(null);
  return (
    <Panel title="Add payment / charge">
      <form className="grid grid-cols-[110px_1fr_1fr_auto] gap-2 items-end" onSubmit={(e) => { e.preventDefault(); start(async () => {
        const r = await addFolioLine(reservationId, { kind, amount: Number(amount), description });
        setError(r.ok ? null : r.message ?? Object.values(r.fieldErrors ?? {}).flat()[0] ?? "Gagal"); if (r.ok) { setAmount(""); router.refresh(); } }); }}>
        <Field label="Type"><Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="PAYMENT">Payment</option><option value="DEPOSIT">Deposit</option><option value="EXTRA">Extra charge</option></Select></Field>
        <Field label="Amount" error={error ?? undefined}><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
        <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cash / Visa / Minibar…" required /></Field>
        <Button type="submit" loading={pending}>Add</Button>
      </form>
    </Panel>
  );
}
