// ── DATA REFERENSI FORM PENGAJUAN ───────────────────────────────
// Disalin dari dashboard admin (skpp-admin) agar nilai OPD/pangkat/keperluan
// KONSISTEN dengan data internal. Jangan ubah tanpa sinkronisasi dashboard.

export const DAFTAR_OPD = [
  "Dinas Pendidikan dan Kebudayaan Provinsi NTT",
  "Dinas Kesehatan Provinsi NTT",
  "Dinas Pekerjaan Umum dan Perumahan Rakyat Provinsi NTT",
  "Satuan Polisi Pamong Praja Provinsi NTT",
  "Badan Penanggulangan Bencana Daerah Provinsi NTT",
  "Dinas Sosial Provinsi NTT",
  "Dinas Ketenagakerjaan dan Transmigrasi Provinsi NTT",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana Provinsi NTT",
  "Dinas Lingkungan Hidup dan Kehutanan Provinsi NTT",
  "Dinas Kependudukan dan Pencatatan Sipil Provinsi NTT",
  "Dinas Pemberdayaan Masyarakat dan Desa Provinsi NTT",
  "Dinas Perhubungan Provinsi NTT",
  "Dinas Komunikasi dan Informatika Provinsi NTT",
  "Dinas Koperasi, Usaha Kecil dan Menengah Provinsi NTT",
  "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu Provinsi NTT",
  "Dinas Kepemudaan dan Olahraga Provinsi NTT",
  "Dinas Kearsipan dan Perpustakaan Provinsi NTT",
  "Dinas Kelautan dan Perikanan Provinsi NTT",
  "Dinas Pariwisata dan Ekonomi Kreatif Provinsi NTT",
  "Dinas Pertanian dan Ketahanan Pangan Provinsi NTT",
  "Dinas Peternakan Provinsi NTT",
  "Dinas Energi dan Sumber Daya Mineral Provinsi NTT",
  "Dinas Perindustrian dan Perdagangan Provinsi NTT",
  "Sekretariat Daerah Provinsi NTT",
  "Sekretariat Dewan Perwakilan Rakyat Daerah Provinsi NTT",
  "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah Provinsi NTT",
  "Badan Pendapatan dan Aset Daerah Provinsi NTT",
  "Badan Keuangan Daerah Provinsi NTT",
  "Badan Kepegawaian Daerah Provinsi NTT",
  "Badan Pengembangan Sumber Daya Manusia Daerah Provinsi NTT",
  "Badan Pengelola Perbatasan Daerah Provinsi NTT",
  "Badan Penghubung di Jakarta Provinsi NTT",
  "Inspektorat Daerah Provinsi NTT",
  "Badan Kesatuan Bangsa dan Politik Provinsi NTT",
];

export const DAFTAR_PANGKAT = [
  "Juru Muda / I-a", "Juru Muda Tingkat I / I-b", "Juru / I-c", "Juru Tingkat I / I-d",
  "Pengatur Muda / II-a", "Pengatur Muda Tingkat I / II-b", "Pengatur / II-c", "Pengatur Tingkat I / II-d",
  "Penata Muda / III-a", "Penata Muda Tingkat I / III-b", "Penata / III-c", "Penata Tingkat I / III-d",
  "Pembina / IV-a", "Pembina Tingkat I / IV-b", "Pembina Utama Muda / IV-c",
  "Pembina Utama Madya / IV-d", "Pembina Utama / IV-e",
];

// Golongan PPPK (Perpres No. 11 Tahun 2024).
export const GOLONGAN_PPPK = [
  "I — SD",
  "II — SD (syarat/masa kerja tertentu)",
  "III — SMP (syarat/masa kerja tertentu)",
  "IV — SMP sederajat",
  "V — SMA / SMK / Diploma I (D1)",
  "VI — Diploma II (D2)",
  "VII — Diploma III (D3)",
  "VIII — D3 (penyesuaian masa kerja/jabatan tertentu)",
  "IX — Sarjana (S1) / Diploma IV (D4)",
  "X — Magister (S2) / Pendidikan Profesi",
  "XI — Doktor (S3)",
  "XII — Jabatan Fungsional Ahli Madya",
  "XIII — Ahli Madya / Dosen Lektor Kepala",
  "XIV — Jabatan Fungsional Ahli Utama",
  "XV — Ahli Utama jenjang atas",
];

export const pangkatUntukStatus = (jenisASN) =>
  jenisASN === "PPPK" ? GOLONGAN_PPPK : DAFTAR_PANGKAT;

export const DAFTAR_KEPERLUAN = [
  "Pensiun", "Pensiun Janda", "Pensiun Duda", "Pindah",
  "Pemberhentian dengan Hormat", "Pemberhentian dengan Hormat PPPK",
  "Pemberhentian Tidak dengan Hormat", "Meninggal Dunia", "Lainnya",
];

// Keperluan yang tampil di FORM ONLINE: Pensiun Janda/Duda TIDAK ditawarkan di
// sini (ditangani dashboard internal). Kasus meninggal dunia dipilah lewat
// status ahli waris (lihat AHLI_WARIS_HUBUNGAN) di form.
export const DAFTAR_KEPERLUAN_ONLINE = DAFTAR_KEPERLUAN.filter(
  (k) => k !== "Pensiun Janda" && k !== "Pensiun Duda"
);

// Hubungan ahli waris (dipakai bila Keperluan = Meninggal Dunia + Dengan Ahli Waris).
export const AHLI_WARIS_HUBUNGAN = ["Istri", "Suami", "Anak", "Orang Tua", "Ahli Waris Lain"];

