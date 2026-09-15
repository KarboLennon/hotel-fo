import { format } from "date-fns";
export const formatMoney = (n: number) => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const formatDate = (d: Date) => format(d, "dd MMM yyyy");
export const formatDateTime = (d: Date) => format(d, "dd MMM yyyy HH:mm");
export const toDateInput = (d: Date) => format(d, "yyyy-MM-dd");
export const toTimeInput = (d: Date) => format(d, "HH:mm");
export const dayName = (d: Date) => format(d, "EEEE");
