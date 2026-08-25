// Konten statis bersama landing & halaman dalam-aplikasi (Panduan, Regulasi).
// Dipisah dari Landing.jsx supaya halaman lain bisa memakai data yang sama
// tanpa duplikasi (dan tanpa melanggar aturan fast-refresh).
import { SUPABASE_URL } from "./config.js";

// Basis URL berkas panduan (bucket Storage publik "panduan").
const PANDUAN_BUCKET = `${SUPABASE_URL}/storage/v1/object/public/panduan`;

// Daftar regulasi + detail per-tab (Ringkasan/Pasal/Dokumen/Unduh).
// Dua slot untuk admin (tab "Unduh"):
//   pdf     -> berkas PDF di folder public/regulasi/ (taruh filenya, lihat
//              public/regulasi/README.txt). Tombol "Buka PDF Regulasi".
//   jdihUrl -> tempel URL halaman JDIH peraturan ini (mis.
//              "https://jdih.nttprov.go.id/..."). Tombol "Lihat JDIH".
//              Kosongkan bila belum ada -> tombol memberi tahu belum tersedia.
export const REGULASI = [
  { kode: "UU 20/2023", pdf: "/regulasi/uu-20-2023.pdf", judul: "Undang-Undang Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara", deskripsi: "Dasar pengelolaan ASN, termasuk mutasi, pemberhentian, dan perubahan status kepegawaian.",
    ringkasan: "Undang-Undang tentang Aparatur Sipil Negara ini mengatur manajemen ASN secara menyeluruh — mulai dari pengangkatan, pemindahan (mutasi), hingga pemberhentian, termasuk hak dan kewajiban pegawai selama menjabat. Peristiwa-peristiwa itulah, seperti pensiun, pindah, atau berhenti, yang mengubah atau mengakhiri hak seorang ASN atas pembayaran gaji. SKPP diterbitkan sebagai penanda administratif atas perubahan status tersebut sehingga penghentian atau pemindahan pembayaran gaji memiliki dasar hukum yang jelas.",
    rows: [
      { l: "Pasal 29", s: "Pejabat Pembina Kepegawaian (PPK) berwenang menetapkan pengangkatan, pemindahan, dan pemberhentian Pegawai ASN.", r: "SK pengangkatan, mutasi, atau pemberhentian menjadi dasar administratif penerbitan SKPP." },
      { l: "Pasal 30 ayat (4)", s: "Pejabat yang Berwenang mengusulkan pengangkatan, pemindahan, dan pemberhentian kepada PPK.", r: "Menjelaskan alur perubahan status ASN sebelum diterbitkannya SKPP." },
      { l: "Pasal 31", s: "Manajemen ASN meliputi pengangkatan, mutasi, dan pemberhentian.", r: "SKPP merupakan tindak lanjut administrasi dari perubahan status ASN." },
      { l: "Pasal 52–54", s: "Mengatur pemberhentian ASN.", r: "Menjadi dasar diterbitkannya SKPP pensiun atau berhenti." },
    ],
    dok: [
      { k: "Tipe Dokumen", v: "Peraturan Perundang-undangan" },
      { k: "Bentuk", v: "Undang-Undang (UU)" },
      { k: "Nomor", v: "20" },
      { k: "Tahun", v: "2023" },
      { k: "T.E.U.", v: "Indonesia, Pemerintah Pusat" },
      { k: "Tempat Penetapan", v: "Jakarta" },
      { k: "Tanggal Penetapan", v: "31 Oktober 2023" },
      { k: "Tanggal Pengundangan", v: "31 Oktober 2023" },
      { k: "Tanggal Berlaku", v: "31 Oktober 2023" },
      { k: "Sumber", v: "LN 2023 (141), TLN (6897): 32 hlm.; jdih.setneg.go.id" },
      { k: "Subjek", v: "Kepegawaian, Aparatur Negara" },
      { k: "Bidang", v: "Hukum Administrasi Negara" },
      { k: "Status", v: "Berlaku" },
      { k: "Bahasa", v: "Bahasa Indonesia" },
      { k: "Lokasi", v: "Pemerintah Pusat" },
    ],
    jdihUrl: "https://peraturan.bpk.go.id/details/269470/uu-no-20-tahun-2023", jdih: "JDIH Nasional", links: true },
  { kode: "PP 12/2019", pdf: "/regulasi/pp-12-2019.pdf", judul: "Peraturan Pemerintah Nomor 12 Tahun 2019", deskripsi: "Pengelolaan Keuangan Daerah sebagai dasar penatausahaan belanja pegawai.",
    ringkasan: "Peraturan Pemerintah ini mengatur pengelolaan keuangan daerah secara menyeluruh — perencanaan, penganggaran, pelaksanaan, penatausahaan, pelaporan, hingga pertanggungjawaban — dengan asas tertib, transparan, dan akuntabel. Gaji ASN termasuk belanja pegawai yang tunduk pada penatausahaan ini. Ketika hak pembayaran gaji seorang pegawai berubah, penghentian atau pemindahannya harus tercatat secara sah, dan SKPP adalah dokumen penatausahaan yang menjalankan fungsi tersebut.",
    rows: [
      { l: "Pasal 1 angka 2", s: "Pengelolaan keuangan daerah meliputi perencanaan, penganggaran, pelaksanaan, penatausahaan, pelaporan, pertanggungjawaban, dan pengawasan.", r: "SKPP merupakan bagian dari penatausahaan belanja pegawai." },
      { l: "Pasal 3", s: "Pengelolaan keuangan daerah dilaksanakan secara tertib, efisien, ekonomis, efektif, transparan, dan bertanggung jawab.", r: "Menjadi asas penyelenggaraan layanan SKPP." },
      { l: "Pelaksanaan & penatausahaan APBD", s: "Mengatur mekanisme pelaksanaan dan penatausahaan pengeluaran daerah.", r: "Menjadi dasar administrasi pembayaran gaji ASN sehingga perubahan status pegawai harus ditatausahakan melalui SKPP." },
    ],
    dok: [
      { k: "Tipe Dokumen", v: "Peraturan Perundang-undangan" },
      { k: "Bentuk", v: "Peraturan Pemerintah (PP)" },
      { k: "Nomor", v: "12" },
      { k: "Tahun", v: "2019" },
      { k: "T.E.U.", v: "Indonesia, Pemerintah Pusat" },
      { k: "Tempat Penetapan", v: "Jakarta" },
      { k: "Tanggal Penetapan", v: "06 Maret 2019" },
      { k: "Tanggal Pengundangan", v: "12 Maret 2019" },
      { k: "Tanggal Berlaku", v: "12 Maret 2019" },
      { k: "Sumber", v: "LN.2019/No.42, TLN No.6322, LL Setkab: 144 hlm." },
      { k: "Subjek", v: "Pengelolaan Keuangan Negara / Daerah" },
      { k: "Status", v: "Berlaku" },
      { k: "Bahasa", v: "Bahasa Indonesia" },
      { k: "Lokasi", v: "Pemerintah Pusat" },
    ],
    jdihUrl: "https://peraturan.bpk.go.id/details/103888/pp-no-12-tahun-2019", jdih: "JDIH Nasional", links: true },
  { kode: "Permendagri 77/2020", pdf: "/regulasi/permendagri-77-2020.pdf", judul: "Peraturan Menteri Dalam Negeri Nomor 77 Tahun 2020", deskripsi: "Pedoman teknis pengelolaan keuangan daerah dan penatausahaan pembayaran belanja pegawai.",
    ringkasan: "Peraturan ini merupakan pedoman teknis pelaksanaan pengelolaan keuangan daerah yang menjabarkan tata cara penatausahaan dan pembayaran belanja daerah, termasuk belanja pegawai, agar dilakukan dengan dokumen yang lengkap dan sah. Dalam konteks gaji ASN, setiap pembayaran hanya boleh diberikan kepada pegawai yang masih berhak. SKPP berperan memastikan hal itu dengan menghentikan pembayaran ketika hak seorang pegawai berakhir, sehingga mencegah kelebihan maupun salah bayar.",
    rows: [
      { l: "Lampiran — Belanja Pegawai", s: "Belanja pegawai merupakan bagian dari belanja operasi.", r: "SKPP menjadi dokumen administrasi pendukung perubahan pembayaran gaji ASN." },
      { l: "Lampiran — Penatausahaan Belanja", s: "Pembayaran gaji dilakukan melalui mekanisme LS dengan dokumen yang lengkap dan sah.", r: "SKPP memastikan pembayaran dilakukan kepada pegawai yang masih berhak menerima gaji." },
      { l: "Lampiran — Penatausahaan Pengeluaran", s: "Seluruh pengeluaran harus didukung dokumen yang dapat dipertanggungjawabkan.", r: "SKPP mendukung tertib administrasi dan mencegah salah bayar." },
    ],
    dok: [
      { k: "Tipe Dokumen", v: "Peraturan Perundang-undangan" },
      { k: "Bentuk", v: "Peraturan Menteri Dalam Negeri" },
      { k: "Nomor", v: "77" },
      { k: "Tahun", v: "2020" },
      { k: "T.E.U.", v: "Indonesia, Kementerian Dalam Negeri" },
      { k: "Tempat Penetapan", v: "Jakarta" },
      { k: "Tanggal Penetapan", v: "30 Desember 2020" },
      { k: "Tanggal Pengundangan", v: "30 Desember 2020" },
      { k: "Tanggal Berlaku", v: "30 Desember 2020" },
      { k: "Sumber", v: "BN.2020/No.1781, kemendagri.go.id: 5 hlm." },
      { k: "Subjek", v: "APBD - Pengelolaan Keuangan Negara / Daerah - Standar Pedoman" },
      { k: "Status", v: "Berlaku" },
      { k: "Bahasa", v: "Bahasa Indonesia" },
      { k: "Lokasi", v: "Kementerian Dalam Negeri" },
    ],
    jdihUrl: "https://peraturan.bpk.go.id/details/162792/permendagri-no-77-tahun-2020", jdih: "JDIH Kemendagri", links: true },
  { kode: "Pergub NTT 68/2023", pdf: "/regulasi/pergub-ntt-68-2023.pdf", judul: "Peraturan Gubernur NTT Nomor 68 Tahun 2023", deskripsi: "Tata cara penatausahaan keuangan daerah, penerbitan SPM dan SP2D.",
    ringkasan: "Peraturan Gubernur ini mengatur tata cara penatausahaan keuangan di lingkungan Pemerintah Provinsi Nusa Tenggara Timur, termasuk penyusunan laporan pertanggungjawaban bendahara serta penerbitan Surat Perintah Membayar (SPM) dan Surat Perintah Pencairan Dana (SP2D) yang menjadi jalur pembayaran gaji ASN. Ketika terjadi perubahan hak pembayaran, SKPP menjadi dokumen pendukung dalam alur ini agar pencairan gaji pada periode berikutnya dilakukan secara tepat dan tertib di tingkat provinsi.",
    rows: [
      { l: "Bab I — Ketentuan Umum", s: "Mengatur tata cara penatausahaan keuangan daerah.", r: "Menjadi dasar umum administrasi pembayaran belanja pegawai." },
      { l: "Bab VI — Penerbitan SPM", s: "Mengatur proses penerbitan Surat Perintah Membayar berdasarkan hasil verifikasi.", r: "SKPP menjadi dokumen pendukung apabila terjadi perubahan hak pembayaran gaji." },
      { l: "Bab VII — Penerbitan SP2D", s: "Mengatur proses pencairan dana setelah dokumen dinyatakan lengkap.", r: "SKPP membantu memastikan pembayaran gaji dilakukan secara tepat." },
    ],
    dok: [
      { k: "Tipe Dokumen", v: "Peraturan Perundang-undangan" },
      { k: "Bentuk", v: "Peraturan Gubernur (Pergub)" },
      { k: "Nomor", v: "68" },
      { k: "Tahun", v: "2023" },
      { k: "T.E.U.", v: "Indonesia, Provinsi Nusa Tenggara Timur" },
      { k: "Tempat Penetapan", v: "Kupang" },
      { k: "Tanggal Penetapan", v: "29 Desember 2023" },
      { k: "Tanggal Pengundangan", v: "29 Desember 2023" },
      { k: "Tanggal Berlaku", v: "29 Desember 2023" },
      { k: "Sumber", v: "Berita Daerah Provinsi Nusa Tenggara Timur Tahun 2023 Nomor 068" },
      { k: "Subjek", v: "Pengelolaan Keuangan Negara / Daerah" },
      { k: "Status", v: "Berlaku" },
      { k: "Bahasa", v: "Bahasa Indonesia" },
      { k: "Lokasi", v: "Pemerintah Provinsi Nusa Tenggara Timur" },
    ],
    jdihUrl: "https://peraturan.bpk.go.id/Details/284070/pergub-prov-nusa-tenggara-timur-no-68-tahun-2", jdih: "JDIH Provinsi NTT", links: true },
  { kode: "SOP Badan Keuangan Daerah Provinsi NTT 61/2024", pdf: "/regulasi/sop-61-2024.pdf", judul: "Standar Operasional Prosedur Nomor 61 Tahun 2024", deskripsi: "Pedoman operasional pengajuan dan penerbitan SKPP.",
    ringkasan: "Standar Operasional Prosedur ini mengatur tahapan teknis layanan SKPP di Badan Keuangan Daerah Provinsi Nusa Tenggara Timur — mulai dari pengajuan dan verifikasi berkas, penerbitan, hingga penyampaian dokumen kepada pemohon. SOP ini menerjemahkan ketentuan pada peraturan di atasnya menjadi langkah kerja yang konkret dan seragam sehingga setiap permohonan SKPP diproses melalui alur yang sama dan dapat dipantau.",
    rows: [
      { l: "Pengajuan SKPP", s: "Pemohon menyampaikan dokumen persyaratan kepada Badan Keuangan Daerah Provinsi NTT.", r: "Menjadi awal proses penerbitan SKPP." },
      { l: "Verifikasi", s: "Kelengkapan dan keabsahan dokumen diperiksa oleh petugas.", r: "Menjamin keakuratan data sebelum penerbitan." },
      { l: "Penerbitan", s: "SKPP diterbitkan apabila persyaratan telah lengkap.", r: "Menjadi dasar penghentian atau pemindahan pembayaran gaji." },
      { l: "Penyampaian", s: "SKPP disampaikan kepada instansi terkait.", r: "Menjamin kelancaran proses administrasi pembayaran gaji." },
    ],
    dok: [
      { k: "Tipe Dokumen", v: "Standar Operasional Prosedur (SOP)" },
      { k: "Bentuk", v: "Dokumen Internal" },
      { k: "Nomor", v: "61" },
      { k: "Tahun", v: "2024" },
      { k: "T.E.U.", v: "Indonesia, Provinsi Nusa Tenggara Timur" },
      { k: "Tempat Penetapan", v: "Kupang" },
      { k: "Subjek", v: "Pengajuan dan Penerbitan SKPP" },
      { k: "Status", v: "Berlaku" },
      { k: "Bahasa", v: "Bahasa Indonesia" },
      { k: "Lokasi", v: "Badan Keuangan Daerah Provinsi Nusa Tenggara Timur" },
    ],
    jdihUrl: "https://bakeuda.nttprov.go.id/web/info?IENyZWF0ZSBCeSBNdWhhbW1hZCBTeWFocmlsIEJpbiBZdXNyaQ==&m=NA==&k=NQ==", jdih: "Portal Badan Keuangan Daerah Provinsi NTT", links: false },
];

