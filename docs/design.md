# Hotel Front Office — Design Spec

Date: 2026-09-15
Source: `MODUL HOTEL SISTEM-FRONT OFFICE.pdf` (13 halaman, spec + screenshot PMS desktop)
Status: approved in brainstorming, pending written review

## 1. Goal

Remake modul Front Office dari PDF menjadi aplikasi web full-stack. Fungsi dan isi layar mengikuti PDF. Tampilan **tidak** mengikuti PDF; memakai design DNA yang diekstrak dari referensi booking engine Hotel Mulia (lihat §6).

Scope: single hotel, deploy di VPS/cloud, login staff. Multi-tenant tidak dibangun sekarang; skema dibuat agar penambahan `hotelId` nanti tidak memerlukan restrukturisasi.

## 2. Tech stack

| Layer | Pilihan |
| --- | --- |
| Framework | Next.js 15 (App Router), TypeScript strict |
| UI | Tailwind CSS, shadcn/ui (theme di-override ke DNA Mulia), TanStack Table |
| Form | react-hook-form + zod (schema dipakai di client dan server) |
| Data | Prisma ORM, PostgreSQL |
| Auth | Auth.js (credentials provider, session cookie) |
| Test | Vitest (services), Playwright (satu happy path) |
| Deploy | Dockerfile + docker-compose (app + postgres). Kompatibel Coolify/Dokploy atau Vercel + Neon |

Tidak ada REST API terpisah. Semua mutasi lewat Server Actions; semua pembacaan lewat Server Components.

## 3. Struktur project

```
hotel/
  prisma/schema.prisma, seed.ts
  src/app/
    (auth)/login/
    (app)/layout.tsx            # nav atas
    (app)/page.tsx              # dashboard (?view=room|list|stay&date=)
    (app)/reservations/         # list, new, [id], [id]/checkout, [id]/print
    (app)/out-of-order/
    (app)/guest-ledger/
    (app)/guests/
    (app)/guest-messages/
  src/components/ui/            # shadcn primitives
  src/components/dashboard/     # StatusCounters, FloorTabs, RoomGrid, RoomCard, RoomListTable, StayTimeline
  src/components/reservation/   # ReservationForm + panel: GuestInfo, SettlementOption, StayInfo, RateInfo, BusinessSource, Documentation, SpecialRequests, GuestRemark
  src/components/data-table/    # wrapper TanStack Table
  src/server/actions/           # per modul, tipis: validasi → service → prisma → revalidatePath
  src/server/services/          # logika bisnis murni, tanpa prisma, di-unit-test
  src/server/db.ts
  src/lib/validation/           # zod schemas
  src/lib/constants.ts
  Dockerfile, docker-compose.yml
```

Prinsip: komponen UI tidak mengimpor Prisma. Services tidak mengimpor Prisma. Actions adalah satu-satunya tempat keduanya bertemu.

## 4. Model data (Prisma)

### Master

- `RoomType` — id, name, baseRate.
- `Room` — id, number, floor, roomTypeId, isDirty (bool). **Tidak ada kolom status**; status diturunkan (§5.1).
- `RateType` — id, name (Daily, Weekday, Weekend, Continental Plan, American Plan). `RateTypeRoomTypeRate` — rateTypeId, roomTypeId, rate.
- `MarketPlace` — id, name, requiresSource (bool; true untuk Travel Agent).
- `Source` — id, name (Traveloka, Tiket.com, Booking.com, Agoda).
- `SpecialRequestItem` — id, name, price.
- `User` — id, name, email, passwordHash, role (ADMIN | RECEPTIONIST).
- `Setting` — key/value: taxPercent, checkInTime, checkOutTime.

### Transaksi

- `Guest` — title (MR | MRS | DR | MISS), firstName, lastName, address, city, postal, country, email, phone, idType (KTP | SIM | PASSPORT), idNumber, idExpMonth, idExpYear, idLifetime (bool), nationality, state, birthDate, birthCity, birthState, birthCountry, gender, guestType (REGULAR | REPEAT | VIP), occupation, photoUrl.
- `Reservation` — number (`RESN0001`, auto), guestId, roomId, rateTypeId, marketPlaceId, sourceId?, arrival (datetime), departure (datetime), nights, adults, children, infants, status (RESERVED | CHECKED_IN | CHECKED_OUT | CANCELLED | NO_SHOW | VOID), settlementMethod (CASH | CREDIT), cardType (CASH | VISA | MASTERCARD)?, cardLast4?, cardExpiry?, voucherNo?, notes, bookedById, checkedInById?, checkedOutById?, checkedInAt?, checkedOutAt?, createdAt, updatedAt.
- `Folio` — number (`F0001`, auto), reservationId (unique). `FolioLine` — folioId, kind (ROOM_CHARGE | TAX | EXTRA | SPECIAL_REQUEST | PAYMENT | DEPOSIT), description, amount (signed: payment negatif), date.
- `ReservationSpecialRequest` — reservationId, itemId, qty.
- `OutOfOrder` — roomId, fromDate, toDate?, remark, createdById.
- `GuestMessage` — roomId, guestId, fromName, company, phone, message, telephoned, returnedYourCall, pleaseCall, willCallAgain, cameToSeeYou, wantToSeeYou, rush, special (semua bool), delivered (bool), createdAt.

