"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { outOfOrderSchema, type OutOfOrderInput } from "@/lib/validation/out-of-order";
import { markOutOfOrder } from "@/server/actions/out-of-order";
import { toDateInput } from "@/lib/format";

export function MarkDialog({ rooms }: { rooms: { id: string; number: string; typeName: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<OutOfOrderInput>({
    // zodResolver's inferred generic doesn't line up with OutOfOrderInput under zod 4 + resolvers 5 (schema uses .refine); cast per task brief.
    resolver: zodResolver(outOfOrderSchema) as Resolver<OutOfOrderInput>, defaultValues: { roomId: "", fromDate: toDateInput(new Date()), toDate: "", remark: "" },
  });
  const submit = (data: OutOfOrderInput) => start(async () => {
    const r = await markOutOfOrder(data);
    if (!r.ok) { setMessage(r.message); for (const [k, m] of Object.entries(r.fieldErrors ?? {})) if (m?.[0]) setError(k as keyof OutOfOrderInput, { message: m[0] }); return; }
    reset(); setOpen(false); router.refresh();
  });
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Mark O/O</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Mark room out of order">
        <form onSubmit={handleSubmit(submit)} className="space-y-3" noValidate>
          <Field label="Room" error={errors.roomId?.message}>
            <Select {...register("roomId")}><option value="">Select room</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.number} · {r.typeName}</option>)}</Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="From" error={errors.fromDate?.message}><Input type="date" {...register("fromDate")} /></Field>
            <Field label="To (optional)" error={errors.toDate?.message}><Input type="date" {...register("toDate")} /></Field>
          </div>
          <Field label="Remark" error={errors.remark?.message}><Textarea {...register("remark")} placeholder="AC rusak, renovasi…" /></Field>
          {message && <p className="text-[12px] text-danger" role="alert">{message}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button><Button type="submit" loading={pending}>Save</Button></div>
        </form>
      </Dialog>
    </>
  );
}
