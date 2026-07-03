# HANDOFF — Portal Pengajuan SKPP Online (untuk sesi kerja TRACKER)

Dokumen ini merangkum keputusan & kondisi dari sesi sebelumnya (di repo
`skpp-admin`) supaya pekerjaan di repo **`skpp-tracker`** bisa dilanjutkan
tanpa kehilangan konteks. Dibuat 2026-07-03.

---

## 0. Gambaran sistem
Sistem SKPP (Badan Keuangan & Aset Daerah Prov NTT) terdiri dari:
- **Dashboard admin** — repo `skpp-admin` (`C:\Users\DELL\skpp-admin-main`,
  github `nttbakeuda-coder/skpp-admin`). React/Vite + `@supabase/supabase-js`.
  Staf internal memproses SKPP. Produksi = branch `main` → Vercel.
- **Tracker publik** — repo INI, `skpp-tracker` (`C:\Users\DELL\skpp-tracker`,
  github `nttbakeuda-coder/skpp-tracker`). React 19 / Vite 8, **tanpa**
  supabase-js (pakai `fetch` mentah). Warga melacak status SKPP.
- **Satu** Supabase produksi dipakai bersama: URL `https://phxyrferpnylgbbghgsn.supabase.co`.

## 1. Tujuan proyek "Pengajuan Online"
Menjadikan pengajuan SKPP **online**: **Bendahara OPD** (ajukan bulk untuk
banyak pegawai) & **Pegawai perorangan** (ajukan miliknya) mendaftar di portal
(digabung ke tracker), mengisi data + unggah berkas. Pengajuan masuk antrean →
loket verifikasi → masuk alur proses normal.

### Keputusan yang sudah dikunci
- Peran baru: **pemohon** (pegawai) & **bendahara**.
- Daftar pakai **email + verifikasi** (SMTP: **Resend**, kirim dari
  `noreply@sipasti.my.id`).
- Wajib **ACC admin** sebelum boleh mengajukan (anti-spam) → `akun_status` `pending`→`approved`.
- **CAPTCHA: Cloudflare Turnstile** (native Supabase Auth).
- **Jalur A/B ditentukan LOKET** saat verifikasi (form online TIDAK menanyakan jalur).
- Berkas: **PDF/JPG/PNG, maks 5 MB/file, maks 15 file/pengajuan**.
- Kepemilikan: pengajuan bendahara dimiliki akun bendahara; pegawai ybs tetap bisa **lacak** via kodeAkses.
- Portal **digabung** ke tracker ini (bukan app baru).

## 2. ⚠️ MASALAH PALING PENTING DI REPO INI (kerjakan DULUAN)
**Source git tracker USANG & tidak cocok dengan yang LIVE.**
- `src/App.jsx` (versi git, HEAD `7620d8f`) memakai metode LAMA: baca tabel
  `Pengajuan` langsung via anon (`fetch(.../Pengajuan?or=(id.ilike,kodeAkses.ilike))`)
  dengan **satu** kotak pencarian.
- Tapi RLS produksi sudah **di-hardening** (anon TIDAK bisa baca tabel langsung).
  Jadi kalau di-build dari `src/App.jsx` sekarang lalu deploy → **tracker RUSAK**.
- Yang **LIVE sekarang JALAN** karena file build (`index.html`/`dist`, tidak
  ter-sinkron dengan src) memakai **RPC `lacak`** dengan **DUA** input
  (Nomor/NIP + Kode Akses). Source versi ini **hilang dari git**.

**TUGAS PERTAMA (sebelum bangun portal):** rekonstruksi `src/App.jsx` agar
memakai `rpc/lacak` + dua field, menyamai perilaku live → jadikan source of
truth baru yang bersih & bisa di-build ulang. Kerjakan di **branch fitur**
(mis. `fitur-pengajuan-online`), JANGAN sentuh yang live sampai go-live.

### Definisi fungsi `lacak` (dari Supabase) — kontrak yang harus dipakai
`public.lacak(p_id text, p_kode text) returns jsonb`, SECURITY DEFINER.
Logika match:
```
WHERE ( upper(trim(id)) = upper(trim(p_id))
        OR (p_id hanya digit AND nip = trim(p_id)) )
  AND upper(trim("kodeAkses")) = upper(trim(p_kode))
```
Mengembalikan 1 objek jsonb berisi field pengajuan + `riwayat` (array of
{tahap, waktu, catatan, isKembali}). Jadi TIDAK perlu fetch Riwayat terpisah.
Cara panggil (anon):
```js
await fetch(`${URL}/rest/v1/rpc/lacak`, {
  method:"POST", headers:{apikey:KEY, Authorization:"Bearer "+KEY, "Content-Type":"application/json"},
  body: JSON.stringify({ p_id: nomorAtauNip, p_kode: kodeAkses })
}); // -> body: objek pengajuan, atau null jika tak cocok
```
Ada juga RPC `statistik` (dipakai halaman statistik tracker) — biarkan.

## 3. Kondisi database (sudah beres di sesi lalu)
Desain 2 fase, file ADA di repo `skpp-admin`:
`skpp-admin-main/supabase/draft-fase0/` dan `draft-fase1/` (up.sql/down.sql/README).
- **Fase 0** = RLS per-pemilik: helper `is_staff()`, kolom `Pengajuan.submittedBy`
  & `Pengajuan.sumber`, policy `is_staff() OR pemilik`.
