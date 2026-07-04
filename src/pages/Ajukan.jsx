import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { ajukanPengajuan, uploadBerkas } from "../portal.js";
import { DAFTAR_OPD, DAFTAR_KEPERLUAN_ONLINE, AHLI_WARIS_HUBUNGAN, pangkatUntukStatus } from "../refdata.js";
import { BerkasPersyaratan } from "../components/BerkasPersyaratan.jsx";

// Keperluan efektif yang dikirim ke server, memperhitungkan status ahli waris
// untuk kasus Meninggal Dunia (tanpa ahli waris = diproses spt pemberhentian).
function effectiveAlasan(x) {
  if (x.alasan !== "Meninggal Dunia") return x.alasan;
  if (x.ahliWaris === "tanpa") return "Meninggal Dunia (Tanpa Ahli Waris)";
  if (x.ahliWaris === "dengan") {
    const aw = [x.namaAhliWaris?.trim(), x.hubunganAhliWaris].filter(Boolean).join(" — ");
    return "Meninggal Dunia (Dengan Ahli Waris)" + (aw ? ` — Ahli Waris: ${aw}` : "");
  }
  return "Meninggal Dunia";
}

// Validasi khusus ahli waris; kembalikan pesan error atau "".
function ahliWarisError(x) {
  if (x.alasan !== "Meninggal Dunia") return "";
  if (!x.ahliWaris) return "Pilih status ahli waris (dengan/tanpa).";
  if (x.ahliWaris === "dengan" && !x.namaAhliWaris.trim()) return "Isi nama ahli waris.";
  return "";
}

