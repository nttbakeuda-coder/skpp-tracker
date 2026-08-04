# Handoff: SI-PASTI — Portal Pengajuan & Pelacakan SKPP

## Overview
SI-PASTI (*Sistem Pemantauan Alur SKPP Terintegrasi*) adalah aplikasi Badan Keuangan Daerah (BKAD) Provinsi Nusa Tenggara Timur untuk mengajukan dan melacak **SKPP** (*Surat Keterangan Penghentian Pembayaran*) — surat yang mengesahkan penghentian pembayaran gaji ASN (pensiun, pindah/mutasi, pemberhentian, ahli waris).

Desain ini mencakup **satu pengalaman menyatu** dengan dua lapisan:
1. **Landing page publik** (1 layar penuh, ganti-halaman smooth) — Beranda, Alur/Prosedur, Lacak, Panduan, Regulasi, Kontak.
2. **Aplikasi setelah login** (dashboard) — overlay yang muncul di atas landing page dengan transisi, berisi ringkasan pengajuan, form Ajukan SKPP, halaman Panduan & Regulasi internal, dan panel detail regulasi + dialog dokumen.

Audiens: **Bendahara OPD** dan **Pegawai yang bersangkutan (YBS)** yang mengajukan/melacak SKPP.

## About the Design Files
File dalam bundel ini adalah **referensi desain yang dibuat dalam HTML** — prototipe yang menunjukkan tampilan dan perilaku yang diinginkan, **bukan kode produksi untuk disalin langsung**. Tugasnya adalah **membuat ulang desain ini di lingkungan codebase target** (React, Vue, dsb.) memakai pola & pustaka yang sudah ada di sana — atau, jika belum ada, memilih framework yang paling sesuai lalu mengimplementasikannya.

> **PENTING** — Claude Code sebelumnya hanya menyentuh landing page. Dokumen ini sengaja mendokumentasikan **SELURUH logika, state, halaman dashboard, modal, dan panel** agar dapat diimplementasikan lengkap. Sumber kebenaran penuh ada di `Landing Page SI-PASTI.dc.html` yang disertakan — baca file itu untuk nilai persis; README ini menjelaskan strukturnya.

### Format file HTML sumber
`Landing Page SI-PASTI.dc.html` adalah sebuah **Design Component (DC)** — bukan HTML biasa. Strukturnya:
- **Template** di antara `<x-dc>...</x-dc>` — markup dengan *inline styles* dan lubang `{{ path }}`.
- **Logic class** `class Component extends DCLogic { ... }` di dalam `<script data-dc-script>` — semua state & handler ada di sini, dikembalikan lewat `renderVals()`.
- Kontrol alur: `<sc-if value="{{ x }}">`, `<sc-for list="{{ arr }}" as="item">`.
- Komponen design-system dimuat via `<x-import component-from-global-scope="SIPASTIDesignSystem_608cf0.Button" ...>`.

Untuk implementasi ulang: perlakukan `renderVals()` sebagai definisi state + computed props, dan template sebagai JSX/markup.

## Fidelity
**High-fidelity (hifi).** Warna, tipografi, spacing, radius, bayangan, dan interaksi sudah final dan mengikuti **SI-PASTI Design System**. Recreate se-presisi mungkin memakai komponen design system yang sudah ada di codebase (Button, Card, Badge, TextField, PasswordField, Checkbox, Alert, Logo).

---

## Design System (WAJIB dipakai)
Semua visual mengikuti **SI-PASTI Design System**. Token & komponen tersedia sebagai bundle. Jangan mengarang warna/tipografi baru.

