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

## Menguji ke staging

Untuk menguji fitur "Pengajuan Online", aktifkan **sementara** konstanta staging
di [`src/config.js`](src/config.js) (jangan commit dalam keadaan aktif). Skema
Fase 0/1 sudah dijalankan di Supabase staging.
