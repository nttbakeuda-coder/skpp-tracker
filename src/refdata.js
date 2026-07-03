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

// Batas unggah berkas (selaras kebijakan Fase 1 & setelan bucket).
export const BERKAS_MAX_MB = 5;
export const BERKAS_MAX_FILES = 15;
export const BERKAS_ACCEPT = ["application/pdf", "image/jpeg", "image/png"];
export const BERKAS_ACCEPT_LABEL = "PDF, JPG, atau PNG (maks 5 MB/berkas, 15 berkas)";
