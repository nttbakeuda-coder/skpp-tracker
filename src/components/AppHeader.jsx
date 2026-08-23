import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { IcoBook, IcoFileText, IcoLogOut, IcoMail } from "./Icons.jsx";
import { getPreferensiNotif, simpanPreferensiNotif } from "../portal.js";
import "../landing.css";

const ROLE_LABEL = { bendahara: "Bendahara OPD", pemohon: "Pegawai" };

// Modal Pengaturan Notifikasi progres SKPP (kanal email/WhatsApp + nomor WA).
function NotifikasiModal({ uid, onClose }) {
  const [channel, setChannel] = useState("email");
  const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    getPreferensiNotif(uid).then((p) => { if (alive) { setChannel(p.channel); setWa(p.wa); setLoading(false); } });
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const perluWa = channel === "whatsapp" || channel === "both";

  async function simpan() {
    setErr(""); setMsg("");
    if (perluWa && !wa.replace(/\D/g, "")) { setErr("Nomor WhatsApp wajib diisi."); return; }
    setSaving(true);
    const { error } = await simpanPreferensiNotif(channel, perluWa ? wa : "");
    setSaving(false);
    if (error) { setErr(error.message || "Gagal menyimpan preferensi."); return; }
    setMsg("Preferensi notifikasi tersimpan.");
  }

  const OPSI = [
    ["email", "Email", "Kirim ke alamat email akun Anda."],
    ["whatsapp", "WhatsApp", "Kirim ke nomor WhatsApp Anda."],
    ["both", "Email & WhatsApp", "Kirim ke keduanya."],
    ["off", "Nonaktif", "Tidak menerima notifikasi progres."],
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 12000, background: "rgba(0,20,50,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, maxWidth: 440, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,35,82,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--g200, #e2e8f0)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy, #002352)" }}>Pengaturan Notifikasi</div>
          <button type="button" onClick={onClose} aria-label="Tutup" style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: 12.5, color: "var(--g500, #64748b)", margin: "0 0 14px", lineHeight: 1.6 }}>
            Pilih cara menerima pemberitahuan saat status pengajuan SKPP Anda berubah — diproses, dikembalikan, ditolak, atau selesai.
          </p>
          {loading ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Memuat…</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {OPSI.map(([val, label, desc]) => (
                  <label key={val} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${channel === val ? "var(--navy, #002352)" : "#e2e8f0"}`, background: channel === val ? "rgba(0,35,82,0.04)" : "#fff" }}>
                    <input type="radio" name="notif-ch" checked={channel === val} onChange={() => setChannel(val)} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy, #002352)" }}>{label}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {perluWa && (
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--navy, #002352)", marginBottom: 6 }}>Nomor WhatsApp</label>
                  <input
                    value={wa}
                    onChange={(e) => setWa(e.target.value.replace(/[^0-9+]/g, ""))}
                    inputMode="tel"
                    placeholder="mis. 081234567890"
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 9, fontSize: 14, fontFamily: "monospace" }}
                  />
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>Gunakan nomor aktif WhatsApp. Format 08… atau 62… sama-sama diterima.</div>
                </div>
              )}
              {err && <div style={{ marginTop: 12, fontSize: 12.5, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>{err}</div>}
              {msg && <div style={{ marginTop: 12, fontSize: 12.5, color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: "8px 12px" }}>{msg}</div>}
              <button type="button" onClick={simpan} disabled={saving} style={{ marginTop: 16, width: "100%", padding: 11, border: "none", borderRadius: 9, background: "var(--navy, #002352)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "wait" : "pointer" }}>
                {saving ? "Menyimpan…" : "Simpan Preferensi"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Header aplikasi (halaman yang butuh login: Ajukan, Pengajuan Saya) --
// sticky navy, avatar + menu (Notifikasi/Panduan/Regulasi/Keluar).
export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
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
          <button type="button" className="lp-menu-item" onClick={() => { setOpen(false); setShowNotif(true); }}>
            <IcoMail size={15} /> Notifikasi
          </button>
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

      {showNotif && user && <NotifikasiModal uid={user.id} onClose={() => setShowNotif(false)} />}
    </header>
  );
}
