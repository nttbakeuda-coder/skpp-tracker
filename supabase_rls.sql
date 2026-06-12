-- ============================================================
--  AKTIFKAN RLS (Row Level Security) DI SEMUA TABEL
--
--  Tujuan: menutup akses langsung anon/publishable key ke tabel
--  (Akun password, Pengajuan kodeAkses, dll) lewat PostgREST.
--
--  Setelah ini, dengan anon key TIDAK ADA tabel yang bisa dibaca/ditulis
--  langsung. Modul pelacakan publik TETAP JALAN karena hanya memakai
--  RPC public.lacak (SECURITY DEFINER, menembus RLS).
--
--  PENTING soal DASHBOARD:
--   * Jika dashboard memakai service_role / secret key -> AMAN, tetap jalan
--     (service_role otomatis menembus RLS, tak terpengaruh).
--   * Jika dashboard memakai anon/publishable key dari browser -> AKAN MATI.
--     Jangan jalankan bagian Pengajuan/Riwayat/dll sebelum dashboard
--     dipindah ke service_role / Supabase Auth / RPC. Lihat catatan di bawah.
--
--  SARAN ROLLOUT AMAN: jalankan dulu HANYA blok "Akun" (paling sensitif
--  -> password), lalu buka dashboard. Kalau dashboard masih bisa login &
--  baca data, berarti dashboard pakai service_role -> lanjutkan blok sisanya.
--  Kalau dashboard mati -> berhenti, kabari saya untuk rencana B.
-- ============================================================

-- 1) Tabel paling sensitif: kredensial. Uji ini lebih dulu.
alter table public."Akun" enable row level security;

-- 2) Sisanya (jalankan setelah blok Akun terbukti tidak mematikan dashboard)
alter table public."Pengajuan" enable row level security;
alter table public."Riwayat"   enable row level security;
alter table public."BulkGrup"  enable row level security;
alter table public."Counter"   enable row level security;

-- Catatan: kita SENGAJA tidak membuat policy apa pun untuk anon.
-- RLS aktif tanpa policy = semua akses non-bypass (anon, authenticated)
-- ditolak. role service_role & owner tabel tetap menembus (bypass) RLS.
-- Modul pelacakan tidak butuh policy karena lewat RPC SECURITY DEFINER.

-- ── VERIFIKASI ──────────────────────────────────────────────
-- Cek status RLS tiap tabel (rowsecurity harus = true):
--   select relname, relrowsecurity
--   from pg_class
--   where relnamespace = 'public'::regnamespace and relkind = 'r';
