import { useRef, useState } from "react";
import {
  DP_DOKUMEN_GRUP,
  dpGrupTampil,
  BERKAS_ACCEPT,
  BERKAS_MAX_MB,
  BERKAS_MAX_FILES,
  BERKAS_ACCEPT_LABEL,
} from "../refdata.js";
import { IcoPaperclip, IcoFileText, IcoImage, IcoAlertTriangle } from "./Icons.jsx";

const LAIN = "Dokumen lain / pelengkap";

function fmtSize(b) {
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// Satu baris persyaratan: label dokumen + tombol unggah + daftar berkas terlampir.
function ReqRow({ label, ket, items, onAdd, onRemove, error }) {
  const inputRef = useRef(null);
  return (
    <div className={"req-row" + (error ? " invalid" : "")}>
      <div className="req-head">
        <div className="req-label">
          {label}
          {ket && <span className="req-ket">{ket}</span>}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5 }} onClick={() => inputRef.current?.click()}>
          <IcoPaperclip size={13} /> Unggah
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e) => {
            onAdd(label, e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {items.length > 0 && (
        <div className="req-files">
          {items.map((x) => (
            <div className="p-file-row" key={x._id}>
              <span style={{ display: "inline-flex", color: "var(--g500)" }}>
                {x.file.type === "application/pdf" ? <IcoFileText size={15} /> : <IcoImage size={15} />}
              </span>
              <span className="fn" title={x.file.name}>{x.file.name}</span>
              <span style={{ color: "var(--g500)" }}>{fmtSize(x.file.size)}</span>
              <button type="button" className="p-link" style={{ color: "#dc2626" }} onClick={() => onRemove(x._id)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <div className="field-err">{error}</div>}
    </div>
  );
}

// Unggah berkas terpilah PER PERSYARATAN (Lampiran 1). Grup dokumen yang tampil
// menyesuaikan Keperluan SKPP (`alasan`). Setiap berkas ditandai `jenis` = nama
// dokumen persyaratannya. `files` = [{ file, jenis, _id }] (bentuk sama dgn upload).
export function BerkasPersyaratan({ alasan, files, setFiles, showErrors }) {
  const [err, setErr] = useState("");
  const tampil = dpGrupTampil(alasan);

  function addFor(jenis, list) {
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
      accepted.push({ file, jenis, _id: Date.now() + Math.random() });
    }
    let next = [...files, ...accepted];
    if (next.length > BERKAS_MAX_FILES) {
      setErr(`Maksimal ${BERKAS_MAX_FILES} berkas.`);
      next = next.slice(0, BERKAS_MAX_FILES);
    }
    setFiles(next);
  }
  const removeId = (id) => setFiles(files.filter((x) => x._id !== id));
  const filesFor = (jenis) => files.filter((x) => x.jenis === jenis);

  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--g500)", marginBottom: 10 }}>
        Unggah tiap dokumen pada slotnya. {BERKAS_ACCEPT_LABEL}.
      </div>
      {err && (
        <div className="p-alert p-alert-err" style={{ marginBottom: 10 }}>
          <IcoAlertTriangle size={16} />
          <div>{err}</div>
        </div>
      )}

      {DP_DOKUMEN_GRUP.map(
        (g, gi) =>
          tampil[gi] && (
            <div className="req-grup" key={gi}>
              <div className="req-grup-title">{g.grup}</div>
              {g.items.map((it, ii) => (
                <ReqRow
                  key={ii} label={it.t} ket={it.ket} items={filesFor(it.t)} onAdd={addFor} onRemove={removeId}
                  error={showErrors && filesFor(it.t).length === 0 ? "Wajib diunggah." : ""}
                />
              ))}
            </div>
          )
      )}

      <div className="req-grup">
        <div className="req-grup-title">DOKUMEN LAIN (OPSIONAL)</div>
        <ReqRow label={LAIN} items={filesFor(LAIN)} onAdd={addFor} onRemove={removeId} />
      </div>

      <div style={{ fontSize: 11, color: "var(--g500)", marginTop: 4 }}>
        Total berkas: {files.length}/{BERKAS_MAX_FILES}
      </div>
    </div>
  );
}
