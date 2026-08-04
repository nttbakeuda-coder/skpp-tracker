import { SUPABASE_URL, SB_HEADERS } from "./config.js";
import { supabase } from "./supabaseClient.js";

// ── SURVEI KEPUASAN MASYARAKAT (SKM) — Permenpan-RB 14/2017 ──────
// 9 unsur, skala 1–4. Label & pertanyaan ringkas per unsur.
export const SKM_UNSUR = [
  { key: "u1", judul: "Persyaratan", tanya: "Kesesuaian persyaratan dengan jenis layanan SKPP." },
  { key: "u2", judul: "Sistem, Mekanisme & Prosedur", tanya: "Kemudahan alur/prosedur pengajuan SKPP." },
  { key: "u3", judul: "Waktu Penyelesaian", tanya: "Kecepatan penyelesaian SKPP sesuai ketentuan." },
  { key: "u4", judul: "Biaya / Tarif", tanya: "Kewajaran biaya layanan (SKPP tidak dipungut biaya)." },
  { key: "u5", judul: "Produk Layanan", tanya: "Kesesuaian hasil SKPP dengan yang seharusnya." },
  { key: "u6", judul: "Kompetensi Pelaksana", tanya: "Kemampuan petugas dalam memproses layanan." },
  { key: "u7", judul: "Perilaku Pelaksana", tanya: "Kesopanan dan keramahan petugas layanan." },
  { key: "u8", judul: "Sarana & Prasarana", tanya: "Kualitas sarana layanan (loket, portal daring)." },
  { key: "u9", judul: "Penanganan Pengaduan", tanya: "Penanganan pengaduan, saran, dan masukan." },
];

// Skala nilai 1–4 (Permenpan 14/2017). Warna untuk indikator pilihan.
export const SKM_SKALA = [
  { nilai: 1, label: "Tidak Baik", warna: "#dc2626" },
  { nilai: 2, label: "Kurang Baik", warna: "#f59e0b" },
  { nilai: 3, label: "Baik", warna: "#0ea5e9" },
  { nilai: 4, label: "Sangat Baik", warna: "#059669" },
];

// Kirim survei via RPC SECURITY DEFINER (server memvalidasi selesai + kode +
// belum pernah diisi). `jawaban` = { u1..u9: 1-4 }. return { ok, error? }.
export async function kirimSurvei({ nomor, kode, jawaban, saran, tipe }) {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/kirim_survei", {
      method: "POST",
      headers: SB_HEADERS,
      body: JSON.stringify({
        p_id: nomor,
        p_kode: kode,
        p_jawaban: jawaban,
        p_saran: saran || null,
        p_tipe: tipe || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data && data.ok) return { ok: true };
    return { ok: false, error: (data && (data.error || data.message)) || "Gagal mengirim survei." };
  } catch {
    return { ok: false, error: "Gagal terhubung ke server. Coba lagi." };
  }
}

// Daftar id pengajuan MILIK user login yang SUDAH disurvei (untuk cek "wajib").
// return array of id (string). Kosong bila gagal/anon.
export async function surveiIdsSaya() {
  try {
    const { data, error } = await supabase.rpc("survei_ids_saya");
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}
