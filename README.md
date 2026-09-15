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

1. Di server, buat `.env` di folder project berisi `AUTH_SECRET` dan `ADMIN_PASSWORD`
   (dibaca otomatis oleh `docker compose`):

   ```bash
   printf 'AUTH_SECRET=%s\nADMIN_PASSWORD=ganti-password-ini\nDOMAIN=namadomain.id\n' "$(openssl rand -base64 32)" > .env
   ```

2. Build dan jalankan: `docker compose up -d --build`
   Service `migrate` menjalankan `prisma migrate deploy` lalu selesai; `app` baru start setelah
   migrasi sukses. `db` dan `app` memakai `restart: unless-stopped`.

3. Seed sekali setelah container jalan (user admin, data master, dan data demo untuk praktik):

   ```bash
   docker compose run --rm seed
   ```

   Tambahkan `-e NODE_ENV=production` sebelum `seed` untuk melewati data demo dan akun
   resepsionis demo. Seed aman diulang: data yang sudah ada dilewati, password admin ikut
   diperbarui dari `ADMIN_PASSWORD`.

4. Update versi: `git pull && docker compose up -d --build` (migrasi baru ikut diterapkan),
   atau cukup `git push` ke `main` bila CI/CD sudah aktif (lihat bawah).

## CI/CD (GitHub Actions)

Setiap push ke `main` menjalankan `.github/workflows/deploy.yml`:

1. **test** — `tsc --noEmit`, ESLint, unit test (Vitest), dan `next build`.
2. **deploy** — hanya jika test lulus: SSH ke server, checkout commit tersebut,
   `docker compose up -d --build`, lalu menunggu app membalas 200 sebelum dinyatakan sukses
   (skrip: `deploy/remote-deploy.sh`).

Secret yang dipakai (Settings → Secrets → Actions): `DEPLOY_HOST`, `DEPLOY_USER`,
`DEPLOY_SSH_KEY` (private key), `DEPLOY_KNOWN_HOSTS` (host key server, dipin agar aman dari
serangan MITM). Token untuk `git fetch` di server dibuat otomatis per run, jadi tidak ada
kredensial yang tersimpan di VPS.

Syarat di server: public key deploy ada di `~/.ssh/authorized_keys`, repo sudah ter-clone di
`/opt/hotel`, dan `.env` berisi `AUTH_SECRET`, `ADMIN_PASSWORD`, `DOMAIN`.

Caddy (service `caddy`) menyediakan HTTPS otomatis untuk `DOMAIN` dan `www.DOMAIN`: record A
keduanya harus mengarah ke server dan port 80/443 terbuka. Aplikasi: `https://DOMAIN` (booking
tamu) dan `https://DOMAIN/login` (Front Office).
