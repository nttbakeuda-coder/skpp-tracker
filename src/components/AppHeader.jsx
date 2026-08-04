import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { IcoBook, IcoFileText, IcoLogOut } from "./Icons.jsx";
import "../landing.css";

const ROLE_LABEL = { bendahara: "Bendahara OPD", pemohon: "Pegawai" };

// Header aplikasi (halaman yang butuh login: Ajukan, Pengajuan Saya) --
// sticky navy, avatar + menu (Panduan/Regulasi/Keluar), sesuai desain
// handoff. Berbeda dari Navbar publik (dipakai Masuk/Daftar, blm login).
export function AppHeader() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const initials = (profile?.nama || "").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const roleLine = [ROLE_LABEL[profile?.role] || null, profile?.opd].filter(Boolean).join(" · ");

  async function keluar() {
    setOpen(false);
    await signOut();
    // Ke beranda + minta Landing membuka modal Masuk (lihat efek loc.state).
    nav("/", { state: { masuk: true } });
  }

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 200, display: "flex", alignItems: "center", gap: 20,
        padding: "0 28px", height: 60, background: "var(--navy, #002352)",
        boxShadow: "0 2px 12px rgba(0,35,82,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, cursor: "pointer" }} onClick={() => nav("/pengajuan-saya")}>
        <img src="/logo-sipasti-white.png" alt="KATONG SKPP" style={{ height: 26, width: "auto" }} />
        <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "0.03em", color: "var(--gold, #E0A53C)", whiteSpace: "nowrap" }}>KATONG SKPP</div>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Provinsi Nusa Tenggara Timur
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, marginLeft: "auto", minWidth: 0 }} ref={ref}>
        {profile?.opd && (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 }}>{profile.opd}</span>
        )}
        {profile?.opd && profile?.nama && (
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)", flex: "none" }} />
        )}
        {profile?.nama && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", flex: "none" }}>{profile.nama}</span>
        )}
        <span
          onClick={() => setOpen((v) => !v)}
          style={{
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
            borderRadius: "50%", background: "var(--gold, #E0A53C)", color: "var(--navy, #002352)", fontSize: 11, fontWeight: 800,
            border: "2px solid " + (open ? "rgba(255,255,255,0.85)" : "transparent"), transition: "border-color 0.2s, transform 0.12s",
          }}
        >
          {initials || "U"}
        </span>

        <div
          style={{
            position: "absolute", top: "calc(100% + 12px)", right: 0, zIndex: 20, width: 210, background: "#fff",
            borderRadius: 12, boxShadow: "0 16px 48px rgba(0,35,82,0.28), 0 2px 10px rgba(0,35,82,0.12)", padding: 8,
            opacity: open ? 1 : 0, transform: open ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
            pointerEvents: open ? "auto" : "none", transition: "opacity 200ms cubic-bezier(0.2,0,0,1), transform 200ms cubic-bezier(0.2,0,0,1)",
          }}
        >
          <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--g200, #E2E7EF)", marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy, #002352)", lineHeight: 1.3 }}>{profile?.nama || "Pengguna"}</div>
            {roleLine && <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, color: "var(--g500, #7A8699)", marginTop: 2 }}>{roleLine}</div>}
          </div>
          <button type="button" className="lp-menu-item" onClick={() => { setOpen(false); nav("/panduan"); }}>
            <IcoBook size={15} /> Panduan
          </button>
          <button type="button" className="lp-menu-item" onClick={() => { setOpen(false); nav("/regulasi"); }}>
            <IcoFileText size={15} /> Regulasi
          </button>
          <div style={{ height: 1, background: "var(--g200, #E2E7EF)", margin: "6px 4px" }} />
          <button type="button" className="lp-menu-item danger" onClick={keluar}>
            <IcoLogOut size={15} /> Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
