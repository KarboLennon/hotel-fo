export function formatReservationNumber(seq: number): string { return `RESN${String(seq).padStart(4, "0")}`; }
export function formatFolioNumber(seq: number): string { return `F${String(seq).padStart(4, "0")}`; }
export function parseReservationNumber(text: string): number | null {
  const m = /^RESN(\d+)$/i.exec(text.trim());
  return m ? Number(m[1]) : null;
}
