import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { listPengajuanSaya, uploadBerkas, listBerkas, berkasUrl, unduhBerkas, unduhSkppFinal, ajukanUlang } from "../portal.js";
import { lacak, mekanismeHutangAktif, dokumenKurangAktif } from "../lacak.js";
import { BerkasPersyaratan } from "../components/BerkasPersyaratan.jsx";
import { ResultCard } from "../components/ResultCard.jsx";
import { AppHeader } from "../components/AppHeader.jsx";
import { SurveiSKM } from "../components/SurveiSKM.jsx";
import { surveiIdsSaya } from "../survei.js";
import { IcoBan, IcoClock, IcoInbox, IcoCheckCircle, IcoAlertTriangle, IcoFileText, IcoImage, IcoPaperclip, IcoSearch, IcoFolder, IcoDownload, IcoX } from "../components/Icons.jsx";

function StatusBadge({ status }) {
  if (status === "selesai") return <span className="badge-selesai">Selesai</span>;
  if (status === "kembali") return <span className="badge-kembali">↩ Dikembalikan</span>;
  if (status === "ditolak")
    return <span className="badge-kembali" style={{ background: "#fee2e2", color: "#b91c1c" }}><IcoBan size={12} /> Ditolak</span>;
  if (status === "diajukan")
    return <span className="badge-proses" style={{ background: "#fef3c7", color: "#92400e" }}><IcoClock size={12} /> Diajukan</span>;
  return <span className="badge-proses">⟳ Diproses</span>;
}

// Ekstensi file dari path storage (mis. ".pdf") -- dipakai agar nama berkas
// unduhan lebih rapi (jenis dokumen + ekstensi asli) ketimbang nama acak.
function extFromPath(path) {
  const m = /\.[a-zA-Z0-9]+$/.exec(path || "");
  return m ? m[0] : "";
}

// Daftar dokumen yang sudah diunggah untuk satu pengajuan, dengan tombol
// "Lihat" (URL bertanda-tangan sementara) dan "Unduh" (paksa download,
// termasuk untuk berkas gambar yang tidak punya tombol unduh bawaan browser).
function DokumenTerunggah({ berkas, loading }) {
  const [openingId, setOpeningId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  async function lihat(b) {
    setOpeningId(b.id);
    const url = await berkasUrl(b.path);
    setOpeningId("");
    if (url) window.open(url, "_blank", "noopener");
    else alert("Gagal membuka berkas.");
  }

  async function unduh(b) {
    setDownloadingId(b.id);
    const ok = await unduhBerkas(b.path, b.jenis ? b.jenis + extFromPath(b.path) : undefined);
    setDownloadingId("");
    if (!ok) alert("Gagal mengunduh berkas.");
  }

  // "Draft SKPP" & "SKPP (Foto Ditempel)" adalah berkas kerja internal staf
  // (belum resmi/final), jangan tampil di daftar dokumen pemohon.
  const JENIS_INTERNAL = ["Draft SKPP", "SKPP (Foto Ditempel)"];
  const daftar = (berkas || []).filter((b) => !JENIS_INTERNAL.includes(b.jenis));

  if (loading) return <div style={{ fontSize: 12, color: "var(--g500)" }}>Memuat daftar dokumen…</div>;
  if (!daftar.length) return <div style={{ fontSize: 12, color: "var(--g500)" }}>Belum ada berkas diunggah.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {daftar.map((b) => (
        <div key={b.id} className="p-file-row">
          <span style={{ display: "inline-flex", color: "var(--g500)" }}>
            {/\.pdf$/i.test(b.path) ? <IcoFileText size={15} /> : <IcoImage size={15} />}
          </span>
          <span className="fn" title={b.jenis || b.path}>{b.jenis || "Berkas"}</span>
          <button type="button" className="p-link" disabled={openingId === b.id} onClick={() => lihat(b)}>
            {openingId === b.id ? "⟳" : "Lihat"}
          </button>
          <button type="button" className="p-link" disabled={downloadingId === b.id} onClick={() => unduh(b)}>
            {downloadingId === b.id ? "⟳" : "Unduh"}
          </button>
        </div>
      ))}
    </div>
  );
}

