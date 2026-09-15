"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestSchema, type GuestInput } from "@/lib/validation/guest";
import { saveGuest, deleteGuest } from "@/server/actions/guests";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + i);

export function GuestForm({ defaultValues, guestId }: { defaultValues: GuestInput; guestId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // zodResolver's inferred generic doesn't line up with GuestInput under zod 4 + resolvers 5 (schema uses .superRefine); cast per task brief.
  const { register, handleSubmit, setError, watch, formState: { errors } } = useForm<GuestInput>({ resolver: zodResolver(guestSchema) as Resolver<GuestInput>, defaultValues });
  const lifetime = watch("idLifetime");
  const e = (k: FieldPath<GuestInput>) => (errors as Record<string, { message?: string } | undefined>)[k]?.message;
  const submit = (data: GuestInput) => start(async () => {
    const r = await saveGuest(data, guestId);
    if (!r.ok) { setMessage(r.message); for (const [k, m] of Object.entries(r.fieldErrors ?? {})) if (m?.[0]) setError(k as FieldPath<GuestInput>, { message: m[0] }); return; }
    router.push("/guests"); router.refresh();
  });
  const remove = () => { if (!guestId || !confirm("Hapus tamu ini?")) return; start(async () => { const r = await deleteGuest(guestId); if (r.ok) { router.push("/guests"); router.refresh(); } else setMessage(r.message); }); };
  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl" noValidate>
      <Panel title="Guest Information">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Title"><Select {...register("title")}><option value="MR">Mr.</option><option value="MRS">Mrs.</option><option value="DR">Dr.</option><option value="MISS">Miss</option></Select></Field>
          <Field label="Guest type"><Select {...register("guestType")}><option value="REGULAR">Regular</option><option value="REPEAT">Repeat</option><option value="VIP">VIP</option></Select></Field>
          <Field label="First name *" error={e("firstName")}><Input {...register("firstName")} /></Field>
          <Field label="Last name *" error={e("lastName")}><Input {...register("lastName")} /></Field>
          <Field label="Email *" error={e("email")}><Input type="email" {...register("email")} /></Field>
          <Field label="Phone"><Input {...register("phone")} /></Field>
          <Field label="Gender"><Select {...register("gender")}><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option></Select></Field>
          <Field label="Occupation"><Input {...register("occupation")} /></Field>
        </div>
        <p className="label mt-3 mb-1">Address</p>
        <Field label="Address *" error={e("address")}><Input {...register("address")} /></Field>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="City *" error={e("city")}><Input {...register("city")} /></Field>
          <Field label="Postal *" error={e("postal")}><Input {...register("postal")} /></Field>
          <Field label="State *" error={e("state")}><Input {...register("state")} /></Field>
          <Field label="Country *" error={e("country")}><Input {...register("country")} /></Field>
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel title="Identity Information">
          <div className="grid grid-cols-2 gap-2">
            <Field label="ID type *"><Select {...register("idType")}><option value="KTP">KTP</option><option value="SIM">SIM</option><option value="PASSPORT">Passport</option></Select></Field>
            <Field label="ID number *" error={e("idNumber")}><Input {...register("idNumber")} /></Field>
            <Field label="Exp. month" error={e("idExpMonth")}><Select {...register("idExpMonth", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} disabled={lifetime}><option value="">—</option>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
            <Field label="Exp. year"><Select {...register("idExpYear", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} disabled={lifetime}><option value="">—</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</Select></Field>
            <Checkbox label="Lifetime" {...register("idLifetime")} />
            <Field label="Nationality *" error={e("nationality")}><Input {...register("nationality")} /></Field>
          </div>
        </Panel>
        <Panel title="Birth Information">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Birth date"><Input type="date" {...register("birthDate")} /></Field>
            <Field label="City *" error={e("birthCity")}><Input {...register("birthCity")} /></Field>
            <Field label="State"><Input {...register("birthState")} /></Field>
            <Field label="Country"><Input {...register("birthCountry")} /></Field>
          </div>
        </Panel>
        {message && <p className="text-[12px] text-danger" role="alert">{message}</p>}
        <div className="flex justify-end gap-2">
          {guestId && <Button type="button" variant="danger" onClick={remove} loading={pending}>Delete</Button>}
          <Button type="button" variant="ghost" onClick={() => router.push("/guests")}>Close</Button>
          <Button type="submit" loading={pending}>Save</Button>
        </div>
      </div>
    </form>
  );
}
