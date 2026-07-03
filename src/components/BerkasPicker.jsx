import { useRef, useState } from "react";
import {
  BERKAS_ACCEPT,
  BERKAS_MAX_MB,
  BERKAS_MAX_FILES,
  BERKAS_ACCEPT_LABEL,
  DAFTAR_DOKUMEN_SKPP,
} from "../refdata.js";

function fmtSize(b) {
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// Pemilih berkas terkontrol. `files` = [{ file, jenis, _id }]. Validasi tipe/
// ukuran/jumlah saat menambah.
export function BerkasPicker({ files, setFiles }) {
  const inputRef = useRef(null);
  const [err, setErr] = useState("");

  function addFiles(list) {
    setErr("");
    const incoming = Array.from(list || []);
    const accepted = [];
    for (const file of incoming) {
      if (!BERKAS_ACCEPT.includes(file.type)) {
        setErr(`"${file.name}" bukan PDF/JPG/PNG.`);
        continue;
      }
      if (file.size > BERKAS_MAX_MB * 1024 * 1024) {
        setErr(`"${file.name}" melebihi ${BERKAS_MAX_MB} MB.`);
        continue;
      }
      accepted.push({ file, jenis: "", _id: Date.now() + Math.random() });
    }
    let next = [...files, ...accepted];
    if (next.length > BERKAS_MAX_FILES) {
      setErr(`Maksimal ${BERKAS_MAX_FILES} berkas.`);
      next = next.slice(0, BERKAS_MAX_FILES);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  const setJenis = (id, v) => setFiles(files.map((x) => (x._id === id ? { ...x, jenis: v } : x)));
  const remove = (id) => setFiles(files.filter((x) => x._id !== id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
          📎 Tambah Berkas
        </button>
        <span className="hint" style={{ fontSize: 11, color: "var(--g500)" }}>{BERKAS_ACCEPT_LABEL}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {err && <div className="p-alert p-alert-err" style={{ marginBottom: 10 }}><span>⚠️</span><div>{err}</div></div>}

      {files.map((x) => (
        <div className="p-file-row" key={x._id}>
          <span>{x.file.type === "application/pdf" ? "📄" : "🖼️"}</span>
          <span className="fn" title={x.file.name}>{x.file.name}</span>
          <span style={{ color: "var(--g500)" }}>{fmtSize(x.file.size)}</span>
          <select
            value={x.jenis}
            onChange={(e) => setJenis(x._id, e.target.value)}
            style={{ maxWidth: 220, padding: "4px 8px", fontSize: 12, border: "1px solid var(--g200)", borderRadius: 6 }}
          >
            <option value="">— Jenis dokumen (opsional) —</option>
            {DAFTAR_DOKUMEN_SKPP.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button type="button" className="p-link" style={{ color: "#dc2626" }} onClick={() => remove(x._id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