// Saran jenis dokumen untuk pelabelan berkas yang diunggah (BerkasPengajuan.jenis).
export const DAFTAR_DOKUMEN_SKPP = [
  "Surat Pengantar dari OPD",
  "SK Pensiun / SK Pemberhentian",
  "SK Kenaikan Pangkat Terakhir",
  "SK Kenaikan Gaji Berkala Terakhir",
  "Daftar Gaji Terakhir (Asli)",
  "Fotokopi KTP",
  "Fotokopi Kartu Keluarga",
  "Fotokopi Kartu Pegawai (Karpeg)",
  "Fotokopi NPWP",
  "Fotokopi Kartu Taspen",
  "Buku Rekening / Rekening Koran",
  "Surat Pernyataan Bebas Hutang (Bendahara Gaji OPD)",
  "Pas Foto Terbaru",
  "Akta Kematian (untuk Janda/Duda)",
  "Surat Nikah / Akta Perkawinan (untuk Janda/Duda)",
  "Lainnya",
];

// ── Daftar Periksa Persyaratan Berkas (Lampiran 1) ──────────────
// Disalin dari dashboard admin (DP_DOKUMEN_GRUP). Dikelompokkan; grup umum wajib
// untuk semua jenis, grup lain muncul sesuai Keperluan SKPP (lihat dpGrupTampil).
export const DP_DOKUMEN_GRUP = [
  { grup: "I. DOKUMEN UMUM (WAJIB UNTUK SEMUA JENIS SKPP)", items: [
    { t: "Fotokopi KTP Pegawai yang Bersangkutan" },
    { t: "Fotokopi Kartu Keluarga yang masih berlaku" },
    { t: "Surat Pernyataan Bebas Hutang dari Bendahara Gaji OPD (bermaterai)" },
    { t: "Pas foto terbaru ukuran 4×6 berlatar merah/biru" },
  ] },
  { grup: "II. DOKUMEN TAMBAHAN — PENSIUN (BUP / APS / CACAT / MENINGGAL)", items: [
    { t: "SK Pensiun / Persetujuan Pensiun yang telah ditetapkan oleh BKN / Pejabat Pembina Kepegawaian" },
    { t: "Fotokopi Surat Keputusan Kenaikan Pangkat Pengabdian (jika ada dan belum berlaku pada tanggal pensiun)", ket: "Jalur B" },
    { t: "Fotokopi Kartu Taspen" },
    { t: "Fotokopi Akta Perkawinan / Buku Nikah (jika ada tanggungan suami/istri)", ket: "Jika berlaku" },
    { t: "Fotokopi Akta Kelahiran anak yang masih menjadi tanggungan (usia < 25 tahun / belum bekerja)", ket: "Jika berlaku" },
  ] },
  { grup: "III. DOKUMEN TAMBAHAN — PINDAH / MUTASI", items: [
    { t: "SK Pindah / Mutasi dari instansi yang berwenang" },
    { t: "Surat Pernyataan Melaksanakan Tugas (SPMT) di instansi tujuan" },
    { t: "Surat Keterangan Bebas Temuan dari Inspektorat (jika dipersyaratkan)", ket: "Jika berlaku" },
  ] },
  { grup: "IV. DOKUMEN TAMBAHAN — BERHENTI ATAS PERMINTAAN SENDIRI (APS)", items: [
    { t: "SK Pemberhentian yang telah ditetapkan oleh pejabat berwenang" },
    { t: "Surat Pernyataan Tidak Menuntut Hak atas Pensiun (jika APS sebelum BUP)", ket: "Jika berlaku" },
  ] },
  { grup: "V. DOKUMEN TAMBAHAN — AHLI WARIS (MENINGGAL DUNIA)", items: [
    { t: "Akta Kematian Pegawai yang bersangkutan (asli atau dilegalisir)" },
    { t: "Fotokopi Akta Perkawinan / Buku Nikah (dilegalisir)" },
    { t: "Fotokopi KTP Ahli Waris yang masih berlaku" },
  ] },
];

// Grup mana yang relevan untuk sebuah Keperluan SKPP (grup 0/umum selalu tampil).
// Meninggal Dunia "Tanpa Ahli Waris" diperlakukan seperti pemberhentian (grup IV);
// "Dengan Ahli Waris" memakai grup V (dokumen ahli waris).
export function dpGrupTampil(alasan) {
  const al = alasan || "";
  const isMeninggal = al.includes("Meninggal");
  const isTanpaAW = al.includes("Tanpa Ahli Waris");
  const isDenganAW = al.includes("Dengan Ahli Waris") || al.includes("Janda") || al.includes("Duda");
  const isBH = al.includes("Berhenti") || al.includes("Pemberhentian") || (isMeninggal && isTanpaAW);
  const isPD = al.includes("Pindah");
  const isPS = al.includes("Pensiun") && !isMeninggal && !isDenganAW;
  const isAW = isDenganAW;
  return [true, isPS, isPD, isBH, isAW];
}

// Batas unggah berkas (selaras kebijakan Fase 1 & setelan bucket).
export const BERKAS_MAX_MB = 5;
export const BERKAS_MAX_FILES = 15;
export const BERKAS_ACCEPT = ["application/pdf", "image/jpeg", "image/png"];
export const BERKAS_ACCEPT_LABEL = "PDF, JPG, atau PNG (maks 5 MB/berkas, 15 berkas)";
