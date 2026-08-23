import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { ajukanPengajuan, ajukanBulk, uploadBerkas, listPengajuanSaya, ajukanUlang, listBerkas } from "../portal.js";
import { DAFTAR_OPD, DAFTAR_KEPERLUAN_ONLINE, AHLI_WARIS_HUBUNGAN, pangkatUntukStatus, dokumenWajib } from "../refdata.js";
import { BerkasPersyaratan } from "../components/BerkasPersyaratan.jsx";
import { SearchableSelect } from "../components/SearchableSelect.jsx";
import { AppHeader } from "../components/AppHeader.jsx";
import { IcoClock, IcoBan, IcoInfo, IcoCheckCircle, IcoAlertTriangle, IcoPerson, IcoPackage } from "../components/Icons.jsx";
import { fmtTgl } from "../lacak.js";
import "../landing.css";

// Keperluan yang butuh TMT (Tanggal Mulai Terhitung) — Pensiun, Pindah, dan
// segala jenis Pemberhentian (dengan/tidak dengan hormat, termasuk PPPK).
const TMT_KEPERLUAN = [
  "Pensiun", "Pindah",
  "Pemberhentian dengan Hormat", "Pemberhentian dengan Hormat PPPK", "Pemberhentian Tidak dengan Hormat",
];
const showTmt = (alasan) => TMT_KEPERLUAN.includes(alasan);
const tmtLabel = (alasan) =>
  alasan === "Pensiun" ? "TMT Pensiun" : alasan === "Pindah" ? "TMT Pindah" : "TMT Pemberhentian";

// Keperluan efektif yang dikirim ke server, memperhitungkan status ahli waris
// untuk kasus Meninggal Dunia (tanpa ahli waris = diproses spt pemberhentian)
// dan TMT untuk kasus Pensiun/Pindah/Pemberhentian.
function effectiveAlasan(x) {
  if (showTmt(x.alasan)) {
    return x.alasan + (x.tmt ? ` — TMT: ${fmtTgl(x.tmt)}` : "");
  }
  if (x.alasan !== "Meninggal Dunia") return x.alasan;
  if (x.ahliWaris === "tanpa") return "Meninggal Dunia (Tanpa Ahli Waris)";
  if (x.ahliWaris === "dengan") {
    const aw = [x.namaAhliWaris?.trim(), x.hubunganAhliWaris].filter(Boolean).join(" — ");
    return "Meninggal Dunia (Dengan Ahli Waris)" + (aw ? ` — Ahli Waris: ${aw}` : "");
  }
  return "Meninggal Dunia";
}

