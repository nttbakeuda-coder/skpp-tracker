import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { listPengajuanSaya, uploadBerkas } from "../portal.js";
import { BerkasPicker } from "../components/BerkasPicker.jsx";

function StatusBadge({ status }) {
  if (status === "selesai") return <span className="badge-selesai">✓ Selesai</span>;
  if (status === "kembali") return <span className="badge-kembali">↩ Dikembalikan</span>;
  if (status === "ditolak")
    return <span className="badge-kembali" style={{ background: "#fee2e2", color: "#b91c1c" }}>⛔ Ditolak</span>;
  if (status === "diajukan")
    return <span className="badge-proses" style={{ background: "#fef3c7", color: "#92400e" }}>⏳ Diajukan</span>;
  return <span className="badge-proses">⟳ Diproses</span>;
}

export default function PengajuanSaya() {
  const { user, isLoggedIn, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState("");

  // Unggah berkas per pengajuan
  const [openFor, setOpenFor] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

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
    })();
    return () => {
      alive = false;
    };
  }, [user]);

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
  }

  return (
    <div className="portal-page">
      <div className="portal-wrap wide">
        <div className="portal-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="portal-tag">Portal Pengajuan SKPP</div>
              <h1 className="portal-title">Pengajuan Saya</h1>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => nav("/ajukan")}>+ Ajukan Baru</button>
          </div>

          {err && <div className="p-alert p-alert-err" style={{ marginTop: 14 }}><span>⚠️</span><div>{err}</div></div>}

          {loadingList ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--g500)" }}>Memuat…</div>
          ) : rows.length === 0 ? (
            <div className="p-alert p-alert-info" style={{ marginTop: 14 }}>
              <span>📭</span>
              <div>Belum ada pengajuan. Klik <strong>Ajukan Baru</strong> untuk memulai.</div>
            </div>
          ) : (
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
                  {rows.map((r) => (
                    <Fragment key={r.id}>
                      <tr>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.id}</td>
                        <td>{r.nama}</td>
                        <td>{r.alasan || "-"}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td><span className="p-kode">{r.kodeAkses}</span></td>
                        <td>
                          <button className="p-link" onClick={() => nav(`/#lacak`)} style={{ marginRight: 10 }}>Lacak</button>
                          {r.status === "diajukan" && (
                            <button
                              className="p-link"
                              onClick={() => { setOpenFor(openFor === r.id ? null : r.id); setFiles([]); setUploadMsg(""); }}
                            >
                              {openFor === r.id ? "Tutup" : "Unggah Berkas"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {openFor === r.id && (
                        <tr key={r.id + "-up"}>
                          <td colSpan={6} style={{ background: "var(--g50)" }}>
                            <div style={{ padding: "6px 4px" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--g600)", marginBottom: 8 }}>
                                Unggah berkas untuk {r.id}
                              </div>
                              <BerkasPicker files={files} setFiles={setFiles} />
                              {uploadMsg && <div className="p-alert p-alert-ok" style={{ marginTop: 8 }}><span>✅</span><div>{uploadMsg}</div></div>}
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: 8 }}
                                disabled={uploading || !files.length}
                                onClick={() => doUpload(r.id)}
                              >
                                {uploading ? "⟳ Mengunggah…" : "Unggah"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ marginTop: 16, fontSize: 12, color: "var(--g500)" }}>
            Gunakan <strong>Nomor Pengajuan</strong> atau <strong>NIP</strong> beserta <strong>Kode Akses</strong> untuk
            melacak status di beranda. Berkas hanya dapat diunggah selama status masih <strong>Diajukan</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