// Blok pilihan status ahli waris (muncul hanya bila Keperluan = Meninggal Dunia).
function AhliWarisFields({ v, on }) {
  if (v.alasan !== "Meninggal Dunia") return null;
  return (
    <>
      <div className="field">
        <label>Status Ahli Waris *</label>
        <select value={v.ahliWaris} onChange={(e) => on("ahliWaris", e.target.value)}>
          <option value="">— Pilih —</option>
          <option value="tanpa">Tanpa Ahli Waris (diproses seperti Pemberhentian dengan Hormat)</option>
          <option value="dengan">Dengan Ahli Waris</option>
        </select>
      </div>
      {v.ahliWaris === "dengan" && (
        <div className="p-grid2">
          <div className="field">
            <label>Nama Ahli Waris *</label>
            <input value={v.namaAhliWaris} onChange={(e) => on("namaAhliWaris", e.target.value)} placeholder="Nama ahli waris" />
          </div>
          <div className="field">
            <label>Hubungan</label>
            <select value={v.hubunganAhliWaris} onChange={(e) => on("hubunganAhliWaris", e.target.value)}>
              <option value="">— Pilih —</option>
              {AHLI_WARIS_HUBUNGAN.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
      )}
    </>
  );
}

// Kolom pangkat sesuai jenis ASN (jenisASN hanya transien — tidak dikirim ke RPC).
function PangkatField({ jenisASN, value, onJenis, onPangkat }) {
  return (
    <div className="p-grid2">
      <div className="field">
        <label>Jenis ASN</label>
        <select value={jenisASN} onChange={(e) => onJenis(e.target.value)}>
          <option value="PNS">PNS</option>
          <option value="PPPK">PPPK</option>
        </select>
      </div>
      <div className="field">
        <label>{jenisASN === "PPPK" ? "Golongan (PPPK)" : "Pangkat / Golongan"}</label>
        <select value={value} onChange={(e) => onPangkat(e.target.value)}>
          <option value="">{jenisASN === "PPPK" ? "-- Pilih Golongan --" : "-- Pilih Pangkat --"}</option>
          {pangkatUntukStatus(jenisASN).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const newItem = () => ({
  _id: Date.now() + Math.random(),
  nama: "", nip: "", jabatan: "", jenisASN: "PNS", pangkat: "", alasan: "Pensiun",
  ahliWaris: "", namaAhliWaris: "", hubunganAhliWaris: "",
});

export default function Ajukan() {
  const { user, profile, isApproved, isPending, isRejected, loading } = useAuth();
  const nav = useNavigate();
  const role = profile?.role;

  const [mode, setMode] = useState("tunggal");
  // Tunggal
  const [f, setF] = useState({
    nama: profile?.nama || "",
    nip: profile?.username || "",
    opd: profile?.opd || "",
    jabatan: "",
    jenisASN: "PNS",
    pangkat: "",
    alasan: "Pensiun",
    ahliWaris: "",
    namaAhliWaris: "",
    hubunganAhliWaris: "",
  });
  const [files, setFiles] = useState([]);
  // Bulk
  const [bulkOPD, setBulkOPD] = useState(profile?.opd || "");
  const [items, setItems] = useState([newItem()]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setItem = (id, k, v) => setItems((prev) => prev.map((it) => (it._id === id ? { ...it, [k]: v } : it)));
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
    return <div className="portal-page"><div className="portal-wrap"><div className="portal-card">Memuat…</div></div></div>;
  }

  // Gerbang persetujuan
  if (!isApproved) {
    return (
      <div className="portal-page">
        <div className="portal-wrap">
          <div className="portal-card">
            <h1 className="portal-title">Ajukan SKPP</h1>
            {isPending && (
              <div className="p-alert p-alert-warn" style={{ marginTop: 12 }}>
                <span>⏳</span>
                <div>Akun Anda <strong>menunggu persetujuan admin</strong>. Anda dapat mengajukan setelah disetujui.</div>
              </div>
            )}
            {isRejected && (
              <div className="p-alert p-alert-err" style={{ marginTop: 12 }}>
                <span>⛔</span>
                <div>Pendaftaran akun Anda <strong>ditolak</strong>. Silakan hubungi Bidang Perbendaharaan.</div>
              </div>
            )}
            {!isPending && !isRejected && (
              <div className="p-alert p-alert-info" style={{ marginTop: 12 }}>
                <span>ℹ️</span>
                <div>Akun ini tidak memiliki hak untuk mengajukan SKPP online.</div>
              </div>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => nav("/pengajuan-saya")}>Lihat Pengajuan Saya</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Hasil pengajuan ──
  if (result) {
    return (
      <div className="portal-page">
        <div className="portal-wrap wide">
          <div className="portal-card">
            <div style={{ fontSize: 40, textAlign: "center" }}>🎉</div>
            <h1 className="portal-title" style={{ textAlign: "center" }}>Pengajuan Terkirim</h1>
            <div className="p-alert p-alert-ok" style={{ marginTop: 12 }}>
              <span>✅</span>
              <div>
                Pengajuan masuk antrean <strong>diajukan</strong> dan akan diverifikasi loket.
                <strong> Simpan Kode Akses</strong> di bawah untuk melacak status.
                {typeof result.uploaded === "number" && (
                  <> Berkas terunggah: <strong>{result.uploaded}</strong>{result.failed ? `, gagal: ${result.failed}` : ""}.</>
                )}
              </div>
            </div>

            <table className="p-table" style={{ marginTop: 8 }}>
              <thead><tr><th>Nama</th><th>Nomor Pengajuan</th><th>Kode Akses</th></tr></thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.nama}</td>
                    <td>{r.error ? <span style={{ color: "#dc2626" }}>Gagal: {r.error}</span> : <strong style={{ fontFamily: "monospace" }}>{r.id}</strong>}</td>
                    <td>{r.error ? "—" : <span className="p-kode">{r.kodeAkses}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => nav("/pengajuan-saya")}>Lihat Pengajuan Saya</button>
              <button className="btn btn-ghost" onClick={() => { setResult(null); setFiles([]); setItems([newItem()]); }}>
                Ajukan Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function submitTunggal() {
    if (!f.nama.trim() || !f.nip.trim() || !f.opd) {
      setErr("Nama, NIP, dan OPD wajib diisi.");
      return;
    }
    const awe = ahliWarisError(f);
    if (awe) {
      setErr(awe);
      return;
    }
    setBusy(true);
    setErr("");
    const { data, error } = await ajukanPengajuan({
      nama: f.nama.trim(), nip: f.nip.trim(), opd: f.opd,
      jabatan: f.jabatan.trim(), pangkat: f.pangkat, alasan: effectiveAlasan(f),
    });
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
    if (!bulkOPD) { setErr("Pilih OPD / Instansi pengirim."); return; }
    if (!items.every((it) => it.nama.trim() && it.nip.trim())) {
      setErr("Setiap pegawai wajib memiliki Nama dan NIP.");
      return;
    }
    for (const it of items) {
      const e = ahliWarisError(it);
      if (e) {
        setErr(`Pegawai "${it.nama.trim() || "-"}": ${e}`);
        return;
      }
    }
    setBusy(true);
    setErr("");
    const rows = [];
    for (const it of items) {
      const { data, error } = await ajukanPengajuan({
        nama: it.nama.trim(), nip: it.nip.trim(), opd: bulkOPD,
        jabatan: it.jabatan.trim(), pangkat: it.pangkat, alasan: effectiveAlasan(it),
      });
      if (error || !data) rows.push({ nama: it.nama.trim(), error: error?.message || "gagal" });
      else rows.push({ nama: it.nama.trim(), id: data.id, kodeAkses: data.kodeAkses });
    }
    setBusy(false);
    setResult({ rows });
  }

  return (
    <div className="portal-page">
      <div className="portal-wrap wide">
        <div className="portal-card">
          <div className="portal-tag">Portal Pengajuan SKPP</div>
          <h1 className="portal-title">Ajukan SKPP</h1>
          <p className="portal-sub">
            Isi data pemohon dan unggah berkas. Jalur (A/B) & penomoran ditetapkan petugas loket
            saat verifikasi. Pengajuan masuk antrean untuk diproses.
          </p>

          {role === "bendahara" && (
            <div className="p-role" style={{ marginBottom: 18 }}>
              <button type="button" className={mode === "tunggal" ? "on" : ""} onClick={() => setMode("tunggal")}>
                <div className="rt">👤 Tunggal</div>
                <div className="rd">Satu pegawai (dengan berkas)</div>
              </button>
              <button type="button" className={mode === "bulk" ? "on" : ""} onClick={() => setMode("bulk")}>
                <div className="rt">📦 Bulk</div>
                <div className="rd">Banyak pegawai sekaligus</div>
              </button>
            </div>
          )}

          {err && <div className="p-alert p-alert-err"><span>⚠️</span><div>{err}</div></div>}

          {mode === "tunggal" && (
            <>
              <div className="p-grid2">
                <div className="field"><label>Nama Lengkap *</label><input value={f.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Sesuai SK" /></div>
                <div className="field"><label>NIP *</label><input value={f.nip} onChange={(e) => set("nip", e.target.value)} placeholder="18 digit" style={{ fontFamily: "monospace" }} /></div>
              </div>
              <div className="field">
                <label>OPD / Instansi *</label>
                <select value={f.opd} onChange={(e) => set("opd", e.target.value)}>
                  <option value="">— Pilih OPD / Instansi —</option>
                  {DAFTAR_OPD.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="field"><label>Jabatan Terakhir</label><input value={f.jabatan} onChange={(e) => set("jabatan", e.target.value)} placeholder="Jabatan terakhir sesuai SK" /></div>
              <PangkatField
                jenisASN={f.jenisASN}
                value={f.pangkat}
                onJenis={(v) => setF((s) => ({ ...s, jenisASN: v, pangkat: pangkatUntukStatus(v).includes(s.pangkat) ? s.pangkat : "" }))}
                onPangkat={(v) => set("pangkat", v)}
              />
              <div className="field">
                <label>Keperluan SKPP</label>
                <select value={f.alasan} onChange={(e) => set("alasan", e.target.value)}>
                  {DAFTAR_KEPERLUAN_ONLINE.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <AhliWarisFields v={f} on={set} />

              <div className="field">
                <label>Berkas Persyaratan</label>
                <BerkasPersyaratan alasan={effectiveAlasan(f)} files={files} setFiles={setFiles} />
              </div>

              <button className="btn btn-primary btn-block" disabled={busy} onClick={submitTunggal}>
                {busy ? "⟳ Mengirim…" : "Kirim Pengajuan"}
              </button>
            </>
          )}

          {mode === "bulk" && role === "bendahara" && (
            <>
              <div className="field">
                <label>OPD / Instansi Pengirim *</label>
                <select value={bulkOPD} onChange={(e) => setBulkOPD(e.target.value)}>
                  <option value="">— Pilih OPD —</option>
                  {DAFTAR_OPD.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="p-alert p-alert-info">
                <span>📦</span>
                <div>Setiap pegawai mendapat <strong>nomor & kode akses tersendiri</strong>. Berkas dapat diunggah per pengajuan lewat menu <strong>Pengajuan Saya</strong> setelah terkirim.</div>
              </div>

              {items.map((it, idx) => (
                <div className="p-emp-card" key={it._id}>
                  <div className="p-emp-head">
                    <span className="p-emp-no"><i>{idx + 1}</i> Pegawai #{idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" className="p-link" style={{ color: "#dc2626" }} onClick={() => setItems((p) => p.filter((x) => x._id !== it._id))}>✕ Hapus</button>
                    )}
                  </div>
                  <div className="p-grid2">
                    <div className="field" style={{ marginBottom: 8 }}><label>Nama *</label><input value={it.nama} onChange={(e) => setItem(it._id, "nama", e.target.value)} placeholder="Sesuai SK" /></div>
                    <div className="field" style={{ marginBottom: 8 }}><label>NIP *</label><input value={it.nip} onChange={(e) => setItem(it._id, "nip", e.target.value)} placeholder="18 digit" style={{ fontFamily: "monospace" }} /></div>
                    <div className="field" style={{ marginBottom: 8 }}><label>Jabatan</label><input value={it.jabatan} onChange={(e) => setItem(it._id, "jabatan", e.target.value)} placeholder="Jabatan terakhir sesuai SK" /></div>
                    <div className="field" style={{ marginBottom: 8 }}>
                      <label>Keperluan</label>
                      <select value={it.alasan} onChange={(e) => setItem(it._id, "alasan", e.target.value)}>
                        {DAFTAR_KEPERLUAN_ONLINE.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>Jenis ASN</label>
                      <select value={it.jenisASN} onChange={(e) => setItemJenis(it._id, e.target.value)}>
                        <option value="PNS">PNS</option>
                        <option value="PPPK">PPPK</option>
                      </select>
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>{it.jenisASN === "PPPK" ? "Golongan" : "Pangkat"}</label>
                      <select value={it.pangkat} onChange={(e) => setItem(it._id, "pangkat", e.target.value)}>
                        <option value="">— Pilih —</option>
                        {pangkatUntukStatus(it.jenisASN).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: it.alasan === "Meninggal Dunia" ? 8 : 0 }}>
                    <AhliWarisFields v={it} on={(k, val) => setItem(it._id, k, val)} />
                  </div>
                </div>
              ))}

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