### Palet warna (token → hex)
| Token | Hex | Pemakaian |
|---|---|---|
| `--navy-800` | `#002352` | Wordmark, sidebar/header aplikasi, judul |
| `--navy-600` | `#003060` | Primary institusional |
| `--blue-600` | `#0048C0` | Aksen interaktif/aktif, link |
| `--blue-700` | (lebih gelap dari blue-600) | Link hover |
| `--blue-50` | wash biru muda | Baris hover, highlight terpilih |
| `--gold-500` | `#E0A53C` | Aksen HEMAT: hyphen SI‑PASTI, top-rule, 1 kata penekanan, avatar chip |
| `--grey-100` | abu terang | Background halaman aplikasi |
| `--grey-200` | abu | Border/pemisah |
| `--grey-300/400/500/600/700/800` | ramp abu berkabut biru | Teks & border sekunder |
| `--success-500/600` | hijau | Badge selesai, checkmark, indikator kuat |
| `--warning-500` | kuning/oranye | Indikator sedang |
| `--danger-500/600`, `--danger-50` | merah | Error, tombol Keluar, indikator lemah |
| putih `#ffffff` | | Kartu |

Merah/kuning heraldik NTT **hanya** untuk lambang, tidak sebagai warna UI.

### Tipografi
- **Plus Jakarta Sans** untuk semua teks. ExtraBold (800) display/judul dengan tracking negatif `-0.02em`; Bold (700) heading; Regular/Medium body & label.
- **IBM Plex Mono** untuk data: NIP (18 digit), kode SKPP (`SKPP-NTT-2026-04821` / `SKPP-2026-0001`), Rupiah (`Rp 4.250.000`), angka tabular.
- Eyebrow UPPERCASE dengan tracking lebar `0.10–0.14em`.

### Bentuk, elevasi, gerak
- Radius: kontrol `10px` (`--radius-md`), kartu `14px` (`--radius-lg`), badge pill.
- Bayangan **berwarna navy** `rgba(0,35,82,…)`, bukan hitam netral. Kartu `0 6px 18px rgba(0,35,82,0.08)`; panel mengambang `0 24px 80px rgba(0,35,82,0.35)`.
- Motion terkendali: `--dur-fast 120ms` / `--dur-base 200ms`, easing `cubic-bezier(0.2,0,0,1)`. Transisi panel/halaman 420–480ms dengan easing sama. Tombol turun 1px saat ditekan. Fokus = ring biru 3px.
- Casing kalimat (bukan Title Case). **Tanpa emoji** — ikon garis gaya Lucide (24×24, stroke 2px, currentColor).

### Aset
- `uploads/logo-sipasti-white.png` — logo/wordmark putih untuk latar gelap.
- `uploads/logo-ntt.png` — lambang Provinsi NTT (jangan direcolor).
- `uploads/hero_upload-1784440270012.jpg` — foto hero (gedung/kantor BKAD Kupang), diberi scrim gradien navy→blue diagonal.
- Nama pengembang di footer: **Dika Putra Gumay**.

---

## State Management (semua state di logic class)
State awal:
```
page: 0            // halaman landing aktif (0..5)
modalOpen: false   // modal Masuk/Daftar
modalMode: 'masuk' // 'masuk' | 'daftar'
trackOpen: false   // panel Status Pelacakan (kanan)
tracked: false
trackShownCode: null
regOpen: false     // panel Detail Regulasi (kanan)
regIdx: 0          // indeks regulasi terpilih
regTab: 0          // tab detail: 0 Ringkasan,1 Pasal,2 Dokumen,3 Unduh
docOpen: false     // dialog Dokumen (di aplikasi)
docCode: 'SKPP-2026-0001'
appOpen: false     // overlay aplikasi (setelah login) aktif
appView: 'home'    // 'home'|'ajukan'|'panduan'|'regulasi'
firstLogin: false  // true jika baru mendaftar → sapaan "Selamat Datang, (nama)"
regName: ''        // nama dari form Daftar
userMenuOpen: false// popup avatar (Panduan/Regulasi/Keluar)
accessCode: ''     // input kode akses pada Lacak
pw: ''             // password (indikator kekuatan)
regRole: 'opd'     // peran pada form Daftar: 'opd'|'pegawai'
logoT,'slotW','h1FS' // untuk animasi morph logo saat modal buka
```

