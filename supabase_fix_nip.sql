-- ============================================================
--  FIX: kolom "nip" harus TEXT, bukan angka (int8/bigint)
--
--  MASALAH
--  -------
--  NIP PNS terdiri dari 18 digit. Disimpan sebagai angka, nilai ini
--  MELEBIHI batas aman bilangan JavaScript (Number.MAX_SAFE_INTEGER =
--  9.007.199.254.740.991, hanya 16 digit). Akibatnya setiap kali aplikasi
--  menampilkan / mencetak NIP (dashboard staf, Tanda Terima), digit
--  terakhir BISA BERUBAH diam-diam. Contoh nyata: di JavaScript
--
--       197805092006041020 === 197805092006041024   ->  true
--
--  Kolom angka juga MENGHILANGKAN angka 0 di depan NIP.
--
--  DAMPAK: pelacakan via NIP gagal karena NIP di Tanda Terima (mis.
--  ...1020) tidak sama dengan NIP yang tersimpan di database (...1024).
--
--  SOLUSI: ubah kolom "nip" menjadi text, lalu betulkan baris yang
--  digit/0-depannya sudah terlanjur rusak. RPC public.lacak sudah
--  membandingkan p.nip::text sehingga otomatis benar setelah ini.
--
--  Jalankan seluruh isi file ini di Supabase -> SQL Editor.
-- ============================================================

-- 1) Ubah tipe kolom menjadi text (nilai digit yang ada dipertahankan apa adanya)
alter table public."Pengajuan"
  alter column nip type text using nip::text;

-- 2) KOREKSI DATA yang sudah terlanjur rusak.
--    Setelah kolom jadi text, nilai LAMA tetap sama persis seperti yang
--    tersimpan (mis. '197805092006041024'). Betulkan ke NIP sebenarnya
--    sesuai berkas / Tanda Terima asli. Tambah baris UPDATE sesuai temuan.
--
--    Contoh yang sudah teridentifikasi:
update public."Pengajuan" set nip = '197805092006041020' where id = 'SKPP-2026-0031';

--    Baris berikut tampak kehilangan digit / angka 0 di depan saat masih
--    bertipe angka. PERIKSA berkas asli, ganti dengan NIP 18 digit yang benar,
--    lalu hapus tanda komentar (--) di depannya:
-- update public."Pengajuan" set nip = '<NIP 18 digit benar>' where id = 'SKPP-2026-0009';  -- tersimpan '1995081520251003' (16 digit)
-- update public."Pengajuan" set nip = '<NIP 18 digit benar>' where id = 'SKPP-2026-0026';  -- tersimpan '12345'
-- update public."Pengajuan" set nip = '<NIP 18 digit benar>' where id = 'SKPP-2026-0027';  -- tersimpan '54321'
-- update public."Pengajuan" set nip = '<NIP 18 digit benar>' where id = 'SKPP-2026-0028';  -- tersimpan '789456123'
-- update public."Pengajuan" set nip = '<NIP 18 digit benar>' where id = 'SKPP-2026-0030';  -- tersimpan '789'

-- 3) (opsional) jaga agar ke depan NIP selalu 18 digit angka.
--    Hidupkan bila semua data lama sudah dibetulkan:
-- alter table public."Pengajuan"
--   add constraint nip_18_digit check (nip ~ '^[0-9]{18}$');

-- ============================================================
--  CATATAN FRONTEND (di luar SQL, tapi WAJIB agar tidak rusak lagi):
--  - Saat INPUT pengajuan baru, kirim nip sebagai STRING (jangan
--    Number(nip) / parseInt(nip)).
--  - Saat MEMBACA dari Supabase, kolom text otomatis dikembalikan sebagai
--    string ber-tanda-kutip oleh PostgREST, jadi tampilan & Tanda Terima
--    akan tampil utuh tanpa kehilangan presisi.
-- ============================================================
