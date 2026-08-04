import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.jsx";
import { RegulasiDetail } from "../components/RegulasiDetail.jsx";
import { REGULASI } from "../kontenLanding.js";
import { IcoX, IcoChevronDown } from "../components/Icons.jsx";
import "../landing.css";

// Halaman "Dasar Hukum Layanan SKPP" DALAM aplikasi -- mengikuti bagian
// isAppRegulasi prototipe handoff: kartu putih daftar regulasi; klik baris
// membuka panel detail dari kanan; saat panel terbuka daftar TETAP terlihat
// namun menyusut (kode & deskripsi disembunyikan, hanya judul), konten diberi
// margin kanan selebar panel, dan baris terpilih diberi latar biru muda.
export default function Regulasi() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState(0);

  const rd = REGULASI[idx];

  function buka(i) {
    setIdx(i);
    setTab(0);
    setOpen(true);
  }

  return (
    <div className="portal-page in-app lp" style={{ background: "var(--g100, #F1F4F9)" }}>
      <AppHeader />
      <div
        className="portal-wrap wide"
        style={{
          maxWidth: 1080, paddingTop: 32,
          marginRight: open ? "calc(min(560px, calc(94vw / 0.8)) + 32px)" : "auto",
          transition: "margin 420ms cubic-bezier(0.2,0,0,1)",
        }}
      >
        <button type="button" className="lp-app-back" onClick={() => nav("/pengajuan-saya")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          Kembali ke Pengajuan Saya
        </button>
        <div className="lp-app-eyebrow"><span className="bar" /><span>Portal Pengajuan SKPP</span></div>
        <h2 className="lp-app-title">Dasar Hukum Layanan SKPP</h2>
        <p className="lp-app-sub">
          Pilih regulasi untuk melihat ringkasan, pasal relevan, informasi dokumen, dan tautan
          unduhan resmi.
        </p>

        <div style={{ background: "#fff", borderRadius: 14, padding: "8px 28px", boxShadow: "0 6px 18px rgba(0,35,82,0.08)", marginTop: 24 }}>
          {REGULASI.map((r, i) => (
            <div
              key={r.kode}
              onClick={() => buka(i)}
              className="lp-appreg-row"
              style={{
                gridTemplateColumns: open ? "1fr auto" : "170px 1fr auto",
                background: open && idx === i ? "var(--lp-blue-50)" : "transparent",
              }}
            >
              {!open && (
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12.5, fontWeight: 600, color: "var(--lp-blue-600)" }}>{r.kode}</div>
              )}
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--lp-navy-800)", lineHeight: 1.4 }}>{r.judul}</div>
                {!open && (
                  <div style={{ fontSize: 12.5, color: "var(--lp-grey-600)", marginTop: 3, lineHeight: 1.5 }}>{r.deskripsi}</div>
                )}
              </div>
              <IcoChevronDown size={16} style={{ transform: "rotate(-90deg)", color: "var(--lp-grey-400)", flex: "none" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Backdrop + panel detail (fixed, dari kanan) */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,16,38,0.22)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity 420ms cubic-bezier(0.2,0,0,1)",
        }}
      />
      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 500,
          width: "min(560px, calc(94vw / 0.8))", background: "#fff",
          boxShadow: "0 24px 80px rgba(0,35,82,0.35)",
          transform: open ? "translateX(0)" : "translateX(105%)",
          transition: "transform 420ms cubic-bezier(0.2,0,0,1)", overflowY: "auto",
        }}
      >
        <div className="lp-panel-in">
          <div className="lp-panel-head">
            <div className="lp-eyebrow"><span className="bar" style={{ width: 22 }} /><span style={{ color: "var(--lp-grey-600)" }}>Regulasi</span></div>
            <button type="button" className="lp-panel-close" onClick={() => setOpen(false)}><IcoX size={16} /></button>
          </div>
          <RegulasiDetail rd={rd} tab={tab} onTab={setTab} />
        </div>
      </aside>
    </div>
  );
}