### Transisi state penting (trigger → efek)
- `masuk()/daftar()` → `openModal(mode)`: set `modalOpen`, `modalMode`, ukur posisi logo lalu animasikan morph.
- `doLogin()` → tutup semua modal, `appOpen:true, appView:'home', firstLogin:false`.
- `kirimDaftar()` (submit Daftar) → `appOpen:true, appView:'home', firstLogin:true` (memicu sapaan nama).
- `go(i)` → pindah halaman landing, reset semua panel/modal.
- `appLacak()` → buka panel pelacakan DI DALAM aplikasi (`trackOpen:true`, kode `SKPP-2026-0002`).
- `openDocs1()/openDocs2()` → buka dialog Dokumen dengan `docCode`.
- `toggleUserMenu()` / `menuPanduan()` / `menuRegulasi()` → popup avatar; menu Panduan/Regulasi mengubah `appView` (tetap DI DALAM aplikasi, tidak keluar).
- `doLogout()` → `appOpen:false`.

### Z-index (penting untuk overlay)
- Backdrop modal: `backdropZ` = 3 normal; 9 saat aplikasi terbuka; 3 lagi bila detail regulasi terbuka di dalam app agar konten app tetap terlihat.
- Panel pelacakan `trackZ` & panel regulasi `regPanelZ`: 5 normal, 10 saat aplikasi terbuka.
- Overlay aplikasi: `z-index:8`. Dialog dokumen: `z-index:10`.

---

## Screens / Views

### LANDING (overlay `appOpen=false`) — 1 layar penuh, foto hero + scrim navy→blue
Header: logo SI-PASTI putih + "Pemerintah Provinsi Nusa Tenggara Timur" / "Badan Keuangan Daerah" (muncul hanya saat modal Masuk/Daftar terbuka, hasil morph logo). Nav: **Beranda, Alur/Prosedur, Lacak, Panduan, Regulasi, Kontak**. Tombol kanan atas: **Masuk (ke aplikasi)** + **Daftar**.

Enam halaman (`page` 0–5) berganti dengan fade/slide smooth:
0. **Beranda** — judul besar SI-PASTI (H1, ExtraBold, clamp 64–132px), tagline + paragraf sambutan (maks 14px / 12.5px), statistik contoh: *Total Pengajuan SKPP, SKPP Telah Diterbitkan, Hari kerja rata-rata proses, Akses Pengajuan & Pelacakan daring*. CTA Masuk/Daftar. Ikon sosial (Instagram, Facebook, YouTube) — pada versi terakhir diganti kredit "SI-PASTI v1.0 · Dikembangkan oleh Dika Putra Gumay".
1. **Alur/Prosedur** — clean, judul terkait alur + info ringkas.
2. **Lacak** — input **kode SKPP** + **kode akses**, tombol Lacak → membuka panel Status Pelacakan di kanan (konten geser halus ke kiri). Timeline tahap: Pengajuan diterima → Verifikasi berkas → Persetujuan → Penerbitan SKPP, dengan badge status.
3. **Panduan** — judul terkait, info kecil.
4. **Regulasi** — daftar 5 regulasi; klik baris → panel Detail Regulasi (kanan).
5. **Kontak** — info Bidang Perbendaharaan BKAD Provinsi NTT.

#### Modal Masuk / Daftar (panel kiri, muncul saat Masuk/Daftar diklik)
- Panel geser dari kiri (`translateX(-105% → 0)`), 420ms. Konten hero bergeser halus ke kanan, menyisakan **logo + wordmark SI-PASTI** (animasi **morph** logo dari header ke tengah — dihitung via `_measureLogo()` mengukur posisi & skala).
- Eyebrow: **"PORTAL PENGAJUAN SKPP"** (dipakai bersama Masuk & Daftar).
- **Masuk**: field NIP/identitas + PasswordField + **kode akses**, tombol **Masuk** (`doLogin`). Ada tautan "Belum punya akun? Daftar" → `switchDaftar`.
- **Daftar**: field disusun **vertikal** (tanpa scroll samping; panel `overflow-x:hidden`), lebar panel tetap ~440px. Field: **Nama lengkap** (memicu sapaan), NIP, dsb, PasswordField dengan **indikator kekuatan** (bar berubah warna: Sangat Lemah `danger-600` → Lemah `danger-500` → Sedang `warning-500` → Kuat `success-500` → Sangat Kuat `success-600`; lebar 15/35/55/78/100%), Ulangi sandi. Pilihan **peran**: Bendahara OPD / Pegawai YBS. Tombol **Daftar** (`kirimDaftar`).
- ESC menutup semua (`closeAll`).

