# SI-PASTI — Tracker Publik SKPP (Bakeuda Provinsi NTT)

Portal publik untuk **melacak status pengajuan SKPP** (sipasti.my.id). React 19 +
Vite 8. Backend memakai **Supabase** yang sama dengan dashboard admin (`skpp-admin`).

## Arsitektur pelacakan

- Warga memasukkan **Nomor Pengajuan / NIP** + **Kode Akses** (2 field).
- Frontend memanggil RPC **`public.lacak(p_id, p_kode)`** (SECURITY DEFINER) via
  `fetch` mentah + anon key. RLS produksi sudah di-hardening, jadi anon **tidak
  bisa** membaca tabel langsung — akses hanya lewat RPC ini.
- RPC mengembalikan **1 objek** pengajuan berisi field + `riwayat` (array), atau
  `null` bila tidak cocok. Statistik beranda memakai RPC `statistik`.

Kontrak & logika ada di [`src/lacak.js`](src/lacak.js). Anon/publishable key aman
dipublikasikan (lihat [`src/config.js`](src/config.js)).

## Struktur sumber

| Berkas | Isi |
| --- | --- |
| `index.html` | Entry Vite (shell + font). |
| `src/main.jsx` | Bootstrap React. |
| `src/App.jsx` | Halaman penuh: Navbar, Hero, Stats, Lacak, Prosedur, Footer. |
| `src/lacak.js` | RPC `lacak`/`statistik`, `normP`, `getProgress`, `fmtTgl`. |
| `src/FormatCatatan.jsx` | Render alasan pengembalian (JSON "Formulir Kembali"). |
| `src/data.jsx` | Tahapan A/B, caption hero, langkah prosedur. |
| `src/config.js` | URL + anon key Supabase (produksi; staging tersedia sbg komentar). |
| `src/index.css` | Gaya global (dipindah verbatim dari versi live). |
| `public/logo.png`, `public/hero1..4.jpg` | Aset (diekstrak dari base64 versi live). |

> Catatan: sumber ini **merekonstruksi** perilaku file live `index.html` (dulu
> berupa HTML statis mandiri, tersimpan di riwayat git `main`) menjadi sumber
> React yang bersih dan bisa di-build ulang. Tahapan A4 = "Staf Perbendaharaan".

## Menjalankan

```bash
npm install
npm run dev      # pengembangan
npm run build    # -> dist/ (deployable)
npm run preview  # pratinjau hasil build
npm run lint
```

## Portal Pengajuan Online

Portal (login pemohon/bendahara + ajukan SKPP + berkas) digabung ke tracker ini
memakai `@supabase/supabase-js` dan `react-router-dom`. Rute:

| Rute | Halaman | Akses |
| --- | --- | --- |
| `/` | Beranda + Lacak | publik |
| `/masuk`, `/daftar` | Login / Pendaftaran (email+verifikasi, peran, CAPTCHA opsional) | publik |
| `/ajukan` | Form pengajuan (tunggal + bulk bendahara) + unggah berkas | login + akun `approved` |
| `/pengajuan-saya` | Daftar pengajuan milik user + unggah berkas + lacak | login |

Kontrak backend (repo `skpp-admin`, `supabase/draft-fase1`): signup mengirim
metadata `{role, nama, username:NIP, opd}` → trigger buat profil `pending`;
pengajuan lewat RPC `ajukan_pengajuan_online(p)` (server buat id + kodeAkses,
`jalur` NULL — loket menetapkan); berkas ke bucket privat `berkas-pengajuan`
lalu dicatat di `BerkasPengajuan`. Bulk = memanggil RPC per pegawai.

## Konfigurasi (env)

Aplikasi memakai PRODUKSI secara default. Buat `.env.local` (di-ignore git,
lihat [.env.example](.env.example)) untuk mengarahkan ke **staging** saat menguji
portal — skema Fase 0/1 sudah dijalankan di staging:

```
VITE_SUPABASE_URL=...            # staging
VITE_SUPABASE_ANON_KEY=...       # staging (publishable, aman)
VITE_TURNSTILE_SITE_KEY=...      # opsional; kosong = CAPTCHA dilewati
```

Prasyarat uji end-to-end di staging: aktifkan **Confirm email** (SMTP Resend) &
**Turnstile** di Supabase Auth, lalu setujui akun (`profiles.akun_status='approved'`)
sebelum bisa mengajukan.