### Keputusan

- Nomor kartu kredit disimpan hanya 4 digit terakhir. Nomor penuh tidak pernah masuk DB.
- Nomor `RESN`/`F` dibuat dari sequence Postgres, diformat di service.
- Semua tanggal disimpan UTC; timezone hotel dari Setting (default Asia/Jakarta) dipakai untuk "hari ini".

## 5. Logika bisnis (services)

### 5.1 Status kamar (derived)

`deriveRoomStatus(room, activeReservations, activeOOO, today)` mengembalikan salah satu:

1. `OUT_OF_ORDER` jika ada OutOfOrder aktif untuk tanggal tersebut.
2. `OCCUPIED` jika ada Reservation CHECKED_IN yang mencakup tanggal.
3. `RESERVED` jika ada Reservation RESERVED dengan arrival = tanggal.
4. `VACANT` selain itu.

Flag terpisah: `isDirty` (dari Room), `isDueOut` (CHECKED_IN dan departure = today). Counter dashboard: Vacant, Occupied, Reserved, O/O, Due Out, Dirty, All.

### 5.2 Nights ↔ Departure

- `departureFromNights(arrival, nights, checkOutTime)`; `nightsFromDates(arrival, departure)` = selisih hari kalender, minimal 1.
- Di form: mengubah salah satu memperbarui yang lain. Sumber kebenaran yang disimpan: arrival + departure; nights disimpan untuk query.

### 5.3 Availability

`isRoomAvailable(roomId, arrival, departure, excludeReservationId?)`: tidak ada Reservation status RESERVED/CHECKED_IN yang overlap `[arrival, departure)` dan tidak ada OutOfOrder overlap. Dicek di server dalam transaksi saat create/update/check-in.

### 5.4 Rate

`calculateRate({ rateTypeRate, nights, taxPercent, extras, specialRequests, payments })` → total, tax, extra, grandTotal, paid, balance. Dipakai live di form (client) dan saat menulis FolioLine (server), dari fungsi yang sama.

### 5.5 Transisi status

```
RESERVED   → CHECKED_IN (check in)   | CANCELLED | NO_SHOW | VOID
CHECKED_IN → CHECKED_OUT (settle)
lainnya    → terminal
```

`nextStatus(current, action)` melempar error jika transisi tidak valid. Check-in menulis FolioLine ROOM_CHARGE per malam + TAX. Check-out mensyaratkan balance = 0, lalu set `Room.isDirty = true`.

### 5.6 Penomoran

`formatReservationNumber(seq)` → `RESN` + 4 digit padding (tumbuh otomatis jika > 9999). `formatFolioNumber(seq)` → `F` + 4 digit.

## 6. Design system (DNA Mulia)

Diekstrak via `hallmark study` dari `be.synxis.com` (Hotel Mulia Senayan). Yang diambil adalah DNA, bukan pixel.

Token (`src/app/globals.css`, `:root`):

```
--color-paper:      #ffffff   oklch(100% 0 0)
--color-paper-2:    #f5f4f2
--color-paper-3:    #e6e6e6   oklch(92.5% 0 90)
--color-ink:        #2b201a   oklch(25.5% 0.020 50)
--color-muted:      #666666   oklch(51.0% 0 90)
--color-line:       #c5c5c5   oklch(82.3% 0 90)
--color-accent:     #a58243   oklch(62.7% 0.092 80)   /* gold: tombol utama, tab aktif */
--color-accent-2:   #876c3b   oklch(54.7% 0.075 81)   /* link, judul seksi */
--status-vacant:    #5b8a5e
--status-occupied:  #a58243
--status-reserved:  #4a6fa5
--status-dirty:     #b0483a
--status-ooo:       #7a7a7a
--font-display:     "Playfair Display", serif      /* judul halaman, nomor kamar, angka besar */
--font-body:        Roboto, sans-serif             /* body, tabel, form */
--font-label:       Montserrat, sans-serif         /* label seksi, nav, tombol: uppercase, tracking .12–.15em */
--radius:           0px
```

Aturan:

- Radius 0 di semua elemen. Border 1px `--color-line`. Tidak ada box-shadow, gradient, glassmorphism.
- Emas hanya untuk: tombol primer, tab/nav aktif, judul seksi form, link. Tidak untuk latar area besar.
- Warna status hanya di strip kiri kartu kamar, bar Stay View, dan teks status. Tidak menjadi latar penuh.
- Semua warna dan font di komponen mereferensikan token, tidak ada nilai literal.
- Setiap komponen interaktif punya state: default, hover, focus-visible, active, disabled, loading, error, success.
- Heading selalu roman; tidak ada italic di judul.
- Layout: nav atas (wordmark serif + link uppercase + tanggal + user). Konten full-width, padding 24px.