Indikator kekuatan sandi — skoring:
```
+1 jika length>=8; +1 jika length>=12;
+1 jika ada huruf kecil DAN besar; +1 jika ada angka; +1 jika ada simbol non-alnum.
level = clamp(score-1, 0, 4) → [Sangat Lemah, Lemah, Sedang, Kuat, Sangat Kuat]
```

### APLIKASI (overlay `appOpen=true`, z-index 8, background `--grey-100`)
Header aplikasi (sticky, `--navy-800`, tinggi 60px): logo putih + "SI-PASTI" (gold) + "Badan Keuangan Daerah · Provinsi Nusa Tenggara Timur". Kanan: **nama "Dika Putra Gumay, S. Ak" DULU, lalu avatar inisial "DP"** (chip gold, lingkaran 30px). **Tidak ada tombol Keluar terpisah.**

#### Popup avatar (klik "DP")
Dropdown kanan-atas (200px, putih, radius 12px, animasi opacity+translateY/scale 200ms):
- Header: nama + "Bendahara · BKAD NTT" (mono).
- **Panduan** (ikon buku) → `menuPanduan` set `appView:'panduan'` (TETAP di dalam aplikasi).
- **Regulasi** (ikon dokumen) → `menuRegulasi` set `appView:'regulasi'`.
- Pemisah.
- **Keluar** (merah, ikon logout) → `doLogout`.
- Backdrop transparan full-screen (`z-index:15`) untuk klik-luar menutup.

#### appView = 'home' (dashboard, `<main>` max-width 1080px)
- **First login**: bila `firstLogin` → sapaan **"Selamat Datang, (nama depan)."**; jika bukan → "Selamat datang kembali, Dika."
- **First login** menampilkan blok CTA di tengah: paragraf "Akun Anda telah aktif…" + tombol **Ajukan SKPP** (gold, `goAjukan`) & **Lihat Prosedur & Persyaratan** (secondary, `goAlurFromApp`).
- Grid statistik (auto-fit minmax 200px).
- Tabel pengajuan: kolom `150px 1.2fr 1.4fr 118px 118px 128px` — Kode SKPP (mono), Nama, Jenis+TMT, status Badge, dst. Ikon **Dokumen** per baris → `openDocs1/2` (dialog). Ikon **Lacak** per baris → `appLacak` (panel pelacakan di dalam app).
- Tombol **+ Ajukan Baru** di dashboard (bukan di header).

#### appView = 'ajukan' (form Ajukan SKPP)
Tautan "← Kembali ke beranda" (`goAppHome`). Eyebrow "PORTAL PENGAJUAN SKPP". Judul "Ajukan SKPP". Kartu putih berisi grid field (auto-fit minmax 280px): Nama lengkap*, NIP, jenis SKPP, unggah berkas, dst. Submit `kirimAjukan` → kembali ke home.

#### appView = 'panduan' (Panduan & Persyaratan — DI DALAM app)
- Tautan kembali + eyebrow + judul "Panduan & Persyaratan" + paragraf (PDF maks 2 MB).
- **2 kartu peran** (grid auto-fit minmax 340px, background `--navy-800`, teks putih, radius 14px):
  - **Bendahara OPD** — "Pengelola pengajuan di tingkat perangkat daerah" — 4 langkah bernomor (chip mono gold bulat).
  - **Pegawai YBS** — "Pegawai yang bersangkutan (pemohon)" — 4 langkah bernomor.
  - Tiap kartu: tombol outline gold **"Unduh panduan (PDF)"** di bagian bawah (ikon download).
- Sub-judul "DOKUMEN PERSYARATAN" lalu grid kartu putih (auto-fit minmax 320px), satu kartu per kelompok dokumen (checkmark hijau per item).

