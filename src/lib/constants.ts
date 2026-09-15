export const SCHOOL_NAME = "SMK Pariwisata Puspa Wisata PGRI Serpong";
export const SCHOOL_SHORT = "Puspa Wisata";

export const RESERVATION_STATUSES =["RESERVED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW", "VOID"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const ROOM_STATUSES = ["VACANT", "OCCUPIED", "RESERVED", "OUT_OF_ORDER"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const STATUS_FILTERS = ["VACANT", "OCCUPIED", "RESERVED", "OUT_OF_ORDER", "DUE_OUT", "DIRTY", "ALL"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  VACANT: "Vacant", OCCUPIED: "Occupied", RESERVED: "Reserved", OUT_OF_ORDER: "O/O",
  DUE_OUT: "Due Out", DIRTY: "Dirty", ALL: "All",
};

export const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  VACANT: "bg-status-vacant", OCCUPIED: "bg-status-occupied", RESERVED: "bg-status-reserved", OUT_OF_ORDER: "bg-status-ooo",
};

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  RESERVED: "Reserved", CHECKED_IN: "Checked In", CHECKED_OUT: "Checked Out",
  CANCELLED: "Cancelled", NO_SHOW: "No Show", VOID: "Void",
};

export const RESERVATION_STATUS_TEXT: Record<ReservationStatus, string> = {
  RESERVED: "text-success", CHECKED_IN: "text-success", CHECKED_OUT: "text-muted",
  CANCELLED: "text-status-reserved", NO_SHOW: "text-status-occupied", VOID: "text-danger",
};
