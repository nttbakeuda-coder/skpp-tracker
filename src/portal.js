import { supabase } from "./supabaseClient.js";
import { BERKAS_MAX_MB, BERKAS_MAX_FILES, BERKAS_ACCEPT } from "./refdata.js";

const BUCKET = "berkas-pengajuan";

// Ajukan SATU pengajuan lewat RPC SECURITY DEFINER. Server yang membuat
// id + kodeAkses (jalur dikosongkan; loket menetapkannya saat verifikasi).
// payload: { nama, nip, opd, jabatan, pangkat, alasan }
// return: { data: { id, kodeAkses } | null, error }
export async function ajukanPengajuan(payload) {
  return supabase.rpc("ajukan_pengajuan_online", { p: payload });
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
    .select('id, nama, nip, opd, alasan, status, jalur, "kodeAkses", "tanggalMasuk", sumber')
    .eq("submittedBy", uid);
  if (error) return { data: [], error };
  // Urutkan terbaru dulu berdasarkan nomor (SKPP-YYYY-NNNN).
  const sorted = (data || []).sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return { data: sorted, error: null };
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
