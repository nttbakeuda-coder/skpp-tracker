import { REG_TABS } from "../kontenLanding.js";
import { bukaPdf, bukaTautan } from "../pdfStatik.js";
import { IcoDownload, IcoExternal } from "./Icons.jsx";

// Isi panel detail regulasi (kode+judul, tab Ringkasan/Pasal/Dokumen/Unduh)
// -- dipakai landing (panel di beranda) DAN halaman Regulasi dalam-aplikasi.
// Catatan: memakai kelas lp-* sehingga host WAJIB membungkusnya dalam elemen
// ber-class "lp" agar variabel CSS-nya tersedia.
export function RegulasiDetail({ rd, tab, onTab }) {
  return (
    <>
      <div>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12.5, fontWeight: 600, color: "var(--lp-blue-600)" }}>{rd.kode}</div>
        <h3 style={{ margin: "6px 0 0", fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3, color: "var(--lp-navy-800)" }}>{rd.judul}</h3>
      </div>
      <div className="lp-reg-tabs">
        {REG_TABS.map((t, i) => (
          <button key={t} type="button" className={tab === i ? "on" : ""} onClick={() => onTab(i)}>{t}</button>
        ))}
      </div>
      {tab === 0 && (
        <div className="lp-reg-ringkasan">
          {(rd.ringkasan || "").split("\n\n").filter(Boolean).map((par, i) => (
            <p key={i}>{par}</p>
          ))}
        </div>
      )}
      {tab === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rd.rows.map((row, i) => (
            <div className="lp-reg-row-detail" key={i}>
              <div className="lbl">{row.l}</div>
              <div className="s">{row.s}</div>
              <div className="r"><strong style={{ color: "var(--lp-navy-800)" }}>Relevansi terhadap SKPP: </strong>{row.r}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 2 && (
        <div className="lp-reg-meta">
          {rd.dok.map((d, i) => (
            <div className="lp-reg-meta-row" key={i}>
              <div className="k">{d.k}</div>
              <div className="v">{d.v}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rd.pdf && (
            <button type="button" className="lp-btn lp-btn-primary lp-btn-md" style={{ width: "100%" }} onClick={() => bukaPdf(rd.pdf, `regulasi ${rd.kode}`)}>
              <IcoDownload size={16} /> Buka PDF Regulasi
            </button>
          )}
          {rd.jdihUrl && (
            <button type="button" className="lp-btn lp-btn-secondary lp-btn-md" style={{ width: "100%" }} onClick={() => bukaTautan(rd.jdihUrl, rd.jdih)}>
              <IcoExternal size={16} /> Lihat pada {rd.jdih || "sumber resmi"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
