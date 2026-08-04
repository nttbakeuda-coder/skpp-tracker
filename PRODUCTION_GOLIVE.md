# KATONG SKPP — Runbook Go-Live Produksi

Menyiapkan **backend produksi** (`phxyrferpnylgbbghgsn`) agar setara staging,
lalu merilis frontend. Portal online selama ini dibangun & diuji di **staging**;
produksi baru punya sistem **dasbor lama** (tabel `Pengajuan/Riwayat/Counter/
profiles/Akun`, `is_admin()`, RPC `lacak/statistik`, Edge Function `admin-akun`).

> Lakukan **berurutan**. Jangan lompat ke rilis frontend (langkah F) sebelum
> backend (A–E) lolos verifikasi. Ini situs layanan publik.

Ref proyek: **produksi `phxyrferpnylgbbghgsn`**, staging `sfcsmdzyqizqesomyxih`.

---

## A. Verifikasi prasyarat (produksi)

Supabase (project **produksi**) → SQL Editor → jalankan. Semua harus `true`/ada:

```sql
select
  to_regclass('public."Pengajuan"') is not null as ada_pengajuan,
  to_regclass('public."Riwayat"')   is not null as ada_riwayat,
  to_regclass('public."Counter"')   is not null as ada_counter,
  to_regclass('public.profiles')    is not null as ada_profiles,
  exists(select 1 from pg_proc where proname='is_admin'
         and pronamespace='public'::regnamespace) as ada_is_admin;
```

- Jika **`ada_counter` = false** → tabel penghasil nomor SKPP belum ada di
  produksi. Buat dulu (nomor online butuh ini):
  ```sql
  create table if not exists public."Counter"(tahun int primary key, nilai int not null default 0);
  ```
- Jika `ada_is_admin`/`ada_profiles` = false → dasbor produksi belum di-hardening.
  Jalankan dulu `skpp-admin-main/supabase/01_auth_rls.sql` (lihat RUNBOOK.md lama),
  baru lanjut. (Normalnya sudah ada karena dasbor sudah live.)

---

## B. Jalankan delta SQL portal online (produksi)

SQL Editor (produksi) → tempel **SELURUH** isi
[`PRODUCTION_online_portal.sql`](PRODUCTION_online_portal.sql) → **Run**.

Isinya (idempoten, aman diulang), urut dependensi:
`draft-fase0` → `draft-fase1` → `12_serah_terima` → `survei` → `lacak` →
`bulk` → `skpp_final` → `push` → `reset_request` → `nip→text`.

Bila berhenti karena kolom/tabel tak ada, pesan error menyebut prasyarat yang
kurang — jalankan file numbered terkait dari `skpp-admin-main/supabase/`, ulang.

**Verifikasi (produksi):**
```sql
-- RPC portal harus ada:
select proname from pg_proc where pronamespace='public'::regnamespace
  and proname in ('is_staff','is_approved_pemohon','gen_kode_akses',
    'ajukan_pengajuan_online','ajukan_pengajuan_online_bulk',
    'kirim_survei','survei_ids_saya','rekap_survei_skm',
    'simpan_langganan_push','tolak_bukti_hutang') order by 1;
-- Kolom baru Pengajuan:
select column_name from information_schema.columns
  where table_schema='public' and table_name='Pengajuan'
    and column_name in ('submittedBy','sumber','skppFinalPath',
      'tanggalSerahTerima','buktiSerahPath') order by 1;
-- nip harus text:
select data_type from information_schema.columns
  where table_schema='public' and table_name='Pengajuan' and column_name='nip';
```

---

## C. Storage buckets (produksi)

SQL delta sudah membuat bucket `berkas-pengajuan`, `bukti-serah-terima`,
`skpp-final` (privat) + policy-nya. Cek di Dashboard → Storage ketiganya ada &
**Public = OFF**. Set batas per bucket (Dashboard → bucket → Settings):

| Bucket | Isi | Saran limit / MIME |
|---|---|---|
| `berkas-pengajuan` | berkas persyaratan pemohon | 10 MB · `application/pdf`, `image/*` |
| `bukti-serah-terima` | ttd + foto tanda terima | 10 MB · `image/*`, `application/pdf` |
| `skpp-final` | PDF SKPP terscan | 10 MB · `application/pdf` |

---

## D. Auth — akun eksternal (produksi)

Dashboard → **Authentication**:

1. **Providers → Email**: `Enable Email provider` = ON, **Confirm email** = ON
   (pemohon verifikasi email saat daftar).
2. **URL Configuration**:
   - **Site URL**: domain portal produksi (mis. `https://sipasti.my.id`).
   - **Redirect URLs** (tambah): `https://sipasti.my.id/**` dan `https://sipasti.my.id/masuk`
     (untuk verifikasi email & reset kata sandi pemohon). Tambah domain lain bila ada.
3. **SMTP kustom** (Project Settings → Auth → SMTP): WAJIB untuk produksi —
   SMTP bawaan Supabase dibatasi & tidak untuk publik. Isi kredensial email
   resmi (mis. Gmail App Password / relay). Tanpa ini, email verifikasi/reset
   tidak terkirim ke warga.
4. Trigger `handle_new_external_user` (dibuat di langkah B) otomatis membuat
   profil `pending` saat pemohon/bendahara daftar → admin menyetujui di dasbor.

