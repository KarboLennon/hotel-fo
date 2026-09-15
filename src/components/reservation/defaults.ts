import type { ReservationInput } from "@/lib/validation/reservation";
import type { ReservationOptions } from "@/server/queries/options";
import type { ReservationDetail } from "@/server/queries/reservations";
import { departureFromNights, parseTime } from "@/server/services/dates";
import { toDateInput, toTimeInput } from "@/lib/format";
import { toGuestInput } from "@/server/queries/guests";

export const emptyGuest = (): ReservationInput["guest"] => ({
  title: "MR", firstName: "", lastName: "", address: "", city: "", postal: "", country: "Indonesia", email: "", phone: "",
  idType: "KTP", idNumber: "", idExpMonth: undefined, idExpYear: undefined, idLifetime: false, nationality: "Indonesia", state: "",
  birthDate: "", birthCity: "", birthState: "", birthCountry: "", gender: "", guestType: "REGULAR", occupation: "", photoUrl: "",
});

export function newReservationDefaults(opts: ReservationOptions, q: { roomId?: string; date: Date }): ReservationInput {
  const roomType = opts.roomTypes.find((t) => t.rooms.some((r) => r.id === q.roomId)) ?? opts.roomTypes[0];
  const arrival = new Date(q.date); const ci = parseTime(opts.settings.checkInTime); arrival.setHours(ci.hour, ci.minute, 0, 0);
  const departure = departureFromNights(arrival, 1, parseTime(opts.settings.checkOutTime));
  const walkIn = opts.marketPlaces.find((m) => m.name === "Walk In") ?? opts.marketPlaces[0];
  return {
    guestId: undefined, guest: emptyGuest(),
    arrivalDate: toDateInput(arrival), arrivalTime: toTimeInput(arrival), departureDate: toDateInput(departure), departureTime: toTimeInput(departure),
    nights: 1, adults: 1, children: 0, infants: 0,
    roomTypeId: roomType?.id ?? "", roomId: q.roomId ?? "", rateTypeId: opts.rateTypes.find((r) => r.name === "Daily")?.id ?? opts.rateTypes[0]?.id ?? "",
    marketPlaceId: walkIn?.id ?? "", sourceId: undefined,
    settlementMethod: "CASH", cardType: "", cardNumber: "", cardExpiry: "", voucherNo: "", notes: "", specialRequests: [],
  };
}

export function detailToFormValues(d: ReservationDetail): ReservationInput {
  const { id: guestId, ...guest } = toGuestInput(d.guest);
  return {
    guestId, guest,
    arrivalDate: toDateInput(d.arrival), arrivalTime: toTimeInput(d.arrival), departureDate: toDateInput(d.departure), departureTime: toTimeInput(d.departure),
    nights: d.nights, adults: d.adults, children: d.children, infants: d.infants,
    roomTypeId: d.room.roomTypeId, roomId: d.roomId, rateTypeId: d.rateTypeId, marketPlaceId: d.marketPlaceId, sourceId: d.sourceId ?? undefined,
    settlementMethod: d.settlementMethod, cardType: d.cardType ?? "", cardNumber: d.cardLast4 ? `**** ${d.cardLast4}` : "", cardExpiry: d.cardExpiry ?? "",
    voucherNo: d.voucherNo ?? "", notes: d.notes ?? "", specialRequests: d.specialRequests.map((s) => ({ itemId: s.itemId, qty: s.qty })),
  };
}
