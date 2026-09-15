"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { reservationSchema, type ReservationInput } from "@/lib/validation/reservation";
import type { ReservationOptions } from "@/server/queries/options";
import { saveReservation, getAvailableRooms } from "@/server/actions/reservations";
import { calculateRate } from "@/server/services/rate";
import { combineDateTime, departureFromNights, nightsFromDates, parseTime } from "@/server/services/dates";
import { toDateInput, toTimeInput, formatMoney, dayName } from "@/lib/format";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { GuestSearchDialog } from "./guest-search-dialog";
import type { GuestSummary } from "@/server/queries/guests";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + i);

export function ReservationForm({ options, defaultValues, reservationId, locked = false, docs }: {
  options: ReservationOptions; defaultValues: ReservationInput; reservationId?: string; locked?: boolean;
  docs?: { number: string; folioNumber: string | null };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [guestDialog, setGuestDialog] = useState(false);
  // Seeded with the current room (if any) so its <option> exists on first paint — otherwise the
  // native <select> has no matching option yet, react-hook-form's uncontrolled ref reads back "",
  // and the deep-linked/edited room is lost even after the real list loads (options are additive,
  // not re-selected on an uncontrolled <select>).
  const [rooms, setRooms] = useState<{ id: string; number: string }[]>(() => {
    const initial = options.roomTypes.flatMap((t) => t.rooms).find((r) => r.id === defaultValues.roomId);
    return initial ? [initial] : [];
  });
  // zodResolver's inferred generic doesn't line up with ReservationInput under zod 4 + resolvers 5; cast is documented here per task brief.
  const form = useForm<ReservationInput>({ resolver: zodResolver(reservationSchema) as Resolver<ReservationInput>, defaultValues, disabled: locked });
  const { register, watch, setValue, getValues, setError, control, handleSubmit, formState: { errors } } = form;
  const sr = useFieldArray({ control, name: "specialRequests" });

  const w = watch();
  const checkOut = parseTime(options.settings.checkOutTime);
  const marketPlace = options.marketPlaces.find((m) => m.id === w.marketPlaceId);
  const ratePerNight = useMemo(() => {
    const row = options.rates.find((r) => r.rateTypeId === w.rateTypeId && r.roomTypeId === w.roomTypeId);
    return row?.rate ?? options.roomTypes.find((t) => t.id === w.roomTypeId)?.baseRate ?? 0;
  }, [options, w.rateTypeId, w.roomTypeId]);
  const rate = calculateRate({
    ratePerNight, nights: w.nights || 1, taxPercent: options.settings.taxPercent,
    specialRequests: (w.specialRequests ?? []).map((s) => ({ price: options.items.find((i) => i.id === s.itemId)?.price ?? 0, qty: s.qty || 0 })),
  });

  // arrival/nights/departure sync
  const onArrivalOrNights = () => {
    const { arrivalDate, arrivalTime, nights } = getValues();
    if (!arrivalDate || !arrivalTime) return;
    const dep = departureFromNights(combineDateTime(arrivalDate, arrivalTime), nights || 1, checkOut);
    setValue("departureDate", toDateInput(dep)); setValue("departureTime", toTimeInput(dep));
  };
  const onDeparture = () => {
    const { arrivalDate, arrivalTime, departureDate, departureTime } = getValues();
    if (!arrivalDate || !departureDate) return;
    setValue("nights", nightsFromDates(combineDateTime(arrivalDate, arrivalTime), combineDateTime(departureDate, departureTime)));
  };

  // available rooms for type + dates
  useEffect(() => {
    let alive = true;
    getAvailableRooms(w.roomTypeId, w.arrivalDate, w.departureDate, reservationId).then((list) => {
      if (!alive) return;
      const current = getValues("roomId");
      const currentRoomType = getValues("roomTypeId");
      const keep = current && (
        list.some((r) => r.id === current) ||
        (current === defaultValues.roomId && currentRoomType === defaultValues.roomTypeId)
      );
      const currentRoom = options.roomTypes.flatMap((t) => t.rooms).find((r) => r.id === current);
      setRooms(keep && currentRoom && !list.some((r) => r.id === current) ? [currentRoom, ...list] : list);
      if (!keep) setValue("roomId", "");
    });
    return () => { alive = false; };
    // getValues/setValue/options/reservationId/defaultValues are stable for the component's
    // lifetime; this effect must only re-run on room type / date changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.roomTypeId, w.arrivalDate, w.departureDate]);

  const pickGuest = (g: GuestSummary) => {
    const { id, ...guest } = g;
    setValue("guestId", id);
    (Object.keys(guest) as (keyof typeof guest)[]).forEach((k) => setValue(`guest.${k}` as FieldPath<ReservationInput>, guest[k] as never));
  };

  const onSubmit = (data: ReservationInput) => start(async () => {
    setMessage(null);
    const res = await saveReservation(data, reservationId);
    if (!res.ok) {
      setMessage(res.message);
      for (const [k, msgs] of Object.entries(res.fieldErrors ?? {})) if (msgs?.length) setError(k as FieldPath<ReservationInput>, { message: msgs[0] });
      return;
    }
    router.push(`/reservations/${res.data.id}`);
    router.refresh();
  });

  const err = (path: string) => { const e = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], errors) as { message?: string } | undefined; return e?.message; };
  const arrivalDay = w.arrivalDate ? dayName(combineDateTime(w.arrivalDate, "00:00")) : "";
  const departureDay = w.departureDate ? dayName(combineDateTime(w.departureDate, "00:00")) : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-4" noValidate>
      {/* Column 1 */}
      <div className="space-y-4">
        <Panel title="Guest Information" actions={!locked && <Button type="button" variant="ghost" size="sm" onClick={() => setGuestDialog(true)}><Search size={12} /> Find</Button>}>
          <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
            <Field label="Title"><Select {...register("guest.title")}><option value="MR">Mr.</option><option value="MRS">Mrs.</option><option value="DR">Dr.</option><option value="MISS">Miss</option></Select></Field>
            <Field label="Last name *" error={err("guest.lastName")}><Input {...register("guest.lastName")} aria-invalid={!!err("guest.lastName")} /></Field>
          </div>
          <Field label="First name *" error={err("guest.firstName")} className="mt-2"><Input {...register("guest.firstName")} aria-invalid={!!err("guest.firstName")} /></Field>
          <p className="label mt-3 mb-1">Address</p>
          <Field label="Address *" error={err("guest.address")}><Input {...register("guest.address")} aria-invalid={!!err("guest.address")} /></Field>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="City *" error={err("guest.city")}><Input {...register("guest.city")} /></Field>
            <Field label="Postal *" error={err("guest.postal")}><Input {...register("guest.postal")} /></Field>
            <Field label="Country *" error={err("guest.country")}><Input {...register("guest.country")} /></Field>
            <Field label="State *" error={err("guest.state")}><Input {...register("guest.state")} /></Field>
          </div>
          <p className="label mt-3 mb-1">Contact</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Email *" error={err("guest.email")}><Input type="email" {...register("guest.email")} /></Field>
            <Field label="Phone"><Input {...register("guest.phone")} /></Field>
          </div>
          <p className="label mt-3 mb-1">Identity</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ID type *"><Select {...register("guest.idType")}><option value="KTP">KTP</option><option value="SIM">SIM</option><option value="PASSPORT">Passport</option></Select></Field>
            <Field label="ID number *" error={err("guest.idNumber")}><Input {...register("guest.idNumber")} /></Field>
            <Field label="Exp. month" error={err("guest.idExpMonth")}>
              <Select {...register("guest.idExpMonth", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} disabled={locked || w.guest?.idLifetime}>
                <option value="">—</option>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Exp. year">
              <Select {...register("guest.idExpYear", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} disabled={locked || w.guest?.idLifetime}>
                <option value="">—</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </Field>
            <Checkbox label="Lifetime" {...register("guest.idLifetime")} />
            <Field label="Nationality *" error={err("guest.nationality")}><Input {...register("guest.nationality")} /></Field>
          </div>
          <p className="label mt-3 mb-1">Birth</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Birth date"><Input type="date" {...register("guest.birthDate")} /></Field>
            <Field label="City *" error={err("guest.birthCity")}><Input {...register("guest.birthCity")} /></Field>
            <Field label="State"><Input {...register("guest.birthState")} /></Field>
            <Field label="Country"><Input {...register("guest.birthCountry")} /></Field>
          </div>
          <p className="label mt-3 mb-1">Other</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Gender"><Select {...register("guest.gender")}><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option></Select></Field>
            <Field label="Guest type"><Select {...register("guest.guestType")}><option value="REGULAR">Regular</option><option value="REPEAT">Repeat</option><option value="VIP">VIP</option></Select></Field>
            <Field label="Occupation"><Input {...register("guest.occupation")} /></Field>
            <Field label="Photo URL"><Input {...register("guest.photoUrl")} /></Field>
          </div>
        </Panel>

        <Panel title="Settlement Option">
          <div className="flex gap-4 mb-2 text-[12px]">
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" value="CASH" {...register("settlementMethod")} className="accent-accent cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" /> Cash</label>
            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" value="CREDIT" {...register("settlementMethod")} className="accent-accent cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent" /> Credit Card</label>
          </div>
          {w.settlementMethod === "CREDIT" && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Type" error={err("cardType")}><Select {...register("cardType")}><option value="">Select</option><option value="VISA">Visa Card</option><option value="MASTERCARD">Master Card</option></Select></Field>
              <Field label="Card number" hint="Hanya 4 digit terakhir yang disimpan"><Input {...register("cardNumber")} inputMode="numeric" /></Field>
              <Field label="Expired (MM/YY)"><Input {...register("cardExpiry")} placeholder="MM/YY" /></Field>
            </div>
          )}
        </Panel>

        <Panel title="Guest Remark">
          <Textarea {...register("notes")} placeholder="Special request: balcony room, no smoking room…" />
        </Panel>
      </div>

      {/* Column 2 */}
      <div className="space-y-4">
        <Panel title="Stay Information">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <Field label="Arrival *" error={err("arrivalDate")}><Input type="date" {...register("arrivalDate", { onChange: onArrivalOrNights })} /></Field>
            <Field label="Time"><Input type="time" {...register("arrivalTime", { onChange: onArrivalOrNights })} /></Field>
            <span className="text-[11px] text-muted pb-2 w-20">{arrivalDay}</span>
            <Field label="Departure *" error={err("departureDate")}><Input type="date" {...register("departureDate", { onChange: onDeparture })} /></Field>
            <Field label="Time"><Input type="time" {...register("departureTime", { onChange: onDeparture })} /></Field>
            <span className="text-[11px] text-muted pb-2 w-20">{departureDay}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <Field label="Nights" error={err("nights")}><Input type="number" min={1} {...register("nights", { valueAsNumber: true, onChange: onArrivalOrNights })} /></Field>
            <Field label="Adult" error={err("adults")}><Input type="number" min={1} {...register("adults", { valueAsNumber: true })} /></Field>
            <Field label="Child"><Input type="number" min={0} {...register("children", { valueAsNumber: true })} /></Field>
            <Field label="Infant" hint="< 3 th"><Input type="number" min={0} {...register("infants", { valueAsNumber: true })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="Room type *" error={err("roomTypeId")}>
              <Select {...register("roomTypeId", { onChange: () => setValue("roomId", "") })}>{options.roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
            </Field>
            <Field label="Room *" error={err("roomId")}>
              <Select {...register("roomId")} aria-invalid={!!err("roomId")}>
                <option value="">Select room</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.number}</option>)}
              </Select>
            </Field>
          </div>
        </Panel>

        <Panel title="Season & Rate Type Information">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Rate type *" error={err("rateTypeId")}>
              <Select {...register("rateTypeId")}>{options.rateTypes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
            </Field>
            <Field label="Rate / night"><Input value={formatMoney(ratePerNight)} readOnly disabled /></Field>
          </div>
        </Panel>

        <Panel title="Business Source Settings">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Market place *" error={err("marketPlaceId")}>
              <Select {...register("marketPlaceId", { onChange: (e) => { const mp = options.marketPlaces.find((m) => m.id === e.target.value); if (!mp?.requiresSource) setValue("sourceId", undefined); } })}>{options.marketPlaces.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select>
            </Field>
            {marketPlace?.requiresSource && (
              <Field label="Source *" error={err("sourceId")}>
                <Select {...register("sourceId")} aria-invalid={!!err("sourceId")}><option value="">Select source</option>{options.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
              </Field>
            )}
          </div>
        </Panel>

        <Panel title="Special Request" actions={!locked && <Button type="button" variant="ghost" size="sm" onClick={() => sr.append({ itemId: options.items[0]?.id ?? "", qty: 1 })}>Add item</Button>}>
          {sr.fields.length === 0 && <p className="text-[11px] text-muted">No special request.</p>}
          <div className="space-y-2">
            {sr.fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_70px_auto] gap-2 items-end">
                <Field label="Item" error={err(`specialRequests.${i}.itemId`)}>
                  <Select {...register(`specialRequests.${i}.itemId` as const)}>{options.items.map((it) => <option key={it.id} value={it.id}>{it.name} ({formatMoney(it.price)})</option>)}</Select>
                </Field>
                <Field label="Qty"><Input type="number" min={1} {...register(`specialRequests.${i}.qty` as const, { valueAsNumber: true })} /></Field>
                {!locked && <Button type="button" variant="danger" size="sm" onClick={() => sr.remove(i)}>×</Button>}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Column 3 */}
      <div className="space-y-4">
        <Panel title="Rate Information">
          <dl className="text-[12px]">
            {[["Room charge", rate.roomCharge], ["Tax", rate.tax], ["Extra", rate.extra], ["Total", rate.total]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-1.5 border-b border-line-soft"><dt className="text-muted">{k}</dt><dd className="tabular-nums">{formatMoney(v as number)}</dd></div>
            ))}
            <div className="flex justify-between items-center py-2 bg-paper-2 -mx-3 px-3 mt-1"><dt className="label text-ink">Balance</dt><dd className="display text-base tabular-nums">{formatMoney(rate.balance)}</dd></div>
          </dl>
          <p className="text-[10px] text-muted mt-2">Tax {options.settings.taxPercent}%. Pembayaran dicatat saat check-in/checkout di folio.</p>
        </Panel>

        <Panel title="Documentation Information">
          <div className="grid grid-cols-1 gap-2">
            <Field label="Reservation #"><Input value={docs?.number ?? "auto"} readOnly disabled /></Field>
            <Field label="Folio #"><Input value={docs?.folioNumber ?? "auto"} readOnly disabled /></Field>
            <Field label="Voucher #"><Input {...register("voucherNo")} /></Field>
          </div>
        </Panel>

        {!locked && (
          <div className="flex flex-col gap-2">
            {message && <p className="text-[12px] text-danger" role="alert">{message}</p>}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Close</Button>
              <Button type="submit" loading={pending}>{reservationId ? "Update" : "Reserve"}</Button>
            </div>
          </div>
        )}
      </div>

      <GuestSearchDialog open={guestDialog} onOpenChange={setGuestDialog} onPick={pickGuest} />
    </form>
  );
}