- **Fase 1** = portal: peran pemohon/bendahara, `profiles.akun_status`+`email`,
  trigger `handle_new_external_user` (buat profil `pending` saat signup),
  `is_approved_pemohon()`, `gen_kode_akses()`, status `diajukan`, tabel
  `BerkasPengajuan`, bucket storage `berkas-pengajuan`, dan RPC
  `ajukan_pengajuan_online(jsonb)`.

**Sudah dijalankan di STAGING (bukan produksi):**
- Staging Supabase: ref `sfcsmdzyqizqesomyxih`, region ap-southeast-1,
  URL `https://sfcsmdzyqizqesomyxih.supabase.co`.
  Anon/publishable key staging: `sb_publishable_rgCpoH39laHbgfdujA7eJg_enTTphsf`.
- Skema produksi disalin ke staging via `pg_dump --schema-only` (PostgreSQL 17
  client terpasang di Windows, ada di PATH). Lalu Fase 0 + Fase 1 up.sql
  dijalankan di staging & terverifikasi (10 objek OK).
- Produksi: HANYA punya kolom Fase-0 (submittedBy/sumber) + is_staff() sisa
  round-trip; policy produksi masih kondisi live/hardened. Fase 0 owner-scoped &
  Fase 1 akan diaktifkan di produksi **bersamaan saat go-live**.

### RPC pengajuan online (untuk form portal)
`public.ajukan_pengajuan_online(p jsonb) returns jsonb` (SECURITY DEFINER).
- Menolak bila pemanggil bukan pemohon `approved` (`is_approved_pemohon()`).
- Server yang generate `id` (via Counter) + `kodeAkses` (8 char CSPRNG),
  set `sumber='online'`, `status='diajukan'`, `submittedBy=auth.uid()`, jalur NULL.
- Payload `p` berisi: `nama, nip, opd, jabatan, pangkat, alasan, kasubid`.
- Return: `{ id, kodeAkses }`.
Upload berkas → ke bucket `berkas-pengajuan`, path `{uid}/{pengajuanId}/{file}`,
lalu catat metadata di tabel `BerkasPengajuan`.

## 4. Autentikasi (penting untuk portal)
- Staf internal: email sintetis `username@skpp.local` (dibuat admin via Edge Fn).
- **Pemohon/bendahara: email ASLI + verifikasi** (Supabase signUp). Kirim
  metadata `{ role:'pemohon'|'bendahara', nama, username:NIP, opd }` →
  trigger membuat profil `akun_status='pending'`. Aktifkan "Confirm email" +
  Turnstile di Supabase Auth (staging dulu).

## 5. Rencana build
**Repo ini (tracker) — Jalur 1:**
1. (WAJIB DULU) Rekonstruksi source ke `rpc/lacak` + 2 field. Commit di branch fitur.
2. Tambah `@supabase/supabase-js`.
3. Halaman **Daftar** (email/pass + role pemohon/bendahara + Turnstile) & **Login**.
4. Form **Ajukan SKPP** (tunggal pemohon / bulk bendahara; tanpa jalur) → panggil
   RPC `ajukan_pengajuan_online`. Referensi field/daftar (pangkat PNS/PPPK, OPD,
   kasubid, keperluan) ada di `skpp-admin-main/src/App.jsx` (komponen InputBaru).
5. **Upload berkas** (Storage) + validasi tipe/ukuran.
6. **"Pengajuan Saya"** — list milik user (SELECT Pengajuan where submittedBy=self,
   RLS sudah izinkan) + status/lacak.
- Uji semua via **staging** (pakai `.env`/konstanta staging, JANGAN produksi).
  Karena tracker pakai konstanta hardcoded (`SUPABASE_URL`/`SUPABASE_KEY` di
  App.jsx), untuk uji staging ganti sementara ke URL+anon key staging di atas.

**Repo `skpp-admin` — Jalur 2 (dikerjakan di sesi admin):**
- Menu **Persetujuan Akun** (ACC pemohon/bendahara), **Antrean Pengajuan Online**
  (loket Terima/Kembalikan/Tolak + tetapkan jalur A/B), tampilkan berkas (signed URL).
- Edge Function `admin-akun`: tambah aksi ACC akun.

## 6. Disiplin kerja (WAJIB)
- Semua kerja fitur di **branch terpisah**; produksi/live tetap versi sekarang
  sampai user bilang **go-live**.
- Perubahan **SQL** hanya diuji di **staging** (DB produksi jangan disentuh).
- Go-live nanti = merge branch → main tiap repo + jalankan Fase 0/1 up.sql di
  produksi + konfigurasi Resend/Turnstile + aktifkan pendaftaran, terkoordinasi.
- Anon/publishable key AMAN di frontend. JANGAN pernah taruh service_role key
  atau password DB di kode/chat.

## 7. Referensi cepat
- Prod URL/anon: `https://phxyrferpnylgbbghgsn.supabase.co` / `sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy`
- Staging URL/anon: `https://sfcsmdzyqizqesomyxih.supabase.co` / `sb_publishable_rgCpoH39laHbgfdujA7eJg_enTTphsf`
- Kode akses: 8 char, alfabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (tanpa 0 O 1 I L), dibuat server (`gen_kode_akses`).
- Tahapan A/B & label: lihat `src/App.jsx` tracker (TAHAPAN_A/TAHAPAN_B) — sudah sinkron dengan dashboard.
- Detail desain penuh: `skpp-admin-main/supabase/draft-fase1/README.md`.
```