// Kebalikan fmtTgl (lacak.js): "1 Agu 2026" -> "2026-08-01" untuk <input type=date>.
const BLN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function parseTglId(s) {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(String(s || "").trim());
  if (!m) return "";
  const bi = BLN_ID.findIndex((b) => b.toLowerCase() === m[2].toLowerCase());
  if (bi < 0) return "";
  return `${m[3]}-${String(bi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

// Urai `alasan` efektif yang tersimpan kembali ke field form (kebalikan
// effectiveAlasan) — dipakai saat "Ajukan kembali" mengisi form dari pengajuan
// lama. Mengembalikan { alasan (keperluan dasar), tmt, ahliWaris, namaAhliWaris,
// hubunganAhliWaris }.
function decodeAlasan(raw) {
  const s = String(raw || "");
  // Cocokkan prefiks keperluan TERPANJANG dulu (mis. "...Hormat PPPK" sebelum "...Hormat").
  const base =
    [...DAFTAR_KEPERLUAN_ONLINE].sort((a, b) => b.length - a.length).find((k) => s.startsWith(k)) || "Pensiun";
  const out = { alasan: base, tmt: "", ahliWaris: "", namaAhliWaris: "", hubunganAhliWaris: "" };
  const mTmt = s.match(/TMT:\s*(.+?)\s*$/);
  if (mTmt) out.tmt = parseTglId(mTmt[1]);
  if (base === "Meninggal Dunia") {
    if (s.includes("Tanpa Ahli Waris")) out.ahliWaris = "tanpa";
    else if (s.includes("Dengan Ahli Waris")) {
      out.ahliWaris = "dengan";
      const mAw = s.match(/Ahli Waris:\s*(.+?)\s*—\s*([^—]+)$/);
      if (mAw) { out.namaAhliWaris = mAw[1].trim(); out.hubunganAhliWaris = mAw[2].trim(); }
    }
  }
  return out;
}

// Label dokumen wajib yang belum ada berkasnya (semua kecuali "Dokumen lain / pelengkap").
function missingDocs(alasan, files) {
  const uploaded = new Set(files.map((x) => x.jenis));
  return dokumenWajib(alasan).filter((t) => !uploaded.has(t));
}

// Wrapper field seragam: label + input/select anak + highlight merah & pesan bila invalid.
function F({ label, error, children, style }) {
  return (
    <div className={"field" + (error ? " invalid" : "")} style={style}>
      <label>{label}</label>
      {children}
      {error && <div className="field-err">{error}</div>}
    </div>
  );
}

// Validasi khusus ahli waris; kembalikan objek {field: pesan}.
function ahliWarisErrors(x) {
  const e = {};
  if (x.alasan !== "Meninggal Dunia") return e;
  if (!x.ahliWaris) e.ahliWaris = "Wajib dipilih.";
  if (x.ahliWaris === "dengan" && !x.namaAhliWaris.trim()) e.namaAhliWaris = "Wajib diisi.";
  if (x.ahliWaris === "dengan" && !x.hubunganAhliWaris) e.hubunganAhliWaris = "Wajib dipilih.";
  return e;
}

// Semua field pengisian wajib diisi/dipilih.
function tunggalFieldErrors(f) {
  const e = {};
  if (!f.nama.trim()) e.nama = "Wajib diisi.";
  if (!f.nip.trim()) e.nip = "Wajib diisi.";
  else if (!/^\d{18}$/.test(f.nip.trim())) e.nip = "NIP harus 18 digit angka.";
  if (!f.opd) e.opd = "Wajib dipilih.";
  if (!f.jabatan.trim()) e.jabatan = "Wajib diisi.";
  if (!f.pangkat) e.pangkat = "Wajib dipilih.";
  if (showTmt(f.alasan) && !f.tmt) e.tmt = "Wajib diisi.";
  return Object.assign(e, ahliWarisErrors(f));
}

function itemFieldErrors(it) {
  const e = {};
  if (!it.nama.trim()) e.nama = "Wajib diisi.";
  if (!it.nip.trim()) e.nip = "Wajib diisi.";
  else if (!/^\d{18}$/.test(it.nip.trim())) e.nip = "NIP harus 18 digit angka.";
  if (!it.jabatan.trim()) e.jabatan = "Wajib diisi.";
  if (!it.pangkat) e.pangkat = "Wajib dipilih.";
  if (showTmt(it.alasan) && !it.tmt) e.tmt = "Wajib diisi.";
  return Object.assign(e, ahliWarisErrors(it));
}

// Dropdown Status Ahli Waris (muncul di sebelah kolom Keperluan bila = Meninggal Dunia).
function StatusAhliWaris({ v, on, error, style }) {
  return (
    <F label="Status Ahli Waris *" error={error} style={style}>
      <select value={v.ahliWaris} onChange={(e) => on("ahliWaris", e.target.value)}>
        <option value="">— Pilih —</option>
        <option value="tanpa">Tanpa Ahli Waris</option>
        <option value="dengan">Dengan Ahli Waris</option>
      </select>
    </F>
  );
}

// Nama & hubungan ahli waris (muncul hanya bila Status Ahli Waris = Dengan Ahli Waris).
function AhliWarisFields({ v, on, errors = {} }) {
  if (v.alasan !== "Meninggal Dunia" || v.ahliWaris !== "dengan") return null;
  return (
    <div className="p-grid2">
      <F label="Nama Ahli Waris sesuai SK *" error={errors.namaAhliWaris}>
        <input value={v.namaAhliWaris} onChange={(e) => on("namaAhliWaris", e.target.value)} placeholder="Nama ahli waris sesuai SK" />
      </F>
      <F label="Hubungan *" error={errors.hubunganAhliWaris}>
        <select value={v.hubunganAhliWaris} onChange={(e) => on("hubunganAhliWaris", e.target.value)}>
          <option value="">— Pilih —</option>
          {AHLI_WARIS_HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </F>
    </div>
  );
}

// Kolom pangkat sesuai jenis ASN (jenisASN hanya transien — tidak dikirim ke RPC).
function PangkatField({ jenisASN, value, onJenis, onPangkat, error }) {
  return (
    <div className="p-grid2">
      <F label="Jenis ASN *">
        <select value={jenisASN} onChange={(e) => onJenis(e.target.value)}>
          <option value="PNS">PNS</option>
          <option value="PPPK">PPPK</option>
        </select>
      </F>
      <F label={(jenisASN === "PPPK" ? "Golongan (PPPK)" : "Pangkat / Golongan") + " *"} error={error}>
        <select value={value} onChange={(e) => onPangkat(e.target.value)}>
          <option value="">{jenisASN === "PPPK" ? "-- Pilih Golongan --" : "-- Pilih Pangkat --"}</option>
          {pangkatUntukStatus(jenisASN).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </F>
    </div>
  );
}

const newItem = () => ({
  _id: Date.now() + Math.random(),
  nama: "", nip: "", jabatan: "", jenisASN: "PNS", pangkat: "", alasan: "Pensiun",
  tmt: "", ahliWaris: "", namaAhliWaris: "", hubunganAhliWaris: "",
  files: [],   // berkas persyaratan pegawai ini: [{ file, jenis, _id }]
});

export default function Ajukan() {
  const { user, profile, isApproved, isPending, isRejected, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const role = profile?.role;

  // Mode "Ajukan kembali": form diisi otomatis dari pengajuan DITOLAK (dikirim
  // lewat state navigasi). Submit MEMPERBARUI pengajuan yang sama (id & kode
  // akses tetap) lalu status kembali 'diajukan' — bukan membuat pengajuan baru.
  const editRow = loc.state?.ajukanUlang || null;
  const editId = editRow?.id || null;

  const [mode, setMode] = useState("tunggal");
  // Tunggal
  const [f, setF] = useState({
    nama: "",
    nip: "",
    opd: "",
    jabatan: "",
    jenisASN: "PNS",
    pangkat: "",
    alasan: "Pensiun",
    tmt: "",
    ahliWaris: "",
    namaAhliWaris: "",
    hubunganAhliWaris: "",
  });
  const [files, setFiles] = useState([]);
  // Bulk
  const [bulkOPD, setBulkOPD] = useState("");
  const [items, setItems] = useState([newItem()]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [showErr, setShowErr] = useState(false);
  const [showBulkErr, setShowBulkErr] = useState(false);

  // OPD bendahara (bulk) selalu diisi otomatis dari profil begitu siap --
  // disesuaikan SAAT RENDER (pola resmi React utk menyesuaikan state dari
  // prop yang berubah, bukan lewat efek terpisah).
  const [bulkPrefilledFor, setBulkPrefilledFor] = useState(null);
  if (profile && bulkPrefilledFor !== profile.id) {
    setBulkPrefilledFor(profile.id);
    setBulkOPD((v) => v || profile.opd || "");
  }

  // Nama/NIP/OPD (form tunggal) HANYA diisi otomatis untuk pengajuan PERTAMA
  // pemohon ini -- kalau sudah pernah mengajukan sebelumnya, field dikosongkan
  // supaya diisi ulang secara sadar. Butuh cek daftar pengajuan milik user dulu.
  const [existingChecked, setExistingChecked] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [hasActive, setHasActive] = useState(false); // punya pengajuan non-ditolak
  useEffect(() => {
    if (!user) return;
    let alive = true;
    listPengajuanSaya(user.id).then(({ data }) => {
      if (!alive) return;
      const arr = data || [];
      setHasExisting(arr.length > 0);
      setHasActive(arr.some((r) => r.status !== "ditolak"));
      setExistingChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  // OPD form tunggal = OPD profil pengaju & field DIKUNCI, jadi SELALU diisi
  // otomatis dari profil (terpisah dari prefill Nama/NIP yang hanya untuk
  // pengajuan pertama). Tanpa ini, pengaju yang sudah pernah mengajukan mendapat
  // OPD kosong + terkunci sehingga submit terganjal "OPD wajib".
  const [opdPrefilledFor, setOpdPrefilledFor] = useState(null);
  if (profile && opdPrefilledFor !== profile.id) {
    setOpdPrefilledFor(profile.id);
    setF((s) => ({ ...s, opd: s.opd || profile.opd || "" }));
  }

  const [identityPrefilledFor, setIdentityPrefilledFor] = useState(null);
  if (profile && !editId && existingChecked && !hasExisting && identityPrefilledFor !== profile.id) {
    setIdentityPrefilledFor(profile.id);
    setF((s) => ({
      ...s,
      // Bendahara mengajukan untuk pegawai LAIN -> Nama & NIP dibiarkan KOSONG
      // (diisi manual per pegawai). Hanya pemohon perorangan yang identitasnya
      // diisi otomatis dari profil.
      nama: role === "bendahara" ? s.nama : (s.nama || profile.nama || ""),
      nip:  role === "bendahara" ? s.nip  : (s.nip  || profile.username || ""),
    }));
  }

  // Prefill "Ajukan kembali": isi SEMUA field dari pengajuan lama (uraikan alasan
  // efektif -> keperluan dasar + TMT + ahli waris). Deteksi jenis ASN dari pangkat.
  const [editPrefilled, setEditPrefilled] = useState(false);
  if (editRow && !editPrefilled) {
    setEditPrefilled(true);
    const dec = decodeAlasan(editRow.alasan);
    setF((s) => ({
      ...s,
      nama: editRow.nama || "",
      nip: editRow.nip != null ? String(editRow.nip) : "",
      opd: editRow.opd || s.opd || "",
      jabatan: editRow.jabatan || "",
      jenisASN: pangkatUntukStatus("PPPK").includes(editRow.pangkat) ? "PPPK" : "PNS",
      pangkat: editRow.pangkat || "",
      alasan: dec.alasan,
      tmt: dec.tmt,
      ahliWaris: dec.ahliWaris,
      namaAhliWaris: dec.namaAhliWaris,
      hubunganAhliWaris: dec.hubunganAhliWaris,
    }));
  }

  // Berkas yang sudah menempel pada pengajuan lama (ditampilkan di mode edit,
  // tetap tersimpan — unggah ulang tidak wajib).
  const [existingBerkas, setExistingBerkas] = useState([]);
  useEffect(() => {
    if (!editId) return;
    let alive = true;
    listBerkas(editId).then(({ data }) => { if (alive) setExistingBerkas(data || []); });
    return () => { alive = false; };
  }, [editId]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setItem = (id, k, v) => setItems((prev) => prev.map((it) => (it._id === id ? { ...it, [k]: v } : it)));
  // Berkas persyaratan per pegawai (BerkasPersyaratan memanggil setFiles(arrayBaru)).
  const setItemFiles = (id, arr) => setItems((prev) => prev.map((it) => (it._id === id ? { ...it, files: arr } : it)));
  // Ganti jenis ASN pada satu baris bulk & reset pangkat bila tak ada di daftar baru.
  const setItemJenis = (id, v) =>
    setItems((prev) =>
      prev.map((it) =>
        it._id === id
          ? { ...it, jenisASN: v, pangkat: pangkatUntukStatus(v).includes(it.pangkat) ? it.pangkat : "" }
          : it
      )
    );

  if (loading) {
    return <div className="portal-page in-app"><AppHeader /><div className="portal-wrap"><div className="portal-card">Memuat…</div></div></div>;
  }

  // Gerbang persetujuan
  if (!isApproved) {
    return (
      <div className="portal-page in-app">
        <AppHeader />
        <div className="portal-wrap">
          <div className="portal-card">
            <h1 className="portal-title">Ajukan SKPP</h1>
            {isPending && (
              <div className="p-alert p-alert-warn" style={{ marginTop: 12 }}>
                <IcoClock size={16} />
                <div>Akun Anda <strong>menunggu persetujuan admin</strong>. Anda dapat mengajukan setelah disetujui.</div>
              </div>
            )}
            {isRejected && (
              <div className="p-alert p-alert-err" style={{ marginTop: 12 }}>
                <IcoBan size={16} />
                <div>Pendaftaran akun Anda <strong>ditolak</strong>. Silakan hubungi Bidang Perbendaharaan.</div>
              </div>
            )}
            {!isPending && !isRejected && (
              <div className="p-alert p-alert-info" style={{ marginTop: 12 }}>
                <IcoInfo size={16} />
                <div>Akun ini tidak memiliki hak untuk mengajukan SKPP online.</div>
              </div>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => nav("/pengajuan-saya")}>Lihat Pengajuan Saya</button>
          </div>
        </div>
      </div>
    );
  }

  // Gerbang: Pegawai (pemohon) hanya boleh 1 pengajuan. Bila sudah punya (aktif
  // maupun ditolak), tidak membuat baru — yang ditolak diajukan kembali lewat
  // mode edit (editId), jadi gerbang ini dilewati saat mode "Ajukan kembali".
  if (role === "pemohon" && !editId && existingChecked && hasExisting && !result) {
    const hanyaDitolak = !hasActive; // punya pengajuan & semuanya ditolak
    return (
      <div className="portal-page in-app">
        <AppHeader />
        <div className="portal-wrap">
          <div className="portal-card">
            <h1 className="portal-title">Ajukan SKPP</h1>
            <div className="p-alert p-alert-info" style={{ marginTop: 12 }}>
              <div>
                Sebagai Pegawai, Anda hanya dapat memiliki <strong>satu pengajuan SKPP</strong>.{" "}
                {hanyaDitolak
                  ? <>Pengajuan Anda sebelumnya ditolak — buka <strong>Pengajuan Saya</strong> lalu klik <strong>“Ajukan kembali”</strong>: form akan terisi otomatis dari data lama untuk Anda periksa/edit sebelum dikirim ulang.</>
                  : <>Pengajuan Anda saat ini masih berjalan — pantau statusnya di Pengajuan Saya.</>}
              </div>
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => nav("/pengajuan-saya")}>Lihat Pengajuan Saya</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Hasil pengajuan ──
  if (result) {
    return (
      <div className="portal-page in-app">
        <AppHeader />
        <div className="portal-wrap wide">
          <div className="portal-card">
            <div style={{ display: "flex", justifyContent: "center", color: "#059669" }}><IcoCheckCircle size={40} /></div>
            <h1 className="portal-title" style={{ textAlign: "center" }}>{result.edit ? "Pengajuan Diajukan Kembali" : "Pengajuan Terkirim"}</h1>
            <div className="p-alert p-alert-ok" style={{ marginTop: 12 }}>
              <IcoCheckCircle size={16} />
              <div>
                {result.edit
                  ? <>Pengajuan Anda telah diperbarui dan masuk kembali ke antrean verifikasi Loket. </>
                  : <>Pengajuan telah tercatat dalam antrean dan akan diverifikasi oleh petugas Loket. </>}
                Simpan <strong>Kode Akses</strong> berikut untuk memantau status pengajuan.
                {typeof result.uploaded === "number" && (
                  <> Berkas terunggah: <strong>{result.uploaded}</strong>{result.failed ? `, gagal: ${result.failed}` : ""}.</>
                )}
              </div>
            </div>

            {result.kodeBersama && (
              <div style={{ margin: "14px 0 4px", padding: "16px 18px", borderRadius: 14, background: "var(--g50, #f8fafc)", border: "1.5px dashed var(--teal, #0891b2)", textAlign: "center" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--g500)", letterSpacing: "0.06em" }}>KODE AKSES BERSAMA</div>
                <div className="p-kode" style={{ fontSize: 26, marginTop: 6, letterSpacing: "0.16em" }}>{result.kodeBersama}</div>
                <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 8, maxWidth: 540, marginInline: "auto" }}>
                  Berlaku untuk seluruh pengajuan dalam grup ini. Setiap pegawai dapat melacak status SKPP menggunakan <strong>Kode Akses</strong> ini beserta <strong>Nomor Pengajuan</strong> masing-masing.
                </div>
              </div>
            )}

            <table className="p-table" style={{ marginTop: 8 }}>
              <thead><tr><th>Nama</th><th>Nomor Pengajuan</th>{!result.kodeBersama && <th>Kode Akses</th>}</tr></thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.nama}</td>
                    <td>{r.error ? <span style={{ color: "#dc2626" }}>Gagal: {r.error}</span> : <strong style={{ fontFamily: "monospace" }}>{r.id}</strong>}</td>
                    {!result.kodeBersama && <td>{r.error ? "—" : <span className="p-kode">{r.kodeAkses}</span>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => nav("/pengajuan-saya")}>Lihat Pengajuan Saya</button>
              {!result.edit && (
                <button className="btn btn-ghost" onClick={() => { setResult(null); setFiles([]); setItems([newItem()]); }}>
                  Ajukan Lagi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function submitTunggal() {
    const hasFieldErr = Object.keys(tunggalFieldErrors(f)).length > 0;
    // Mode edit (ajukan ulang): berkas lama tetap tersimpan -> tak wajib unggah ulang.
    const missing = editId ? [] : missingDocs(effectiveAlasan(f), files);
    if (hasFieldErr || missing.length > 0) {
      setShowErr(true);
      setErr("Lengkapi data" + (editId ? "" : " dan berkas") + " yang ditandai di bawah.");
      return;
    }
    setShowErr(false);
    setBusy(true);
    setErr("");
    const payload = {
      nama: f.nama.trim(), nip: f.nip.trim(), opd: f.opd,
      jabatan: f.jabatan.trim(), pangkat: f.pangkat, alasan: effectiveAlasan(f),
    };

    // ── Mode "Ajukan kembali": perbarui pengajuan yang sama, status -> diajukan ──
    if (editId) {
      const { error } = await ajukanUlang(editId, payload);
      if (error) {
        setBusy(false);
        setErr(error.message || "Gagal mengajukan kembali.");
        return;
      }
      // Unggah berkas BARU (opsional) ke pengajuan yang sama; berkas lama tetap.
      let uploaded = 0, failed = 0;
      for (const x of files) {
        const { error: e2 } = await uploadBerkas({ uid: user.id, pengajuanId: editId, file: x.file, jenis: x.jenis });
        if (e2) failed++; else uploaded++;
      }
      setBusy(false);
      setResult({ rows: [{ nama: f.nama.trim(), id: editId, kodeAkses: editRow.kodeAkses }], uploaded, failed, edit: true });
      return;
    }

    // ── Pengajuan baru ──
    const { data, error } = await ajukanPengajuan(payload);
    if (error || !data) {
      setBusy(false);
      setErr(error?.message || "Gagal mengirim pengajuan.");
      return;
    }
    let uploaded = 0, failed = 0;
    for (const x of files) {
      const { error: e2 } = await uploadBerkas({ uid: user.id, pengajuanId: data.id, file: x.file, jenis: x.jenis });
      if (e2) failed++; else uploaded++;
    }
    setBusy(false);
    setResult({ rows: [{ nama: f.nama.trim(), id: data.id, kodeAkses: data.kodeAkses }], uploaded, failed });
  }

  async function submitBulk() {
    const bulkOpdErr = !bulkOPD;
    const anyItemErr = items.some((it) => Object.keys(itemFieldErrors(it)).length > 0);
    const anyBerkasErr = items.some((it) => missingDocs(effectiveAlasan(it), it.files || []).length > 0);
    if (bulkOpdErr || anyItemErr || anyBerkasErr) {
      setShowBulkErr(true);
      setErr("Lengkapi data & berkas persyaratan tiap pegawai yang ditandai di bawah.");
      return;
    }
    setShowBulkErr(false);
    setBusy(true);
    setErr("");
    // 1) Buat semua pengajuan sekaligus dgn SATU kode akses bersama (server-side).
    const { data, error } = await ajukanBulk({
      opd: bulkOPD,
      items: items.map((it) => ({
        nama: it.nama.trim(), nip: it.nip.trim(),
        jabatan: it.jabatan.trim(), pangkat: it.pangkat, alasan: effectiveAlasan(it),
      })),
    });
    if (error || !data) {
      setBusy(false);
      setErr(error?.message || "Gagal mengirim pengajuan.");
      return;
    }
    // 2) Unggah berkas tiap pegawai ke pengajuannya (urutan rows = urutan items).
    const serverRows = data.rows || [];
    let uploaded = 0, failed = 0;
    const rows = [];
    for (let i = 0; i < items.length; i++) {
      const sr = serverRows[i];
      const nama = items[i].nama.trim();
      if (!sr) { rows.push({ nama, error: "gagal dibuat" }); continue; }
      for (const x of items[i].files || []) {
        const { error: e2 } = await uploadBerkas({ uid: user.id, pengajuanId: sr.id, file: x.file, jenis: x.jenis });
        if (e2) failed++; else uploaded++;
      }
      rows.push({ nama, id: sr.id });
    }
    setBusy(false);
    setResult({ rows, kodeBersama: data.kodeAkses, uploaded, failed });
  }

  return (
    <div className="portal-page in-app">
      <AppHeader />
      <div className={"portal-wrap " + (mode === "bulk" && role === "bendahara" ? "xwide" : "wide")}>
        <div className="portal-card">
          <button type="button" className="lp-app-back" onClick={() => nav("/pengajuan-saya")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
            Kembali ke Pengajuan Saya
          </button>
          <div className="portal-tag" style={{ marginTop: 12 }}>Portal Pengajuan SKPP</div>
          <h1 className="portal-title">{editId ? "Ajukan Kembali SKPP" : "Ajukan SKPP"}</h1>
          <p className="portal-sub">
            {editId
              ? <>Data pengajuan yang sebelumnya ditolak ({editId}) sudah terisi otomatis. Periksa dan perbaiki seperlunya, lalu kirim ulang untuk masuk kembali ke antrean verifikasi Loket.</>
              : <>Isi data pemohon dan unggah berkas persyaratan. Pengajuan masuk antrean dan akan diverifikasi oleh petugas loket.</>}
          </p>

          {role === "bendahara" && !editId && (
            <div className="p-role" style={{ marginBottom: 18 }}>
              <button type="button" className={mode === "tunggal" ? "on" : ""} onClick={() => setMode("tunggal")}>
                <div className="rt"><IcoPerson size={18} /> Tunggal</div>
                <div className="rd">Satu pegawai</div>
              </button>
              <button type="button" className={mode === "bulk" ? "on" : ""} onClick={() => setMode("bulk")}>
                <div className="rt"><IcoPackage size={18} /> Bulk</div>
                <div className="rd">Banyak pegawai sekaligus</div>
              </button>
            </div>
          )}

          {err && <div className="p-alert p-alert-err"><IcoAlertTriangle size={16} /><div>{err}</div></div>}

          {mode === "tunggal" && (() => {
            const fe = showErr ? tunggalFieldErrors(f) : {};
            return (
            <>
              <div className="p-grid2">
                <F label="Nama Lengkap *" error={fe.nama}>
                  <input value={f.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Sesuai SK" />
                </F>
                <F label="NIP *" error={fe.nip}>
                  <input value={f.nip} onChange={(e) => set("nip", e.target.value.replace(/\D/g, "").slice(0, 18))} inputMode="numeric" maxLength={18} placeholder="18 digit angka" style={{ fontFamily: "monospace" }} />
                </F>
              </div>
              <SearchableSelect
                label="OPD / Instansi *"
                value={f.opd}
                onChange={(v) => set("opd", v)}
                options={DAFTAR_OPD}
                placeholder="— Pilih OPD / Instansi —"
                error={fe.opd}
                disabled
              />
              <F label="Jabatan Terakhir *" error={fe.jabatan}>
                <input value={f.jabatan} onChange={(e) => set("jabatan", e.target.value)} placeholder="Jabatan terakhir sesuai SK" />
              </F>
              <PangkatField
                jenisASN={f.jenisASN}
                value={f.pangkat}
                onJenis={(v) => setF((s) => ({ ...s, jenisASN: v, pangkat: pangkatUntukStatus(v).includes(s.pangkat) ? s.pangkat : "" }))}
                onPangkat={(v) => set("pangkat", v)}
                error={fe.pangkat}
              />
              <div className="p-grid2">
                <F label="Keperluan SKPP *">
                  <select value={f.alasan} onChange={(e) => set("alasan", e.target.value)}>
                    {DAFTAR_KEPERLUAN_ONLINE.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </F>
                {showTmt(f.alasan) && (
                  <F label={tmtLabel(f.alasan) + " *"} error={fe.tmt}>
                    <input type="date" value={f.tmt} onChange={(e) => set("tmt", e.target.value)} placeholder={tmtLabel(f.alasan) + " sesuai SK"} />
                  </F>
                )}
                {f.alasan === "Meninggal Dunia" && <StatusAhliWaris v={f} on={set} error={fe.ahliWaris} />}
              </div>

              <AhliWarisFields v={f} on={set} errors={fe} />

              <div className="field">
                <label>Berkas Persyaratan</label>
                {editId && (
                  <div className="p-alert p-alert-info" style={{ marginBottom: 10 }}>
                    <IcoInfo size={16} />
                    <div>
                      Berkas dari pengajuan sebelumnya tetap tersimpan{existingBerkas.length ? ` (${existingBerkas.length} berkas)` : ""} dan tidak perlu diunggah ulang.
                      Unggah di sini hanya bila ingin <strong>menambah atau mengganti</strong> dokumen.
                    </div>
                  </div>
                )}
                <BerkasPersyaratan alasan={effectiveAlasan(f)} files={files} setFiles={setFiles} showErrors={showErr && !editId} />
              </div>

              <button className="btn btn-primary btn-block" disabled={busy} onClick={submitTunggal}>
                {busy ? "⟳ Mengirim…" : editId ? "Kirim Ulang Pengajuan" : "Kirim Pengajuan"}
              </button>
            </>
            );
          })()}

          {mode === "bulk" && role === "bendahara" && (
            <>
              <SearchableSelect
                label="OPD / Instansi Pengirim *"
                value={bulkOPD}
                onChange={setBulkOPD}
                options={DAFTAR_OPD}
                placeholder="— Pilih OPD —"
                error={showBulkErr && !bulkOPD ? "Wajib dipilih." : ""}
                disabled
              />

              <div className="p-alert p-alert-info">
                <IcoPackage size={16} />
                <div>Pengajuan kolektif untuk beberapa pegawai dalam satu OPD, beserta kelengkapan berkas persyaratan masing-masing. Seluruh pengajuan dalam grup ini menggunakan <strong>satu Kode Akses</strong> yang sama dan dibedakan melalui <strong>Nomor Pengajuan</strong> tiap pegawai.</div>
              </div>

              {items.map((it, idx) => {
                const ie = showBulkErr ? itemFieldErrors(it) : {};
                return (
                <div className="p-emp-card" key={it._id}>
                  <div className="p-emp-head">
                    <span className="p-emp-no"><i>{idx + 1}</i> Pegawai #{idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" className="p-link" style={{ color: "#dc2626" }} onClick={() => setItems((p) => p.filter((x) => x._id !== it._id))}>Hapus</button>
                    )}
                  </div>
                  <div className="p-emp-body">
                    <div className="p-emp-data">
                  <div className="p-grid2">
                    <F label="Nama *" error={ie.nama} style={{ marginBottom: 8 }}>
                      <input value={it.nama} onChange={(e) => setItem(it._id, "nama", e.target.value)} placeholder="Sesuai SK" />
                    </F>
                    <F label="NIP *" error={ie.nip} style={{ marginBottom: 8 }}>
                      <input value={it.nip} onChange={(e) => setItem(it._id, "nip", e.target.value.replace(/\D/g, "").slice(0, 18))} inputMode="numeric" maxLength={18} placeholder="18 digit angka" style={{ fontFamily: "monospace" }} />
                    </F>
                    <F label="Jabatan *" error={ie.jabatan} style={{ marginBottom: 8 }}>
                      <input value={it.jabatan} onChange={(e) => setItem(it._id, "jabatan", e.target.value)} placeholder="Jabatan terakhir sesuai SK" />
                    </F>
                    <F label="Jenis ASN *" style={{ marginBottom: 8 }}>
                      <select value={it.jenisASN} onChange={(e) => setItemJenis(it._id, e.target.value)}>
                        <option value="PNS">PNS</option>
                        <option value="PPPK">PPPK</option>
                      </select>
                    </F>
                    <F label={(it.jenisASN === "PPPK" ? "Golongan" : "Pangkat / Golongan") + " *"} error={ie.pangkat} style={{ marginBottom: 8 }}>
                      <select value={it.pangkat} onChange={(e) => setItem(it._id, "pangkat", e.target.value)}>
                        <option value="">— Pilih —</option>
                        {pangkatUntukStatus(it.jenisASN).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </F>
                    <F label="Keperluan *" style={{ marginBottom: 8 }}>
                      <select value={it.alasan} onChange={(e) => setItem(it._id, "alasan", e.target.value)}>
                        {DAFTAR_KEPERLUAN_ONLINE.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </F>
                    {showTmt(it.alasan) && (
                      <F label={tmtLabel(it.alasan) + " *"} error={ie.tmt} style={{ marginBottom: 8 }}>
                        <input type="date" value={it.tmt} onChange={(e) => setItem(it._id, "tmt", e.target.value)} placeholder={tmtLabel(it.alasan) + " sesuai SK"} />
                      </F>
                    )}
                    {it.alasan === "Meninggal Dunia" && (
                      <StatusAhliWaris v={it} on={(k, val) => setItem(it._id, k, val)} error={ie.ahliWaris} style={{ marginBottom: 8 }} />
                    )}
                  </div>
                  <div style={{ marginTop: it.alasan === "Meninggal Dunia" ? 8 : 0 }}>
                    <AhliWarisFields v={it} on={(k, val) => setItem(it._id, k, val)} errors={ie} />
                  </div>
                    </div>
                    <div className="p-emp-berkas">
                      <label>Berkas Persyaratan</label>
                      <BerkasPersyaratan
                        alasan={effectiveAlasan(it)}
                        files={it.files || []}
                        setFiles={(arr) => setItemFiles(it._id, arr)}
                        showErrors={showBulkErr}
                      />
                    </div>
                  </div>
                </div>
                );
              })}

              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItems((p) => [...p, newItem()])}>+ Tambah Pegawai</button>
                <span style={{ fontSize: 12, color: "var(--g500)", alignSelf: "center" }}>{items.length} pegawai</span>
              </div>

              <button className="btn btn-primary btn-block" disabled={busy} onClick={submitBulk}>
                {busy ? "⟳ Mengirim…" : `Kirim ${items.length} Pengajuan`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