// Tombol pilih 1 berkas (langsung ditambahkan ke antrean unggah, belum terkirim).
function FileButton({ label, onPick }) {
  const ref = useRef(null);
  return (
    <div>
      <button type="button" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5 }} onClick={() => ref.current?.click()}>
        <IcoPaperclip size={13} /> Unggah {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Satu baris mekanisme: kalau berkasnya SUDAH ada di daftar terunggah, tampil
// tombol "Lihat" (buka lagi); kalau belum, tampil tombol pilih file.
function HutangMechRow({ label, existing, onPick }) {
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function lihat() {
    setOpening(true);
    const url = await berkasUrl(existing.path);
    setOpening(false);
    if (url) window.open(url, "_blank", "noopener");
    else alert("Gagal membuka berkas.");
  }

  async function unduh() {
    setDownloading(true);
    const ok = await unduhBerkas(existing.path, label + extFromPath(existing.path));
    setDownloading(false);
    if (!ok) alert("Gagal mengunduh berkas.");
  }

  if (existing) {
    return (
      <div className="p-file-row">
        <span className="fn">{label}</span>
        <button type="button" className="p-link" disabled={opening} onClick={lihat}>
          {opening ? "⟳" : "Lihat"}
        </button>
        <button type="button" className="p-link" disabled={downloading} onClick={unduh}>
          {downloading ? "⟳" : "Unduh"}
        </button>
      </div>
    );
  }
  return <FileButton label={label} onPick={onPick} />;
}

// Bukti penyelesaian hutang yang diminta staf saat berkas dikembalikan --
// dirender LANGSUNG DI BAWAH keterangan pengembalian pada tab Lacak (bukan di
// tab Dokumen), lengkap dengan antrean unggah + tombol Unggah sendiri.
function HutangUploadBlock({ mek, berkas, files, onAdd, onRemove, uploading, uploadMsg, onSubmit }) {
  const items = [];
  if (mek.setor) items.push(["Bukti Setoran RKUD", "setor"]);
  if (mek.cicilan) items.push(["Berita Acara Kesepakatan Pelunasan", "cicilan"]);
  if (mek.potong) items.push(["Surat Pernyataan Bermaterai (Potong Gaji)", "potong"]);
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 10, padding: "12px 14px", background: "#fff", border: "1px solid var(--g200)", borderRadius: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--g600)", marginBottom: 8 }}>
        Bukti penyelesaian hutang
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(([label, key]) => (
          <HutangMechRow
            key={key}
            label={label}
            existing={(berkas || []).find((b) => b.jenis === label)}
            onPick={(file) => onAdd({ file, jenis: label, _id: Date.now() + Math.random() })}
          />
        ))}
      </div>
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {files.map((x) => (
            <div key={x._id} className="p-file-row">
              <span className="fn">{x.jenis || x.file.name}</span>
              <button type="button" className="p-link" style={{ color: "#dc2626" }} onClick={() => onRemove(x._id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {uploadMsg && <div className="p-alert p-alert-ok" style={{ marginTop: 8 }}><IcoCheckCircle size={16} /><div>{uploadMsg}</div></div>}
      <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} disabled={uploading || !files.length} onClick={onSubmit}>
        {uploading ? "⟳ Mengunggah…" : "Unggah"}
      </button>
    </div>
  );
}

// Dokumen persyaratan yang diminta dilengkapi ulang saat berkas dikembalikan
// (alasan dokumen kurang/tidak sesuai) -- dirender LANGSUNG DI BAWAH keterangan
// pengembalian pada tab Lacak, satu tombol unggah per dokumen yang diminta.
function DokumenKurangUploadBlock({ items, berkas, files, onAdd, onRemove, uploading, uploadMsg, onSubmit }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 10, padding: "12px 14px", background: "#fff", border: "1px solid var(--g200)", borderRadius: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--g600)", marginBottom: 8 }}>
        Lengkapi dokumen yang diminta
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((r, i) => (
          <HutangMechRow
            key={r.dokumen + i}
            label={r.dokumen}
            existing={(berkas || []).find((b) => b.jenis === r.dokumen)}
            onPick={(file) => onAdd({ file, jenis: r.dokumen, _id: Date.now() + Math.random() })}
          />
        ))}
      </div>
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {files.map((x) => (
            <div key={x._id} className="p-file-row">
              <span className="fn">{x.jenis || x.file.name}</span>
              <button type="button" className="p-link" style={{ color: "#dc2626" }} onClick={() => onRemove(x._id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {uploadMsg && <div className="p-alert p-alert-ok" style={{ marginTop: 8 }}><IcoCheckCircle size={16} /><div>{uploadMsg}</div></div>}
      <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} disabled={uploading || !files.length} onClick={onSubmit}>
        {uploading ? "⟳ Mengunggah…" : "Unggah"}
      </button>
    </div>
  );
}

// Label status utk badge pada tanda terima (mirip StatusBadge, tapi versi teks
// polos krn dirender di luar React, langsung sbg string HTML).
function labelStatusCetak(status) {
  if (status === "selesai") return "Selesai";
  if (status === "kembali") return "↩ Dikembalikan";
  if (status === "ditolak") return "Ditolak";
  if (status === "diajukan") return "⏳ Menunggu Verifikasi";
  return "⟳ Sedang Diproses";
}

// Cetak/unduh tanda terima pengajuan (bukti sudah mengajukan + kode akses),
// dibuka di tab baru dengan window.print() otomatis -- pemohon bisa "Simpan
// sebagai PDF" dari dialog cetak browser utk mengunduhnya.
function cetakTandaTerima(p) {
  const logoSrc = `${window.location.origin}/logo.png`;
  const now = new Date();
  const tglCetak = now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const jamCetak = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Tanda Terima — ${p.nama || p.id}</title>
  <style>
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;margin:0;padding:0;color:#002352;background:#fff}
    .sheet{max-width:720px;margin:0 auto;padding:28px}
    .hd{display:flex;align-items:center;gap:16px;background:#002352;color:#fff;border-radius:10px 10px 0 0;padding:18px 22px}
    .hd img{width:52px;height:52px;object-fit:contain;flex-shrink:0}
    .hd .eyebrow{font-size:8.5pt;letter-spacing:1.5px;color:#B8C4D4;text-transform:uppercase;margin-bottom:3px}
    .hd .org{font-size:13.5pt;font-weight:800}
    .hd .sub{font-size:9pt;color:#B8C4D4;margin-top:3px}
    .band{display:flex;justify-content:space-between;align-items:center;background:#E0A53C;padding:12px 22px}
    .band .title{font-size:12.5pt;font-weight:800;color:#002352;letter-spacing:.3px}
    .band .subtitle{font-size:9pt;color:#4a3c14;margin-top:1px}
    .band .stamp{font-size:8.5pt;color:#4a3c14;text-align:right}
    .idcard{background:#002352;color:#fff;padding:20px 22px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
    .idcard .lbl{font-size:8pt;letter-spacing:1.5px;color:#8FA3BC;text-transform:uppercase;margin-bottom:4px}
    .idcard .nomor{font-size:16pt;font-weight:800;color:#E0A53C;font-family:'Courier New',monospace}
    .idcard .kode{font-size:24pt;font-weight:800;color:#fff;letter-spacing:7px;font-family:'Courier New',monospace;margin-top:2px}
    .idcard .right{text-align:right;max-width:240px}
    .badge{display:inline-block;background:#0048C0;color:#fff;font-size:9pt;font-weight:700;padding:4px 12px;border-radius:999px}
    .idcard .hint{font-size:8pt;color:#8FA3BC;margin-top:8px;line-height:1.5;font-style:italic}
    .grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #E9ECEF;border-top:none}
    .grid .cell{padding:12px 22px;border-bottom:1px solid #E9ECEF;border-right:1px solid #E9ECEF}
    .grid .cell:nth-child(2n){border-right:none}
    .grid .cell.full{grid-column:1/-1;border-right:none}
    .grid .lbl{font-size:8pt;letter-spacing:1px;color:#6C757D;text-transform:uppercase;margin-bottom:3px}
    .grid .val{font-size:11pt;font-weight:700;color:#002352}
    .info-box{margin-top:16px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 18px}
    .info-box .title{font-size:10.5pt;font-weight:800;color:#0048C0;margin-bottom:10px}
    .step{display:flex;align-items:flex-start;gap:10px;margin-bottom:7px;font-size:9.5pt;color:#1e3a5f}
    .step:last-child{margin-bottom:0}
    .step .num{flex-shrink:0;width:18px;height:18px;border-radius:50%;background:#0048C0;color:#fff;font-size:8.5pt;font-weight:700;display:flex;align-items:center;justify-content:center}
    .warn-box{margin-top:12px;background:#FEF9E7;border:1px solid #F3DFA0;border-radius:10px;padding:12px 16px;font-size:9.5pt;color:#7a5a10;line-height:1.6}
    .warn-box b{color:#5c4308}
    .ft{margin-top:22px;display:flex;justify-content:space-between;gap:16px;font-size:8.5pt;color:#6C757D;line-height:1.6}
    .ft .right{text-align:right}
    @media print{body{padding:0}.sheet{max-width:none;padding:14px 18px}}
  </style></head><body>
  <div class="sheet">
    <div class="hd">
      <img src="${logoSrc}" alt="Logo"/>
      <div>
        <div class="eyebrow">Pemerintah Provinsi Nusa Tenggara Timur</div>
        <div class="org">Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</div>
        <div class="sub">Bidang Perbendaharaan</div>
      </div>
    </div>
    <div class="band">
      <div>
        <div class="title">TANDA TERIMA PENGAJUAN SKPP</div>
        <div class="subtitle">Surat Keterangan Penghentian Pembayaran</div>
      </div>
      <div class="stamp">Dicetak: ${tglCetak}, ${jamCetak} WITA</div>
    </div>
    <div class="idcard">
      <div>
        <div class="lbl">Nomor Pengajuan</div>
        <div class="nomor">${p.id || "-"}</div>
        <div class="lbl" style="margin-top:12px">Kode Akses Portal</div>
        <div class="kode">${p.kodeAkses || "-"}</div>
      </div>
      <div class="right">
        <div class="lbl">Status Pengajuan</div>
        <span class="badge">${labelStatusCetak(p.status)}</span>
        <div class="hint">Gunakan nomor dan kode ini untuk melacak status SKPP secara daring</div>
      </div>
    </div>
    <div class="grid">
      <div class="cell"><div class="lbl">Nama Lengkap</div><div class="val">${p.nama || "-"}</div></div>
      <div class="cell"><div class="lbl">NIP</div><div class="val">${p.nip || "-"}</div></div>
      <div class="cell"><div class="lbl">Jabatan Terakhir</div><div class="val">${p.jabatan || "-"}</div></div>
      <div class="cell"><div class="lbl">Pangkat / Golongan</div><div class="val">${p.pangkat || "-"}</div></div>
      <div class="cell"><div class="lbl">OPD / Instansi</div><div class="val">${p.opd || "-"}</div></div>
      <div class="cell"><div class="lbl">Keperluan SKPP</div><div class="val">${p.alasan || "-"}</div></div>
      <div class="cell full"><div class="lbl">Tanggal Diterima</div><div class="val">${p.tanggalMasuk || "-"}</div></div>
    </div>
    <div class="info-box">
      <div class="title">Cara Melacak Status Pengajuan SKPP Secara Daring</div>
      <div class="step"><span class="num">1</span><span>Buka portal: <b>sipasti.my.id</b> dari HP atau komputer</span></div>
      <div class="step"><span class="num">2</span><span>Klik tombol <b>"Lacak Status SKPP"</b></span></div>
      <div class="step"><span class="num">3</span><span>Masukkan <b>Nomor Pengajuan</b> dan <b>Kode Akses</b> yang tertera pada tanda terima ini</span></div>
      <div class="step"><span class="num">4</span><span>Status dan riwayat proses akan ditampilkan secara otomatis</span></div>
    </div>
    <div class="warn-box"><b>Penting:</b> Simpan tanda terima ini baik-baik. Kode Akses bersifat rahasia dan hanya diketahui oleh pihak yang bersangkutan. Kode ini diperlukan untuk mengakses informasi status pengajuan SKPP Anda.</div>
    <div class="ft">
      <div>
        Bidang Perbendaharaan – Badan Keuangan Daerah Provinsi NTT<br/>
        Jl. Raya El Tari No. 52, Oebobo 85111, Kota Kupang, NTT<br/>
        badankeuanganprovntt@gmail.com · bakeuda.nttprov.go.id
      </div>
      <div class="right">
        Tanda terima ini diterbitkan secara otomatis oleh Sistem Informasi SKPP Badan Keuangan Daerah Provinsi NTT<br/>
        ${tglCetak}, ${jamCetak} WITA
      </div>
    </div>
  </div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`;
  const win = window.open("", "_blank", "width=820,height=960");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export default function PengajuanSaya() {
  const { user, isLoggedIn, loading, profile } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState("");

  // Survei wajib: id pengajuan (milik user) yang SUDAH disurvei (null = blm
  // dimuat). `surveiRow` = baris yang sedang dinilai (modal survei terbuka).
  const [surveiedIds, setSurveiedIds] = useState(null);
  const [surveiRow, setSurveiRow] = useState(null);
  const [autoSurveiDone, setAutoSurveiDone] = useState(false);

  // Baris yang sedang diperluas + mode-nya ("dokumen" | "lacak").
  const [openFor, setOpenFor] = useState(null);
  const [openMode, setOpenMode] = useState(null);

  // Mode "dokumen": lihat berkas terunggah + unggah tambahan.
  const [berkas, setBerkas] = useState([]);
  const [berkasLoading, setBerkasLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Mode "lacak": status + riwayat langsung di tempat (tanpa pindah halaman).
  const [lacakResult, setLacakResult] = useState(null);
  const [lacakLoading, setLacakLoading] = useState(false);
  const [lacakError, setLacakError] = useState("");

  // "Ajukan kembali" untuk pengajuan ditolak (id yg sedang diproses + pesan galat).
  const [ulangBusy, setUlangBusy] = useState("");
  const [ulangErr, setUlangErr] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) nav("/masuk", { replace: true });
  }, [loading, isLoggedIn, nav]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const { data, error } = await listPengajuanSaya(user.id);
      if (!alive) return;
      setRows(data);
      setErr(error ? error.message || "Gagal memuat data." : "");
      setLoadingList(false);
      // Muat daftar id yang sudah disurvei (untuk cek wajib).
      const ids = await surveiIdsSaya();
      if (alive) setSurveiedIds(ids);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  async function muatBerkas(pengajuanId) {
    setBerkasLoading(true);
    const { data } = await listBerkas(pengajuanId);
    setBerkasLoading(false);
    setBerkas(data);
  }

  function toggleDokumen(pengajuanId) {
    if (openFor === pengajuanId && openMode === "dokumen") {
      setOpenFor(null);
      return;
    }
    setOpenFor(pengajuanId);
    setOpenMode("dokumen");
    setFiles([]);
    setUploadMsg("");
    muatBerkas(pengajuanId);
  }

  async function toggleLacak(r) {
    if (openFor === r.id && openMode === "lacak") {
      setOpenFor(null);
      return;
    }
    setOpenFor(r.id);
    setOpenMode("lacak");
    setLacakResult(null);
    setLacakError("");
    setLacakLoading(true);
    setFiles([]);
    setUploadMsg("");
    muatBerkas(r.id);
    try {
      const p = await lacak(r.id, r.kodeAkses);
      if (p) setLacakResult(p);
      else setLacakError("Data tidak ditemukan. Periksa kembali kode akses.");
    } catch {
      setLacakError("Gagal terhubung ke server. Coba lagi.");
    }
    setLacakLoading(false);
  }

  async function doUpload(pengajuanId) {
    if (!files.length) return;
    setUploading(true);
    setUploadMsg("");
    let ok = 0, fail = 0;
    for (const x of files) {
      const { error } = await uploadBerkas({ uid: user.id, pengajuanId, file: x.file, jenis: x.jenis });
      if (error) fail++; else ok++;
    }
    setUploading(false);
    setUploadMsg(`Terunggah: ${ok}${fail ? `, gagal: ${fail}` : ""}.`);
    setFiles([]);
    muatBerkas(pengajuanId);
  }

  // Ajukan kembali pengajuan yang DITOLAK (tanpa input ulang). Konfirmasi dulu,
  // panggil RPC, lalu muat ulang daftar agar status jadi "Diajukan".
  async function doAjukanUlang(r) {
    if (ulangBusy) return;
    if (!window.confirm(
      "Ajukan kembali pengajuan ini? Pengajuan akan masuk lagi ke antrean verifikasi Loket " +
      "dengan data dan berkas yang sudah ada. Anda masih dapat melengkapi atau mengganti berkas setelahnya."
    )) return;
    setUlangBusy(r.id);
    setUlangErr("");
    const { error } = await ajukanUlang(r.id);
    if (error) {
      setUlangBusy("");
      setUlangErr(error.message || "Gagal mengajukan kembali. Coba lagi.");
      return;
    }
    const { data } = await listPengajuanSaya(user.id);
    setRows(data);
    setUlangBusy("");
  }

  const tutupModal = () => { setOpenFor(null); setOpenMode(null); };

  // ESC menutup jendela Lacak/Dokumen.
  useEffect(() => {
    if (!openFor) return;
    const onKey = (e) => e.key === "Escape" && tutupModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFor]);

  const totalPengajuan = rows.length;
  const sedangDiproses = rows.filter((r) => r.status !== "selesai" && r.status !== "ditolak").length;
  const selesai = rows.filter((r) => r.status === "selesai").length;
  const openRow = openFor ? rows.find((r) => r.id === openFor) || null : null;
  const respondenTipe = profile?.role === "bendahara" ? "bendahara" : "pemohon";
  // Empty state: baru disetujui / belum ada pengajuan -> tampilan sambutan.
  const kosong = !loadingList && !err && rows.length === 0;
  const namaDepan = (profile?.nama || "").split(",")[0].trim().split(" ")[0];
  // Aturan: Pegawai (pemohon) hanya boleh 1 pengajuan. Bila pengajuannya ditolak,
  // ia TIDAK membuat pengajuan baru melainkan "Ajukan kembali" pengajuan yang ada
  // (tanpa input ulang). Jadi tombol "Ajukan Baru" hanya muncul saat pemohon belum
  // punya pengajuan sama sekali. Bendahara boleh banyak.
  const isPemohon = profile?.role === "pemohon";
  const bolehAjukan = !isPemohon || rows.length === 0;

  // Pengajuan SELESAI milik user yang BELUM disurvei -> wajib dinilai.
  const perluSurvei = surveiedIds == null ? [] : rows.filter((r) => r.status === "selesai" && !surveiedIds.includes(r.id));
  const sudahDinilai = (id) => Array.isArray(surveiedIds) && surveiedIds.includes(id);

  // Buka modal survei OTOMATIS sekali saat halaman dimuat bila ada yang wajib
  // (penyesuaian saat render + state-guard, pola yang sama dgn Ajukan/Landing).
  if (!autoSurveiDone && surveiedIds != null && perluSurvei.length > 0 && !surveiRow) {
    setAutoSurveiDone(true);
    setSurveiRow(perluSurvei[0]);
  }

  // Setelah survei berhasil: tandai id sudah dinilai & tutup modal.
  const surveiSelesai = (id) => {
    setSurveiedIds((prev) => (Array.isArray(prev) ? [...prev, id] : [id]));
    setSurveiRow(null);
  };

  return (
    <div className="portal-page in-app">
      <AppHeader />
      <div className="portal-wrap wide">
        <div className="portal-card">
          {!kosong && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="portal-tag">Portal Pengajuan SKPP</div>
              <h1 className="portal-title">Pengajuan Saya</h1>
            </div>
            {bolehAjukan && (
              <button className="btn btn-gold btn-sm" onClick={() => nav("/ajukan")}>+ Ajukan Baru</button>
            )}
          </div>
          )}

          {!loadingList && rows.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 18 }}>
              <div style={{ background: "var(--g50)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--g200)" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--g500)" }}>Total Pengajuan</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 26, fontWeight: 700, color: "var(--navy)", marginTop: 6 }}>{totalPengajuan}</div>
              </div>
              <div style={{ background: "var(--g50)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--g200)" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--g500)" }}>Sedang Diproses</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 26, fontWeight: 700, color: "var(--blue)", marginTop: 6 }}>{sedangDiproses}</div>
              </div>
              <div style={{ background: "var(--g50)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--g200)" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--g500)" }}>Selesai</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 26, fontWeight: 700, color: "#059669", marginTop: 6 }}>{selesai}</div>
              </div>
            </div>
          )}

          {err && <div className="p-alert p-alert-err" style={{ marginTop: 14 }}><IcoAlertTriangle size={16} /><div>{err}</div></div>}
          {ulangErr && <div className="p-alert p-alert-err" style={{ marginTop: 14 }}><IcoAlertTriangle size={16} /><div>{ulangErr}</div></div>}

          {perluSurvei.length > 0 && (
            <div className="p-alert p-alert-warn" style={{ marginTop: 14, alignItems: "center" }}>
              <IcoAlertTriangle size={16} />
              <div style={{ flex: 1 }}>
                <strong>Pengisian survei kepuasan layanan bersifat wajib.</strong>{" "}
                Terdapat <strong>{perluSurvei.length}</strong> SKPP selesai yang belum dinilai.
              </div>
              <button className="btn btn-gold btn-sm" style={{ flexShrink: 0 }} onClick={() => setSurveiRow(perluSurvei[0])}>
                Isi Survei
              </button>
            </div>
          )}

          {loadingList ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--g500)" }}>Memuat…</div>
          ) : kosong ? (
            <div style={{ textAlign: "center", padding: "clamp(28px,6vw,56px) 16px 40px" }}>
              <div className="portal-tag" style={{ display: "inline-flex", marginBottom: 2 }}>Portal Pengajuan SKPP</div>
              <h1 style={{ fontSize: "clamp(25px,4vw,33px)", fontWeight: 800, color: "var(--navy)", lineHeight: 1.15, margin: "8px 0 12px" }}>
                Selamat datang{namaDepan ? `, ${namaDepan}` : ""}
              </h1>
              <p style={{ maxWidth: 470, margin: "0 auto 28px", fontSize: 14.5, lineHeight: 1.65, color: "var(--g500)" }}>
                {isPemohon
                  ? "Ajukan penerbitan Surat Keterangan Penghentian Pembayaran (SKPP) untuk diri Anda sendiri. Setiap pegawai hanya memiliki satu pengajuan — prosesnya terpantau di tiap tahap dan dokumen dapat diunduh begitu terbit."
                  : "Ajukan penerbitan SKPP untuk pegawai di OPD Anda — dapat sekaligus banyak pegawai dalam satu pengajuan kolektif. Setiap tahap terpantau, transparan, dan dokumen dapat diunduh begitu terbit."}
              </p>
              <button className="btn btn-gold" style={{ fontSize: 16, fontWeight: 700, padding: "14px 42px", borderRadius: 12 }} onClick={() => nav("/ajukan")}>
                Ajukan SKPP
              </button>
            </div>
          ) : rows.length > 0 ? (
            <div style={{ overflowX: "auto", marginTop: 14 }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>Nomor</th>
                    <th>Nama</th>
                    <th>Keperluan</th>
                    <th>Status</th>
                    <th>Kode Akses</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    return (
                    <Fragment key={r.id}>
                      <tr className="p-row-click" onClick={() => toggleDokumen(r.id)}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.id}</td>
                        <td>{r.nama}</td>
                        <td>{r.alasan || "-"}</td>
                        <td>
                          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                            <StatusBadge status={r.status} />
                            {r.status === "selesai" && !sudahDinilai(r.id) && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSurveiRow(r); }}
                                style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap" }}
                                title="Isi survei kepuasan layanan (wajib)"
                              >
                                Nilai layanan
                              </button>
                            )}
                            {r.status === "ditolak" && (
                              <button
                                type="button"
                                disabled={ulangBusy === r.id}
                                onClick={(e) => { e.stopPropagation(); doAjukanUlang(r); }}
                                style={{ background: "#e0f2fe", color: "#075985", border: "1px solid #bae6fd", borderRadius: 999, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", cursor: ulangBusy === r.id ? "wait" : "pointer", whiteSpace: "nowrap" }}
                                title="Ajukan kembali pengajuan ini tanpa mengisi ulang"
                              >
                                {ulangBusy === r.id ? "Memproses…" : "Ajukan kembali"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td><span className="p-kode">{r.kodeAkses}</span></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className={`p-icon-btn${openFor === r.id && openMode === "lacak" ? " active" : ""}`}
                              title={openFor === r.id && openMode === "lacak" ? "Tutup" : "Lacak status & riwayat"}
                              onClick={() => toggleLacak(r)}
                            >
                              <IcoSearch size={15} />
                            </button>
                            <button
                              type="button"
                              className={`p-icon-btn${openFor === r.id && openMode === "dokumen" ? " active" : ""}`}
                              title={openFor === r.id && openMode === "dokumen" ? "Tutup" : "Lihat dokumen"}
                              onClick={() => toggleDokumen(r.id)}
                            >
                              <IcoFolder size={15} />
                            </button>
                            <button type="button" className="p-icon-btn" title="Unduh tanda terima" onClick={() => cetakTandaTerima(r)}>
                              <IcoDownload size={15} />
                            </button>
                            <button
                              type="button"
                              className="p-icon-btn"
                              title={r.skppFinalPath ? "Unduh dokumen SKPP" : "Dokumen SKPP belum tersedia"}
                              disabled={!r.skppFinalPath}
                              style={r.skppFinalPath ? { color: "#059669" } : { opacity: 0.4, cursor: "not-allowed" }}
                              onClick={() => r.skppFinalPath && unduhSkppFinal(r.skppFinalPath, `${r.id}-SKPP.pdf`)}
                            >
                              <IcoFileText size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {!kosong && rows.length > 0 && (
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--g500)" }}>
            Gunakan <strong>Lacak</strong> untuk meninjau status dan riwayat pengajuan. Apabila berkas
            dikembalikan karena dokumen tidak lengkap/tidak sesuai atau kewajiban pelunasan, tombol unggah
            dokumen/bukti akan tersedia di bawah keterangan tahap terkait. Gunakan <strong>Dokumen</strong> untuk
            meninjau berkas yang telah diunggah atau melengkapinya selama status masih <strong>Diajukan</strong>.
            Pengajuan berstatus <strong>Ditolak</strong> dapat diajukan kembali lewat tombol
            <strong> Ajukan kembali</strong> tanpa mengisi ulang — berkas dapat dilengkapi setelahnya.
          </p>
          )}
        </div>
      </div>

      {/* Jendela melayang Lacak / Dokumen (di atas seluruh halaman) */}
      {openFor && openRow && (
        <div className="pm-overlay" onClick={tutupModal}>
          <div
            className="pm-card"
            style={{ maxWidth: openMode === "lacak" ? 640 : 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-head">
              <div>
                <div className="pm-title">{openMode === "lacak" ? "Status Pengajuan" : "Dokumen Pengajuan"}</div>
                <div className="pm-sub">{openRow.id}</div>
              </div>
              <button type="button" className="pm-close" aria-label="Tutup" onClick={tutupModal}>
                <IcoX size={17} />
              </button>
            </div>
            <div className="pm-body">
              {openMode === "lacak" && (
                <>
                  {lacakLoading && (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--g500)", fontSize: 13 }}>Memuat status…</div>
                  )}
                  {!lacakLoading && lacakError && (
                    <div className="p-alert p-alert-err"><IcoAlertTriangle size={16} /><div>{lacakError}</div></div>
                  )}
                  {!lacakLoading && lacakResult && (
                    <ResultCard
                      p={lacakResult}
                      onSurvei={openRow ? () => { tutupModal(); setSurveiRow(openRow); } : undefined}
                      extraOnReturn={(() => {
                        const mek = mekanismeHutangAktif(lacakResult.riwayat);
                        const dokKurang = dokumenKurangAktif(lacakResult.riwayat);
                        if (!mek && !dokKurang) return null;
                        const onAdd = (item) => setFiles((prev) => [...prev, item]);
                        const onRemove = (id) => setFiles((prev) => prev.filter((f) => f._id !== id));
                        const onSubmit = () => doUpload(lacakResult.id);
                        return (
                          <>
                            {dokKurang && (
                              <DokumenKurangUploadBlock
                                items={dokKurang} berkas={berkas} files={files}
                                onAdd={onAdd} onRemove={onRemove} uploading={uploading} uploadMsg={uploadMsg} onSubmit={onSubmit}
                              />
                            )}
                            {mek && (
                              <HutangUploadBlock
                                mek={mek} berkas={berkas} files={files}
                                onAdd={onAdd} onRemove={onRemove} uploading={uploading} uploadMsg={uploadMsg} onSubmit={onSubmit}
                              />
                            )}
                          </>
                        );
                      })()}
                    />
                  )}
                </>
              )}

              {openMode === "dokumen" && (
                <>
                  <DokumenTerunggah berkas={berkas} loading={berkasLoading} />
                  {openRow.status === "diajukan" && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--g600)", margin: "16px 0 8px" }}>
                        Unggah berkas tambahan
                      </div>
                      <BerkasPersyaratan alasan={openRow.alasan} files={files} setFiles={setFiles} />
                      {uploadMsg && <div className="p-alert p-alert-ok" style={{ marginTop: 8 }}><IcoCheckCircle size={16} /><div>{uploadMsg}</div></div>}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 8 }}
                        disabled={uploading || !files.length}
                        onClick={() => doUpload(openRow.id)}
                      >
                        {uploading ? "⟳ Mengunggah…" : "Unggah"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jendela melayang Survei Kepuasan (SKM) */}
      {surveiRow && (
        <div className="pm-overlay" onClick={() => setSurveiRow(null)}>
          <div className="pm-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="pm-head">
              <div>
                <div className="pm-title">Survei Kepuasan Layanan</div>
                <div className="pm-sub">{surveiRow.id}</div>
              </div>
              <button type="button" className="pm-close" aria-label="Tutup" onClick={() => setSurveiRow(null)}>
                <IcoX size={17} />
              </button>
            </div>
            <div className="pm-body">
              <SurveiSKM
                nomor={surveiRow.id}
                kode={surveiRow.kodeAkses}
                tipe={respondenTipe}
                onDone={() => surveiSelesai(surveiRow.id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