## 7. Layar

### Dashboard `/` (`?view=room|list|stay&date=YYYY-MM-DD&status=`)

- Header: judul "Room View" / "List View" / "Stay View" (display), tab switcher, date picker.
- Counter strip: 7 kotak bergaris. Klik = filter `status`.
- **Room View**: tab lantai, grid kartu (nomor display, tipe, nama tamu atau status). Klik vacant → `/reservations/new?roomId=`. Klik lainnya → `/reservations/[id]`.
- **List View**: tabel semua kamar; kolom Room, Room Type, Guest Name, Arrival, Departure, Folio#, Reservation#, Voucher#, Source, Rate Type, Balance, Pax. Sticky header, scroll horizontal di dalam container.
- **Stay View**: CSS grid; kolom kiri kamar, header hari (7/15/30), tombol Today/prev/next. Reservasi = bar berwarna status; klik → detail.

### Reservation `/reservations`

- List: radio Active/Cancelled/No Show/Void/All, search, tabel Res.No, Room, Last Name, Res.Date, Arrival, Departure, Source, Voucher No. Warna teks baris: void merah, no-show oranye, cancelled biru, active hijau. Tombol New, Edit, Void.
- Form `/reservations/new`, `/reservations/[id]`: tiga kolom. Panel: Guest Information (tombol cari tamu → autofill dari Guest), Settlement Option, Stay Information, Rate Information (live), Business Source (Source muncul jika MarketPlace.requiresSource), Documentation (Res#, Folio#, Voucher#), Special Request (add item + qty), Guest Remark.
- Field wajib (bertanda * di PDF): firstName, lastName, address, city, postal, country, email, idType, idNumber, idExp (atau lifetime), nationality, state, birthCity.
- Tombol per status: RESERVED → Check In, Update, Void, Print. CHECKED_IN → Check Out, Update, Print. Terminal → Print saja.
- `/reservations/[id]/checkout`: ringkasan folio, input pembayaran (metode, jumlah), tombol Settle (aktif jika balance 0 setelah pembayaran).
- `/reservations/[id]/print`: bukti reservasi, CSS `@media print`.

### Out of Order `/out-of-order`

Tabel Date, O/O Date, Room Type, Room, Remark. Mark O/O → dialog (room, from, to, remark). Unmark → set toDate = hari ini.

### Guest Ledger `/guest-ledger`

Filter: From/To date, Guest Name, Market Place, Source, Room Type, Looking For (In House | Checked Out | Reserved). Tabel folio: Room, Booking#, Reservation#, Folio#, Arrival, Departure, Guest Name, Email, Phone, Identity#, Booked By, Source, Room Type, Rate Type, Balance, Pax. Footer total balance. Tombol Revenue Break Down → dialog ringkasan per kind FolioLine.

### Guest Database `/guests`

Search: last name, first name, ID number, phone, checkbox In House Only. Tabel: Guest Type, Name, Country, Source, Email, City, Phone. Tombol New/Edit/Delete. Delete ditolak jika ada Reservation.

### Guest Messages `/guest-messages`

Tabel Room, First Name, Last Name, From, Message, Company, Phone, Date. Checkbox Undelivered only. Dialog: pilih tamu in-house (room terisi otomatis), From, Company, Phone, Message, 8 checkbox tipe, Delivered.

### Login `/login`

Email + password. Tidak ada registrasi. User dari seed / admin.

## 8. Error handling

- Zod schema sama di client dan server. Error per field.
- Konflik kamar dicek dalam transaksi; error dikembalikan ke field Room.
- Transisi status tidak valid → error toast, tidak ada perubahan.
- Server action selalu mengembalikan `{ ok: true, data } | { ok: false, fieldErrors?, message? }`.
- Halaman `error.tsx` dan `not-found.tsx` per segmen.

## 9. Testing

- Vitest, `src/server/services/*.test.ts`: deriveRoomStatus, nights↔departure, availability overlap, calculateRate, nextStatus, penomoran.
- Playwright, satu alur: login → new reservation → muncul di Room View sebagai reserved → check in → occupied → check out (settle) → dirty → muncul di Guest Ledger sebagai checked out.

## 10. Di luar scope tahap ini

Room Sharing, Meal Plan, tab Other Information / Extra Charges / Payment Details terpisah, multi-tenant, housekeeping module, laporan, email/WhatsApp notifikasi, pembayaran online.

## 11. Seed

RoomType: King Suite, Super Deluxe, Presidential. Room: 101–109 Super Deluxe (Ground Floor), 1001–1009 King Suite, 2001–2008 Presidential (First Floor). RateType lima buah dengan rate per RoomType. MarketPlace empat, Source empat. SpecialRequestItem: Extra Bed, Hair Dryer, Baby Cot. User admin (`admin@hotel.local`) dan satu resepsionis. Setting taxPercent 21, checkIn 14:00, checkOut 12:00.
