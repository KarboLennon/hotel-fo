import { z } from "zod";
export const MESSAGE_TYPES = ["telephoned", "returnedYourCall", "pleaseCall", "willCallAgain", "cameToSeeYou", "wantToSeeYou", "rush", "special"] as const;
export const MESSAGE_TYPE_LABEL: Record<(typeof MESSAGE_TYPES)[number], string> = {
  telephoned: "Telephoned", returnedYourCall: "Returned Your Call", pleaseCall: "Please Call", willCallAgain: "Will call again",
  cameToSeeYou: "Came to see you", wantToSeeYou: "Want to see you", rush: "Rush", special: "Special",
};
export const guestMessageSchema = z.object({
  guestId: z.string().min(1, "Pilih tamu"), roomId: z.string().min(1, "Pilih tamu"),
  fromName: z.string().trim().min(1, "Wajib diisi"), company: z.string().trim().optional(), phone: z.string().trim().optional(),
  message: z.string().trim().min(1, "Pesan wajib diisi"),
  telephoned: z.boolean(), returnedYourCall: z.boolean(), pleaseCall: z.boolean(), willCallAgain: z.boolean(),
  cameToSeeYou: z.boolean(), wantToSeeYou: z.boolean(), rush: z.boolean(), special: z.boolean(), delivered: z.boolean(),
});
export type GuestMessageInput = z.infer<typeof guestMessageSchema>;
