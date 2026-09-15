"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { guestMessageSchema, MESSAGE_TYPES, MESSAGE_TYPE_LABEL, type GuestMessageInput } from "@/lib/validation/guest-message";
import { saveGuestMessage, deleteGuestMessage } from "@/server/actions/guest-messages";
import type { getInHouseGuests } from "@/server/queries/guest-messages";

type InHouse = Awaited<ReturnType<typeof getInHouseGuests>>;
export const emptyMessage = (): GuestMessageInput => ({
  guestId: "", roomId: "", fromName: "", company: "", phone: "", message: "",
  telephoned: false, returnedYourCall: false, pleaseCall: false, willCallAgain: false, cameToSeeYou: false, wantToSeeYou: false, rush: false, special: false, delivered: false,
});

export function MessageDialog({ open, onOpenChange, inHouse, initial, messageId, currentLabel }: {
  open: boolean; onOpenChange: (o: boolean) => void; inHouse: InHouse; initial: GuestMessageInput; messageId?: string; currentLabel?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [resId, setResId] = useState("");
  // zodResolver's inferred generic doesn't line up with GuestMessageInput under zod 4 + resolvers 5; cast is documented here per task brief.
  const { register, handleSubmit, setValue, reset, setError, formState: { errors } } = useForm<GuestMessageInput>({ resolver: zodResolver(guestMessageSchema) as Resolver<GuestMessageInput>, defaultValues: initial });
  useEffect(() => {
    if (open) {
      reset(initial);
      const match = inHouse.find((g) => g.guestId === initial.guestId && g.roomId === initial.roomId);
      setResId(match?.reservationId ?? (initial.guestId ? "__current" : ""));
    }
  }, [open, initial, reset, inHouse]);
  const currentRoomNumber = inHouse.find((g) => g.reservationId === resId)?.roomNumber ?? (resId === "__current" ? currentLabel?.split(" · ")[0] ?? "" : "");
  const submit = (data: GuestMessageInput) => start(async () => {
    const r = await saveGuestMessage(data, messageId);
    if (!r.ok) {
      setMessage(r.message);
      for (const [k, msgs] of Object.entries(r.fieldErrors ?? {})) if (msgs?.length) setError(k as FieldPath<GuestMessageInput>, { message: msgs[0] });
      return;
    }
    onOpenChange(false); router.refresh();
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Guest Message" width="max-w-xl">
      <form onSubmit={handleSubmit(submit)} className="space-y-3" noValidate>
        <p className="label text-accent-2">Select Guest</p>
        <Field label="In-house guest *" error={errors.guestId?.message}>
          <Select value={resId} onChange={(e) => {
            const v = e.target.value;
            setResId(v);
            const entry = inHouse.find((g) => g.reservationId === v);
            setValue("guestId", entry?.guestId ?? "");
            setValue("roomId", entry?.roomId ?? "");
          }}>
            <option value="">Select guest</option>
            {inHouse.map((g) => <option key={g.reservationId} value={g.reservationId}>{g.roomNumber} · {g.firstName} {g.lastName}</option>)}
            {initial.guestId && !inHouse.some((g) => g.guestId === initial.guestId && g.roomId === initial.roomId) && (
              <option value="__current" disabled>{currentLabel ?? "Tamu sudah check out"}</option>
            )}
          </Select>
        </Field>
        <input type="hidden" {...register("guestId")} />
        <input type="hidden" {...register("roomId")} />
        <p className="label text-accent-2 pt-2">Message Book</p>
        <div className="grid grid-cols-[1fr_180px] gap-4">
          <div className="space-y-2">
            <Field label="Room"><Input value={currentRoomNumber} readOnly disabled /></Field>
            <Field label="From *" error={errors.fromName?.message}><Input {...register("fromName")} /></Field>
            <Field label="Company"><Input {...register("company")} /></Field>
            <Field label="Phone"><Input {...register("phone")} /></Field>
            <Field label="Message *" error={errors.message?.message}><Textarea {...register("message")} /></Field>
            <Checkbox label="Delivered" {...register("delivered")} />
          </div>
          <div className="border border-line p-3 space-y-2">
            <p className="label">Type</p>
            {MESSAGE_TYPES.map((t) => <Checkbox key={t} label={MESSAGE_TYPE_LABEL[t]} className="flex" {...register(t)} />)}
          </div>
        </div>
        {message && <p className="text-[12px] text-danger" role="alert">{message}</p>}
        <div className="flex justify-between gap-2">
          {messageId ? (
            <Button type="button" variant="danger" loading={pending} onClick={() => {
              if (!confirm("Hapus pesan ini?")) return;
              start(async () => {
                const r = await deleteGuestMessage(messageId);
                if (r.ok) { onOpenChange(false); router.refresh(); } else setMessage(r.message);
              });
            }}>Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
            <Button type="submit" loading={pending}>Save</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
