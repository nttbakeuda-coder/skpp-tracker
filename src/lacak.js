import { SUPABASE_URL, SB_HEADERS } from "./config.js";
import { tahapanUntuk } from "./data.jsx";

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
  const tahapan = tahapanUntuk(p);
  return Math.round((p.tahapSelesai.length / tahapan.length) * 100);
}

// Ubah tanggal ISO (2026-06-20) jadi "20 Jun 2026".
export function fmtTgl(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return s || "";
  const bln = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${+m[3]} ${bln[+m[2] - 1]} ${m[1]}`;
}

// Mekanisme penyelesaian hutang yang diminta staf pada pengembalian TERAKHIR
// (jika ada) -- dipakai untuk menampilkan tombol unggah bukti yang sesuai
// (Bukti Setoran / Berita Acara / Surat Pernyataan) di "Pengajuan Saya".
// Kembalikan null bila bukan pengembalian karena hutang.
export function mekanismeHutangAktif(riwayat) {
  const logs = (riwayat || []).filter((r) => r && r.isKembali && r.catatan);
  const last = logs[logs.length - 1];
  if (!last) return null;
  let d;
  try {
    d = JSON.parse(last.catatan);
  } catch {
    return null;
  }
  if (!d || d._type !== "FORMULIR_KEMBALI" || !d.alasan?.hutang) return null;
  return d.mekanisme || {};
}

// Dokumen persyaratan yang diminta dilengkapi ulang pada pengembalian TERAKHIR
// (jika ada) -- dipakai untuk menampilkan tombol unggah per dokumen di
// "Pengajuan Saya". Kembalikan null bila bukan pengembalian karena dokumen kurang.
export function dokumenKurangAktif(riwayat) {
  const logs = (riwayat || []).filter((r) => r && r.isKembali && r.catatan);
  const last = logs[logs.length - 1];
  if (!last) return null;
  let d;
  try {
    d = JSON.parse(last.catatan);
  } catch {
    return null;
  }
  if (!d || d._type !== "FORMULIR_KEMBALI" || !d.alasan?.dokumen) return null;
  const rincian = (d.rincian || []).filter((r) => r && r.dokumen);
  return rincian.length ? rincian : null;
}
