// ── DATA STATIS PORTAL SKPP ─────────────────────────────────────
// Tahapan proses disamakan PERSIS dengan dashboard internal & versi live
// (ID + label + pelaksana terbaru). Jangan ubah tanpa sinkronisasi dashboard.

export const TAHAPAN_A = [
  { id: "A1", label: "Berkas Diterima di Loket", pelaksana: "Staf Loket" },
  { id: "A2", label: "Verifikasi Kelengkapan Berkas", pelaksana: "Staf Pengampu OPD" },
  { id: "A4", label: "Pembuatan Draft SKPP", pelaksana: "Staf Perbendaharaan" },
  { id: "A5", label: "Verifikasi & Proses Tanda Tangan Pimpinan", pelaksana: "Staf Pengampu OPD → Kasubid → Kuasa BUD" },
  { id: "A6", label: "Penempelan Foto & Penomoran", pelaksana: "Staf Loket" },
  { id: "A7", label: "SKPP Siap Diserahkan", pelaksana: "Staf Loket", final: true },
];

export const TAHAPAN_B = [
  { id: "B1", label: "Berkas Diterima di Loket", pelaksana: "Staf Loket" },
  { id: "B2", label: "Verifikasi Kelengkapan Berkas", pelaksana: "Staf Pengampu OPD" },
  { id: "B4", label: "Perhitungan Kekurangan (SIMgaji)", pelaksana: "Staf Pengampu OPD" },
  { id: "B5", label: "Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian diserahkan ke Bendahara OPD", pelaksana: "Staf Pengampu OPD" },
  { id: "B6", label: "SPP-SPM Diterima dari OPD", pelaksana: "Staf Perbendaharaan" },
  { id: "B7", label: "Proses SP2D Kekurangan Pembayaran Pangkat Pengabdian", pelaksana: "Staf Perbendaharaan" },
  { id: "B8", label: "Pembuatan Draft SKPP", pelaksana: "Staf Perbendaharaan" },
  { id: "B9", label: "Verifikasi & Proses Tanda Tangan Pimpinan", pelaksana: "Staf Pengampu OPD → Kasubid → Kuasa BUD" },
  { id: "B10", label: "Penempelan Foto & Penomoran", pelaksana: "Staf Loket" },
  { id: "B11", label: "SKPP Siap Diserahkan", pelaksana: "Staf Loket", final: true },
];

export const JALUR = { A: "Jalur A", B: "Jalur B" };

// Caption slider hero (sinkron dengan urutan gambar hero1..hero4).
export const CAPTIONS = [
  "🌊 Kepulauan Komodo, Kabupaten Manggarai Barat",
  "🌋 Danau Kelimutu, Kabupaten Ende",
  "🏖️ Pantai Nembrala, Kabupaten Rote Ndao",
  "🌿 Bukit Wairinding, Kabupaten Sumba Timur",
];

export const HERO_SLIDES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg"];

// Nilai cadangan statistik bila RPC "statistik" gagal (menyamai live).
export const STAT_FALLBACK = { total: 247, terbit: 198 };

// Langkah prosedur pengajuan (bagian "Prosedur").
export const PROSEDUR = [
  {
    no: "01",
    ico: "📋",
    title: "Penyiapan Dokumen Persyaratan",
    desc: (
      <>
        <strong>Dokumen umum (wajib semua jenis):</strong> fotokopi KTP, fotokopi Kartu Keluarga,
        Surat Pernyataan Bebas Hutang dari Bendahara Gaji OPD (bermaterai), dan pas foto terbaru
        4×6 latar merah/biru 3 lembar. <strong>Tambahan sesuai jenis SKPP:</strong> Pensiun
        (SK Pensiun, Kartu Taspen, SK Pangkat Pengabdian — Jalur B), Pindah (SK Pindah/Mutasi,
        SPMT), Berhenti/APS (SK Pemberhentian), atau Janda/Duda (Akta Kematian, Buku Nikah,
        KTP janda/duda).
      </>
    ),
  },
  {
    no: "02",
    ico: "🏢",
    title: "Penyerahan Berkas ke Loket",
    desc: "Berkas diserahkan ke Loket Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT. Staf Bidang Perbendaharaan melakukan penerimaan, pencatatan, dan verifikasi kelengkapan berkas.",
  },
  {
    no: "03",
    ico: "🖥️",
    title: "Proses Kekurangan Pangkat (Jika Ada)",
    desc: "Apabila terdapat kenaikan pangkat pengabdian, Operator SIMgaji menghitung selisih kekurangan pembayaran, selanjutnya Bendahara Gaji OPD menyusun SPP-SPM dan Bidang Perbendaharaan memproses SP2D.",
  },
  {
    no: "04",
    ico: "🖊️",
    title: "Penyusunan dan Pemeriksaan SKPP",
    desc: "Draft SKPP disusun oleh Staf Perbendaharaan, diperiksa Staf Pengampu OPD, diparaf Kepala Subbidang, selanjutnya ditandatangani Kuasa BUD.",
  },
  {
    no: "05",
    ico: "📸",
    title: "Penyelesaian Dokumen SKPP",
    desc: "Foto PNS ditempel pada SKPP, dokumen diberi nomor register dan cap dinas. Proses tanpa pangkat pengabdian diselesaikan dalam 3 hari kerja sejak berkas dinyatakan lengkap.",
  },
  {
    no: "06",
    ico: "✅",
    title: "Penyerahan SKPP kepada Pemohon",
    desc: 'SKPP diserahkan kepada PNS yang bersangkutan atau Bendahara Gaji OPD dengan tanda terima. Status pengajuan pada portal akan berubah menjadi "Selesai".',
  },
];
