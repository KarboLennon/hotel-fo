export interface RateInput {
  ratePerNight: number;
  nights: number;
  taxPercent: number;
  extras?: number[];
  specialRequests?: { price: number; qty: number }[];
  payments?: number[];
}
export interface RateBreakdown { roomCharge: number; tax: number; extra: number; total: number; paid: number; balance: number }

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function calculateRate(i: RateInput): RateBreakdown {
  const roomCharge = round2(i.ratePerNight * Math.max(1, i.nights));
  const extra = round2(sum(i.extras ?? []) + sum((i.specialRequests ?? []).map((s) => s.price * s.qty)));
  const tax = round2((roomCharge * i.taxPercent) / 100);
  const total = round2(roomCharge + tax + extra);
  const paid = round2(sum(i.payments ?? []));
  return { roomCharge, tax, extra, total, paid, balance: round2(total - paid) };
}
