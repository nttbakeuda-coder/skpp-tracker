import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.jsx";
import { DP_DOKUMEN_GRUP } from "../refdata.js";
import { DOC_SLIDE_META, PANDUAN_PERAN } from "../kontenLanding.js";
import { bukaPdf } from "../pdfStatik.js";
import { IcoDownload } from "../components/Icons.jsx";
import "../landing.css";

// Halaman "Panduan & Persyaratan" DALAM aplikasi (setelah masuk). Kartu peran
// memakai PANDUAN_PERAN -- data yang SAMA dengan halaman Panduan di luar login
// (Beranda) supaya informasinya identik; hanya gayanya kartu navy (aplikasi).
export default function Panduan() {
  const nav = useNavigate();

  return (
    <div className="portal-page in-app lp" style={{ background: "var(--g100, #F1F4F9)" }}>
      <AppHeader />
      <div className="portal-wrap wide" style={{ maxWidth: 1080, paddingTop: 32 }}>
        <button type="button" className="lp-app-back" onClick={() => nav("/pengajuan-saya")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          Kembali ke Pengajuan Saya
        </button>
        <div className="lp-app-eyebrow"><span className="bar" /><span>Portal Pengajuan SKPP</span></div>
        <h2 className="lp-app-title">Panduan &amp; Persyaratan</h2>
        <p className="lp-app-sub">
          Lengkapi dokumen sesuai jenis SKPP yang diajukan. Seluruh berkas diunggah dalam format
          PDF/JPG/PNG, maksimal 5 MB per dokumen.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginTop: 24 }}>
          {PANDUAN_PERAN.map((pr) => (
            <div key={pr.label} className="lp-peran-card">
              <div className="lp-peran-eyebrow">{pr.label}</div>
              <div className="lp-peran-title">Panduan pengajuan SKPP</div>
              <ul className="lp-peran-list">
                {pr.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
              <button
                type="button" className="lp-peran-unduh"
                onClick={() => bukaPdf(pr.pdf, `panduan ${pr.label}`)}
              >
                <IcoDownload size={15} /> Unduh panduan (PDF)
              </button>
            </div>
          ))}
        </div>

        <div className="lp-app-eyebrow" style={{ marginTop: 32 }}><span className="bar" /><span>Dokumen Persyaratan</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
          {DP_DOKUMEN_GRUP.map((g, gi) => (
            <div key={gi} className="lp-dok-card">
              <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--lp-navy-800)" }}>
                {DOC_SLIDE_META[gi]?.t || g.grup}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map((it, ii) => (
                  <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, lineHeight: 1.5, color: "var(--lp-grey-700)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lp-success-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 2 }}><polyline points="20 6 9 17 4 12" /></svg>
                    <span>{it.t}</span>
                  </div>
                ))}
              </div>
              {DOC_SLIDE_META[gi]?.n && (
                <div style={{ fontSize: 11.5, color: "var(--lp-grey-500)", marginTop: "auto", paddingTop: 4 }}>{DOC_SLIDE_META[gi].n}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
