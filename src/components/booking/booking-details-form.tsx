"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicBookingSchema, type PublicBookingInput } from "@/lib/validation/public-booking";
import type { BookingSearch } from "@/lib/validation/public-booking";
import { createPublicBooking } from "@/server/actions/public-booking";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function BookingDetailsForm({ search, roomTypeId }: { search: BookingSearch; roomTypeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm<PublicBookingInput>({
    resolver: zodResolver(publicBookingSchema) as Resolver<PublicBookingInput>,
    defaultValues: {
      arrival: search.arrival, departure: search.departure, adults: search.adults, children: search.children, source: search.source, roomTypeId,
      title: "MR", firstName: "", lastName: "", email: "", phone: "", address: "", city: "", postal: "", country: "Indonesia", state: "",
      nationality: "Indonesia", idType: "KTP", idNumber: "", birthCity: "", paymentMethod: "CASH", cardType: "", cardNumber: "", cardExpiry: "", notes: "",
    },
  });
  const payment = watch("paymentMethod");
  const err = (k: FieldPath<PublicBookingInput>) => (errors as Record<string, { message?: string } | undefined>)[k]?.message;
  const submit = (data: PublicBookingInput) => start(async () => {
    setMessage(null);
    const r = await createPublicBooking(data);
    if (!r.ok) {
      setMessage(r.message);
      for (const [k, m] of Object.entries(r.fieldErrors ?? {})) if (m?.[0]) setError(k as FieldPath<PublicBookingInput>, { message: m[0] });
      return;
    }
    router.push(`/book/confirmation/${r.data.id}`);
  });
  const opt = (label: string, value: "CASH" | "CREDIT", desc: string) => (
    <label className={cn("flex items-start gap-3 border p-3 cursor-pointer hover:border-accent-2", payment === value ? "border-accent" : "border-line")}>
      <input type="radio" value={value} {...register("paymentMethod")} className="mt-1 accent-accent cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" />
      <span><span className="block text-[13px]">{label}</span><span className="block text-[11px] text-muted">{desc}</span></span>
    </label>
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {(["arrival", "departure", "adults", "children", "source", "roomTypeId"] as const).map((k) => <input key={k} type="hidden" {...register(k, k === "adults" || k === "children" ? { valueAsNumber: true } : undefined)} />)}

      <Panel title="Data tamu">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <Field label="Sapaan"><Select {...register("title")}><option value="MR">Mr.</option><option value="MRS">Mrs.</option><option value="MISS">Miss</option><option value="DR">Dr.</option></Select></Field>
            <Field label="Nama depan *" error={err("firstName")}><Input {...register("firstName")} aria-invalid={!!err("firstName")} autoComplete="given-name" /></Field>
          </div>
          <Field label="Nama belakang *" error={err("lastName")}><Input {...register("lastName")} aria-invalid={!!err("lastName")} autoComplete="family-name" /></Field>
          <Field label="Email *" error={err("email")}><Input type="email" {...register("email")} aria-invalid={!!err("email")} autoComplete="email" /></Field>
          <Field label="Telepon *" error={err("phone")}><Input {...register("phone")} aria-invalid={!!err("phone")} autoComplete="tel" /></Field>
          <Field label="Alamat *" error={err("address")} className="md:col-span-2"><Input {...register("address")} aria-invalid={!!err("address")} autoComplete="street-address" /></Field>
          <Field label="Kota *" error={err("city")}><Input {...register("city")} aria-invalid={!!err("city")} /></Field>
          <Field label="Provinsi / State *" error={err("state")}><Input {...register("state")} aria-invalid={!!err("state")} /></Field>
          <Field label="Kode pos *" error={err("postal")}><Input {...register("postal")} aria-invalid={!!err("postal")} autoComplete="postal-code" /></Field>
          <Field label="Negara *" error={err("country")}><Input {...register("country")} aria-invalid={!!err("country")} autoComplete="country-name" /></Field>
        </div>
      </Panel>

      <Panel title="Identitas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Jenis identitas *"><Select {...register("idType")}><option value="KTP">KTP</option><option value="SIM">SIM</option><option value="PASSPORT">Passport</option></Select></Field>
          <Field label="Nomor identitas *" error={err("idNumber")}><Input {...register("idNumber")} aria-invalid={!!err("idNumber")} /></Field>
          <Field label="Kewarganegaraan *" error={err("nationality")}><Input {...register("nationality")} aria-invalid={!!err("nationality")} /></Field>
          <Field label="Kota kelahiran *" error={err("birthCity")}><Input {...register("birthCity")} aria-invalid={!!err("birthCity")} /></Field>
        </div>
      </Panel>

      <Panel title="Metode pembayaran">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {opt("Bayar di hotel", "CASH", "Tunai atau kartu saat check-in di resepsionis.")}
          {opt("Kartu kredit", "CREDIT", "Visa / Mastercard. Simulasi: hanya 4 digit terakhir yang disimpan.")}
        </div>
        {payment === "CREDIT" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field label="Jenis kartu *" error={err("cardType")}><Select {...register("cardType")} aria-invalid={!!err("cardType")}><option value="">Pilih</option><option value="VISA">Visa</option><option value="MASTERCARD">Mastercard</option></Select></Field>
            <Field label="Nomor kartu *" error={err("cardNumber")}><Input {...register("cardNumber")} inputMode="numeric" placeholder="4111 1111 1111 1111" aria-invalid={!!err("cardNumber")} /></Field>
            <Field label="Berlaku hingga *" error={err("cardExpiry")}><Input {...register("cardExpiry")} placeholder="MM/YY" aria-invalid={!!err("cardExpiry")} /></Field>
          </div>
        )}
      </Panel>

      <Panel title="Permintaan khusus">
        <Textarea {...register("notes")} placeholder="Contoh: kamar lantai atas, jauh dari lift, late check-in…" />
      </Panel>

      {message && <p className="text-[12px] text-danger" role="alert">{message}</p>}
      <div className="flex justify-end">
        <Button type="submit" loading={pending} className="px-8 py-3">Booking sekarang</Button>
      </div>
    </form>
  );
}
