// ── KONFIGURASI BACKEND SUPABASE ────────────────────────────────
// Kunci di bawah adalah anon/publishable key — AMAN dipublikasikan di
// halaman statis (baca-only via RPC, tulis ditolak RLS).
//
// PRODUKSI (default — menyamai perilaku live):
export const SUPABASE_URL = "https://phxyrferpnylgbbghgsn.supabase.co";
export const SUPABASE_KEY = "sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy";

// STAGING (untuk menguji fitur "Pengajuan Online" — aktifkan SEMENTARA saat uji,
// JANGAN commit dalam keadaan aktif). Skema Fase 0/1 sudah dijalankan di staging.
// export const SUPABASE_URL = "https://sfcsmdzyqizqesomyxih.supabase.co";
// export const SUPABASE_KEY = "sb_publishable_rgCpoH39laHbgfdujA7eJg_enTTphsf";

export const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
};