export const REG_TABS = ["Ringkasan", "Pasal Relevan", "Dokumen", "Unduh"];

// Judul & catatan slide "Persyaratan dokumen" (gaya prototipe handoff);
// URUTAN mengikuti DP_DOKUMEN_GRUP di refdata.js (sumber kebenaran yang sama
// dengan form unggah) -- kalau grup di sana berubah urutan, sesuaikan di sini.
export const DOC_SLIDE_META = [
  { t: "Dokumen umum (wajib semua jenis SKPP)", n: "Berkas PDF/JPG/PNG, maksimal 5 MB per dokumen." },
  { t: "Dokumen tambahan — Pensiun", n: "Dilengkapi selain dokumen umum." },
  { t: "Dokumen tambahan — Pindah / Mutasi", n: "Dilengkapi selain dokumen umum." },
  { t: "Dokumen tambahan — Pemberhentian", n: "Berlaku untuk pemberhentian dengan hormat (PNS & PPPK), tidak dengan hormat, dan meninggal dunia tanpa ahli waris." },
  { t: "Dokumen tambahan — Ahli waris (meninggal dunia)", n: "Dilengkapi selain dokumen umum." },
];

// Kartu panduan per peran -- SATU sumber data, dipakai halaman Panduan di
// luar login (Beranda) MAUPUN di dalam login (/panduan) supaya isinya identik.
export const PANDUAN_PERAN = [
  { label: "Untuk Bendahara OPD", pdf: `${PANDUAN_BUCKET}/bendahara.pdf?download`, items: [
    "Mengelola pengajuan SKPP bagi pegawai di instansi",
    "Mengunggah dokumen persyaratan",
    "Memantau progres setiap pengajuan",
    "Mengunduh SKPP yang telah diterbitkan",
  ] },
  { label: "Untuk Pegawai YBS", pdf: `${PANDUAN_BUCKET}/pegawai.pdf?download`, items: [
    "Mengajukan SKPP untuk diri sendiri",
    "Mengunggah dokumen persyaratan",
    "Memantau progres pengajuan",
    "Mengunduh SKPP milik sendiri",
  ] },
];