> Akun **staf** produksi (27 akun) sudah ada dari migrasi dasbor lama — jangan
> migrasi ulang. Akun bendahara/pemohon dibuat sendiri oleh warga via portal.

---

## E. Web Push — Edge Function + webhook (produksi)

VAPID public key dibaca dari env (`VITE_VAPID_PUBLIC_KEY`), TIDAK di-hardcode →
produksi pakai **keypair BARU sendiri** (tak perlu ambil private key staging).
Butuh Supabase CLI + login.

1. **Generate keypair BARU** (jalankan sendiri agar private key tak masuk log):
   ```bash
   npx web-push generate-vapid-keys
   ```
   Simpan Public Key & Private Key.
2. **Deploy** dua Edge Function ke produksi:
   ```bash
   cd skpp-admin-main
   supabase functions deploy kirim-push --no-verify-jwt --project-ref phxyrferpnylgbbghgsn
   supabase functions deploy admin-akun               --project-ref phxyrferpnylgbbghgsn
   ```
   (`admin-akun` mungkin sudah ada; deploy ulang aman.)
3. **Secret** Edge Function produksi (Dashboard → Edge Functions → Secrets, atau
   `supabase secrets set --project-ref phxyrferpnylgbbghgsn ...`):
   ```
   VAPID_PUBLIC_KEY   = <public baru dari langkah 1>
   VAPID_PRIVATE_KEY  = <private baru dari langkah 1>
   VAPID_SUBJECT      = mailto:nttbakeuda@gmail.com
   PUSH_HOOK_SECRET   = <string acak; dipakai juga di header webhook>
   ```
   (`SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` otomatis tersedia.)
   Lalu set di **Vercel (admin app, Production)**:
   `VITE_VAPID_PUBLIC_KEY = <public baru>` — WAJIB sama dengan `VAPID_PUBLIC_KEY`.
4. **Database Webhooks** (Dashboard → Database → Webhooks) → arahkan ke fungsi
   `kirim-push`, method POST, header `x-webhook-secret: <PUSH_HOOK_SECRET>`.
   Buat webhook untuk event:
   - `Pengajuan` — INSERT & UPDATE
   - `profiles` — INSERT & UPDATE
   - `BerkasPengajuan` — INSERT

   (Logika filter—online baru, verifikasi, akun pending, dokumen pengembalian—
   sudah di dalam fungsi.)

---

## F. Frontend — arahkan ke produksi & rilis

**Kritis:** pastikan build produksi menembak Supabase **produksi**, bukan staging.
`.env.local` (staging) di-gitignore → tidak ikut. Yang menentukan adalah **env
Vercel** (bila diset) atau fallback di kode (`config.js`/`supabaseClient.js`,
sudah menunjuk produksi `phxyrferpnylgbbghgsn`).

1. **Vercel → project portal → Settings → Environment Variables (Production):**
   pastikan **tidak** ada `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` yang
   menunjuk **staging**. Kosongkan (pakai fallback produksi) atau set eksplisit:
   ```
   VITE_SUPABASE_URL       = https://phxyrferpnylgbbghgsn.supabase.co
   VITE_SUPABASE_ANON_KEY  = sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy
   VITE_TURNSTILE_SITE_KEY = <site key Turnstile produksi>   # CAPTCHA aktif saat live
   ```
2. **Rilis portal**: merge `fitur-pengajuan-online` → `main`, push → Vercel
   auto-deploy. (Ini juga mengaktifkan cron keep-alive karena workflow ikut ke main.)
3. **Rilis dasbor**: repo `skpp-admin-main` juga punya perubahan sesi ini
   (antrean, serah terima, unggah SKPP, tanpa-emoji, dll.) — deploy dengan cara
   sama (merge ke main → Vercel) memakai env produksi yang sama.

---

## G. Verifikasi end-to-end (setelah rilis)

Di situs **produksi**:
- [ ] Daftar akun pemohon baru → email verifikasi masuk → verifikasi → login.
- [ ] Admin melihat akun `pending` di dasbor → setujui.
- [ ] Pemohon Ajukan (tunggal) + unggah berkas → dapat nomor + kode akses.
- [ ] Bendahara Ajukan bulk → satu kode akses bersama, berkas per pegawai.
- [ ] Lacak publik (nomor/NIP + kode) → status tampil.
- [ ] Staf proses → push notification muncul di komputer staf.
- [ ] SKPP selesai → unggah PDF SKPP (dasbor) → pemohon unduh (Pengajuan Saya).
- [ ] Survei kepuasan terisi setelah selesai; rekap muncul di menu Laporan/IKM.
- [ ] Lupa kata sandi (pemohon) → email reset masuk & berfungsi.

**Rollback cepat DB** bila kacau: `alter table public."<T>" disable row level
security;` (per tabel), atau pulihkan dari backup Supabase.

---

## Ringkas — siapa mengerjakan apa
- **Butuh dashboard/kredensial Anda** (saya tak punya akses): A–E, F1, verifikasi.
- **Sudah saya siapkan**: `PRODUCTION_online_portal.sql` + runbook ini + query
  verifikasi. Frontend & workflow keep-alive sudah siap di repo.
