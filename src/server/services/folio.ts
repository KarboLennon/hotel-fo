import { addDays, format } from "date-fns";
import { calculateRate, round2 } from "./rate";

export interface FolioLineDraft {
  kind: "ROOM_CHARGE" | "TAX" | "SPECIAL_REQUEST";
  description: string;
  amount: number;
}

export interface CheckInLinesInput {
  arrival: Date;
  nights: number;
  ratePerNight: number;
  taxPercent: number;
  specialRequests: { name: string; price: number; qty: number }[];
}

/**
 * Folio lines written when a reservation is checked in: one ROOM_CHARGE per night,
 * one TAX line, one SPECIAL_REQUEST line per requested item. Amounts come from the
 * same calculateRate() the form previews, so folio and form can never disagree.
 */
export function buildCheckInLines(input: CheckInLinesInput): FolioLineDraft[] {
  const nights = Math.max(1, Math.floor(input.nights));
  const rate = calculateRate({ ratePerNight: input.ratePerNight, nights, taxPercent: input.taxPercent });
  return [
    ...Array.from({ length: nights }, (_, i): FolioLineDraft => ({
      kind: "ROOM_CHARGE",
      description: `Room charge ${format(addDays(input.arrival, i), "dd MMM yyyy")}`,
      amount: round2(input.ratePerNight),
    })),
    { kind: "TAX", description: `Tax ${input.taxPercent}%`, amount: rate.tax },
    ...input.specialRequests.map((s): FolioLineDraft => ({
      kind: "SPECIAL_REQUEST",
      description: `${s.name} × ${s.qty}`,
      amount: round2(s.price * s.qty),
    })),
  ];
}