#### appView = 'regulasi' (Dasar Hukum Layanan SKPP — DI DALAM app)
- Tautan kembali + judul "Dasar Hukum Layanan SKPP".
- Kartu putih daftar 5 regulasi. Klik baris → panel Detail Regulasi (kanan). Saat panel terbuka: **konten daftar TETAP terlihat** namun menyusut menampilkan **hanya judul regulasi** (kode & deskripsi disembunyikan, kolom jadi `1fr auto`), `<main>` diberi `margin-right` selebar panel, baris terpilih diberi background `--blue-50`.

### Panel Status Pelacakan (aside kanan)
Muncul dari kanan. Timeline tahap dengan badge (mis. "Selesai" success dot). Tombol utama (`trackToMasuk`) + catatan "Ada kendala? Hubungi Bidang Perbendaharaan BKAD Provinsi NTT." Backdrop klik-luar menutup.

### Panel Detail Regulasi (aside kanan, width min(560px,94vw))
Geser dari kanan (`translateX(105% → 0)`), 420ms. Header: kode (mono biru) + judul + tombol tutup. **4 tab**: Ringkasan / Pasal Relevan / Dokumen / Unduh (indikator garis gold pada tab aktif).
- **Ringkasan/Pasal**: kartu per pasal — label pasal (biru), substansi, dan blok **"Relevansi terhadap SKPP"**.
- **Dokumen**: daftar key–value (Nomor, Tahun/Jenis, Status "Berlaku", Instansi, Bidang).
- **Unduh**: tautan "Lihat pada JDIH …" + tombol Download PDF (bila `links:true`).

Data 5 regulasi lengkap ada di `regData` dalam file (UU 20/2023, PP 12/2019, Permendagri 77/2020, Pergub NTT 68/2023, SOP BKD 61/2024) — masing-masing dengan `rows` (label/substansi/relevansi), `dok` (metadata), `jdih`, `links`.

### Dialog Dokumen (aplikasi, modal tengah, z-index 10)
Muncul dengan scale/opacity (`translate(-50%,-50%) scale(0.97→1)`). Eyebrow "DOKUMEN PERSYARATAN", kode SKPP (mono), judul "Berkas yang diunggah", Badge "Lengkap". Daftar berkas (`docItems`) dengan tombol Unggah per baris.

---

## Interactions & Behavior (ringkas)
- Semua transisi panel/halaman: `cubic-bezier(0.2,0,0,1)`, 420–480ms.
- Morph logo saat modal buka: ukur posisi logo header vs. target di dekat H1, hitung `translate()+scale()` (`_measureLogo`), transisi `transform 420ms`.
- Hover: tombol menggelap; baris/ghost dapat wash `--blue-50`; avatar `scale(1.06)`.
- ESC menutup semua modal/panel.
- Klik backdrop menutup modal/panel terkait.
- Popup avatar: buka/tutup toggle + backdrop klik-luar.
- Responsif: panel pakai `min(…px, …vw)`; grid `auto-fit minmax`.

## Files
- `Landing Page SI-PASTI.dc.html` — **sumber kebenaran penuh** (template + logic class). Baca `renderVals()` untuk seluruh state/handler dan `regData`/`docItems`/`peranGroups`/`slides` untuk konten.
- `Landing Page SI-PASTI.html` — versi standalone (semua aset ter-inline) untuk pratinjau offline.
- `support.js` — runtime DC (untuk memahami `<sc-if>`, `<sc-for>`, `<x-import>`, `DCLogic`). Tidak perlu di-port.
- Aset di `uploads/`: `logo-sipasti-white.png`, `logo-ntt.png`, `hero_upload-1784440270012.jpg`.

## Catatan implementasi
- Angka statistik adalah **contoh** — akan dikoreksi klien.
- Gunakan komponen design-system yang sudah ada di codebase untuk Button/Card/Badge/TextField/PasswordField/Checkbox/Alert/Logo, jangan bikin ulang dari nol.
- Bahasa Indonesia formal-hangat, sapaan **Anda**, semangat "Melayani dengan Pasti".
