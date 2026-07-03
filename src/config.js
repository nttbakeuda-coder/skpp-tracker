// ── KONFIGURASI BACKEND SUPABASE ────────────────────────────────
// Kunci di bawah adalah anon/publishable key — AMAN dipublikasikan di
// halaman statis (baca-only via RPC, tulis ditolak RLS).
//
// Konfigurasi lewat env var (VITE_*) via .env.local agar DEV/uji bisa
// diarahkan ke Supabase STAGING, sementara PRODUKSI (tanpa env) tetap memakai
// fallback di bawah -> perilaku live tidak berubah. Lihat .env.example.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://phxyrferpnylgbbghgsn.supabase.co";
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy";

// Site key Cloudflare Turnstile (CAPTCHA signup). Kosong = widget dilewati
// (mis. saat uji staging sebelum Turnstile diaktifkan). Isi via env di go-live.
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
// CAPTCHA diwajibkan hanya bila site key diset.
export const TURNSTILE_ENABLED = !!TURNSTILE_SITE_KEY;

export const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
};
