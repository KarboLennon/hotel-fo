# Hotel Front Office

Aplikasi Front Office hotel: dashboard kamar (Room / List / Stay View), reservasi
(reserve → check in → check out), folio & pembayaran, out of order, guest ledger,
database tamu, dan guest messages. Spesifikasi lengkap ada di
`docs/design.md`.

## Stack

Next.js 15 (App Router, server actions) · TypeScript strict · Tailwind v4 (token-based
design system) · Prisma 6 + PostgreSQL · Auth.js (credentials) · react-hook-form + zod ·
Vitest (unit) · Playwright (e2e).

Struktur: logika murni di `src/server/services/` (tanpa Prisma, diuji unit), query baca di
`src/server/queries/`, server action di `src/server/actions/` (selalu mengembalikan
`ActionResult`, tidak pernah throw), komponen UI di `src/components/`.

## Setup lokal

1. Siapkan PostgreSQL (lokal atau `docker compose up -d db`).
2. Salin env: `cp .env.example .env`, lalu isi `DATABASE_URL` dan `AUTH_SECRET`
   (buat dengan `openssl rand -base64 32`).
3. Install dependency: `npm install`
4. Migrasi skema: `npx prisma migrate dev`
5. Isi data awal: `npx prisma db seed`
   (membuat `admin@hotel.local` / `ADMIN_PASSWORD`, default `admin123`, plus
   `fo@hotel.local` / `fo12345` khusus non-production)
6. Jalankan: `npm run dev` → http://localhost:3000

## Halaman

| Route | Siapa | Isi |
| --- | --- | --- |
| `/` | Tamu (tanpa login) | Simulasi booking engine: pilih tanggal, tamu, sumber booking (website / Traveloka / Tiket.com / Booking.com / Agoda) → pilih kamar → isi data → pembayaran → nomor reservasi RESN |
| `/book/rooms`, `/book/details`, `/book/confirmation/[id]` | Tamu | Langkah 2–4 alur booking |
| `/login` | Staff | Masuk ke Front Office |
| `/fo` | Staff (login) | Dashboard Room / List / Stay View, Reservation, Guest Ledger, Guests, Messages, Out of Order |

Booking dari halaman tamu dicatat atas nama user sistem `web@hotel.local` (tidak bisa login) dengan market place **Website** atau **Travel Agent + source** sesuai pilihan, dan langsung muncul di `/fo` sebagai *Reserved*.

## Test

```bash
npm run test         # unit (Vitest)
npm run e2e:install  # sekali saja: unduh browser Playwright
npm run e2e          # end-to-end, butuh DB ter-seed
npm run lint
npm run typecheck
```

`npm run e2e` menjalankan alur login → reservasi → check in → check out → guest ledger di
server dev pada port 3000. Pastikan port itu bebas sebelum dan sesudah menjalankannya.

## Deploy (Docker)

1. Siapkan env di host: `AUTH_SECRET` dan `ADMIN_PASSWORD` (wajib saat production —
   seed akan gagal bila kosong).

   ```bash
   export AUTH_SECRET=$(openssl rand -base64 32)
   export ADMIN_PASSWORD='ganti-password-ini'
   ```

2. Build dan jalankan: `docker compose up -d --build`
   Container app menjalankan `prisma migrate deploy` lalu `node server.js`, jadi skema
   selalu ikut naik. Kedua service memakai `restart: unless-stopped`.

3. Seed sekali saja setelah container jalan. Image runtime tidak memuat `tsx`, jadi seed
   dijalankan dari host terhadap database yang sama (publish port `5432` pada service `db`
   atau jalankan di jaringan yang sama):

   ```bash
   DATABASE_URL='postgresql://hotel:hotel@localhost:5432/hotel_fo?schema=public' \
   ADMIN_PASSWORD="$ADMIN_PASSWORD" NODE_ENV=production \
   npx prisma db seed
   ```

   Seed bersifat idempotent (upsert / `skipDuplicates`), aman diulang. Di production
   hanya user admin yang dibuat; resepsionis demo tidak ikut.
