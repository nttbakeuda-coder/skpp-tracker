import { SUPABASE_URL, SB_HEADERS } from "./config.js";
import { TAHAPAN_A, TAHAPAN_B } from "./data.jsx";

// ── PELACAKAN via RPC "lacak" ────────────────────────────────────
// Kontrak: public.lacak(p_id text, p_kode text) -> jsonb (SECURITY DEFINER).
// Cocok bila (nomor pengajuan ATAU NIP) + kode akses sesuai. Mengembalikan 1
// objek pengajuan berisi field + `riwayat` (array), atau null bila tak cocok.
// Anon TIDAK bisa membaca tabel langsung (RLS di-hardening); WAJIB lewat RPC ini.
export async function lacak(nomor, kode) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/lacak", {
    method: "POST",
    headers: SB_HEADERS,
    body: JSON.stringify({ p_id: nomor, p_kode: kode }),
  });
  const data = await res.json();
  // RPC mengembalikan objek pengajuan bila cocok, atau null. Objek error PostgREST
  // memiliki field `message`; anggap itu "tidak ditemukan".
  if (res.ok && data && !data.message) return normP(data);
  return null;
}

// Ambil statistik nyata dari Supabase (RPC statistik). null bila gagal (pakai cadangan).
export async function fetchStatistik() {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/statistik", {
      method: "POST",
      headers: SB_HEADERS,
      body: "{}",
    });
    if (res.ok) return await res.json();
  } catch {
    /* biarkan pakai cadangan */
  }
  return null;
}

// Normalisasi: tahapSelesai selalu array, riwayat selalu array.
export function normP(p) {
  return {
    ...p,
    tahapSelesai: Array.isArray(p.tahapSelesai)
      ? p.tahapSelesai
      : (p.tahapSelesai || "").split(",").filter(Boolean),
    riwayat: p.riwayat || [],
  };
}

export function getProgress(p) {
  const tahapan = p.jalur === "A" ? TAHAPAN_A : TAHAPAN_B;
  return Math.round((p.tahapSelesai.length / tahapan.length) * 100);
}

// Ubah tanggal ISO (2026-06-20) jadi "20 Jun 2026".
export function fmtTgl(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return s || "";
  const bln = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${+m[3]} ${bln[+m[2] - 1]} ${m[1]}`;
}
