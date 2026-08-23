import { supabase } from "./supabaseClient.js";
import { BERKAS_MAX_MB, BERKAS_MAX_FILES, BERKAS_ACCEPT } from "./refdata.js";

const BUCKET = "berkas-pengajuan";
const BUCKET_SKPP = "skpp-final"; // hasil scan SKPP final (diunggah staf, diunduh pemohon)

// Ajukan SATU pengajuan lewat RPC SECURITY DEFINER. Server yang membuat
// id + kodeAkses (jalur dikosongkan; loket menetapkannya saat verifikasi).
// payload: { nama, nip, opd, jabatan, pangkat, alasan }
// return: { data: { id, kodeAkses } | null, error }
export async function ajukanPengajuan(payload) {
  return supabase.rpc("ajukan_pengajuan_online", { p: payload });
}

// Pengajuan BULK oleh Bendahara OPD: banyak pegawai sekaligus, menghasilkan
// SATU kode akses BERSAMA (pembeda hanya nomor pengajuan tiap pegawai).
// payload = { opd, items: [{ nama, nip, jabatan, pangkat, alasan }, ...] }
// return: { data: { kodeAkses, rows: [{ id, nama }, ...] } | null, error }
export async function ajukanBulk(payload) {
  return supabase.rpc("ajukan_pengajuan_online_bulk", { p: payload });
}

// Ajukan KEMBALI pengajuan yang DITOLAK (tanpa input ulang): server mereset
// status ke 'diajukan' (masuk lagi ke antrean Loket) memakai data & berkas yang
// ada. RPC SECURITY DEFINER memeriksa kepemilikan + status ditolak.
// return: { data: { ok: true } | null, error }
export async function ajukanUlang(id) {
  return supabase.rpc("ajukan_ulang_pengajuan", { p_id: id });
}

// Bersihkan nama file agar aman jadi path storage.
function safeName(name) {
  return name.replace(/[^\w.-]+/g, "_").slice(-120);
}

// Unggah satu berkas ke bucket privat + catat metadata di BerkasPengajuan.
// return { error } (null bila sukses).
export async function uploadBerkas({ uid, pengajuanId, file, jenis }) {
  const path = `${uid}/${pengajuanId}/${Date.now()}-${safeName(file.name)}`;
  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { error: up.error };
  const meta = await supabase.from("BerkasPengajuan").insert({
    pengajuanId,
    jenis: jenis || null,
    path,
    uploadedBy: uid,
  });
  return { error: meta.error || null, path };
}

// Daftar pengajuan milik user (RLS: submittedBy = auth.uid()).
export async function listPengajuanSaya(uid) {
  const { data, error } = await supabase
    .from("Pengajuan")
    .select('id, nama, nip, opd, jabatan, pangkat, alasan, status, jalur, "kodeAkses", "tanggalMasuk", sumber, "skppFinalPath"')
    .eq("submittedBy", uid);
  if (error) return { data: [], error };
  // Urutkan terbaru dulu berdasarkan nomor (SKPP-YYYY-NNNN).
  const sorted = (data || []).sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return { data: sorted, error: null };
}

// Daftar berkas milik satu pengajuan (RLS: pengajuanId milik user, atau staf).
export async function listBerkas(pengajuanId) {
  const { data, error } = await supabase
    .from("BerkasPengajuan")
    .select("id, jenis, path, created_at")
    .eq("pengajuanId", pengajuanId)
    .order("created_at", { ascending: true });
  return { data: data || [], error };
}

// URL bertanda-tangan (sementara) untuk melihat kembali berkas yang sudah diunggah.
export async function berkasUrl(path, detik = 600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, detik);
  return data?.signedUrl || null;
}

// Unduh berkas secara paksa. Signed URL Supabase Storage lintas-domain, jadi
// atribut `download` HTML biasa tidak dipatuhi browser -- ambil sebagai blob
// dulu lalu picu unduhan lewat elemen <a> sementara (same-origin blob URL).
export async function unduhBerkas(path, filename) {
  const url = await berkasUrl(path);
  if (!url) return false;
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || path.split("/").pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
  return true;
}

// Unduh dokumen SKPP final (hasil scan) yang diunggah staf. RLS storage hanya
// mengizinkan pemilik pengajuan (submittedBy = auth.uid()) membacanya.
export async function unduhSkppFinal(path, filename) {
  if (!path) return false;
  const { data } = await supabase.storage.from(BUCKET_SKPP).createSignedUrl(path, 600);
  if (!data?.signedUrl) return false;
  const res = await fetch(data.signedUrl);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || path.split("/").pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
  return true;
}

// Validasi kumpulan berkas sebelum unggah. return { ok, message }.
export function validateFiles(files) {
  const arr = Array.from(files || []);
  if (arr.length > BERKAS_MAX_FILES)
    return { ok: false, message: `Maksimal ${BERKAS_MAX_FILES} berkas per pengajuan.` };
  for (const f of arr) {
    if (!BERKAS_ACCEPT.includes(f.type))
      return { ok: false, message: `"${f.name}" bukan PDF/JPG/PNG.` };
    if (f.size > BERKAS_MAX_MB * 1024 * 1024)
      return { ok: false, message: `"${f.name}" melebihi ${BERKAS_MAX_MB} MB.` };
  }
  return { ok: true, message: "" };
}
