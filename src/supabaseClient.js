import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

// Klien Supabase untuk fitur portal (auth pemohon/bendahara, RPC pengajuan,
// upload berkas). Pelacakan publik (lacak/statistik) tetap pakai fetch mentah.
// storageKey dibedakan dari dashboard admin ("skpp-admin-auth") agar sesi tidak
// bentrok bila dibuka di browser yang sama.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "skpp-tracker-auth",
  },
});
