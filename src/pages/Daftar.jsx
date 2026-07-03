import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Turnstile } from "../Turnstile.jsx";
import { TURNSTILE_ENABLED } from "../config.js";
import { DAFTAR_OPD } from "../refdata.js";

const ROLES = [
  { id: "pemohon", rt: "👤 Pegawai (Perorangan)", rd: "Mengajukan SKPP milik sendiri" },
  { id: "bendahara", rt: "🏢 Bendahara OPD", rd: "Mengajukan untuk banyak pegawai (bulk)" },
];

export default function Daftar() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("pemohon");
  const [f, setF] = useState({ nama: "", nip: "", email: "", opd: "", password: "", ulang: "" });
  const [captcha, setCaptcha] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.nama.trim() || !f.nip.trim() || !f.email.trim() || !f.opd) {
      setErr("Nama, NIP, email, dan OPD wajib diisi.");
      return;
    }
    if (f.password.length < 8) {
      setErr("Kata sandi minimal 8 karakter.");
      return;
    }
    if (f.password !== f.ulang) {
      setErr("Konfirmasi kata sandi tidak sama.");
      return;
    }
    if (TURNSTILE_ENABLED && !captcha) {
      setErr("Selesaikan verifikasi CAPTCHA terlebih dahulu.");
      return;
    }
    setBusy(true);
    const { error } = await signUp({
      email: f.email.trim(),
      password: f.password,
      role,
      nama: f.nama.trim(),
      nip: f.nip.trim(),
      opd: f.opd,
      captchaToken: captcha,
    });
    setBusy(false);
    if (error) {
      setErr(error.message || "Gagal mendaftar.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="portal-page">
        <div className="portal-wrap">
          <div className="portal-card">
            <div style={{ fontSize: 40, textAlign: "center" }}>📧</div>
            <h1 className="portal-title" style={{ textAlign: "center" }}>Pendaftaran Terkirim</h1>
            <div className="p-alert p-alert-ok" style={{ marginTop: 12 }}>
              <span>✅</span>
              <div>
                Silakan cek email <strong>{f.email}</strong> untuk <strong>verifikasi</strong>.
                Setelah verifikasi, akun Anda menunggu <strong>persetujuan admin</strong> sebelum
                dapat mengajukan SKPP. Anda akan bisa masuk setelah disetujui.
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => nav("/masuk")}>
              Ke Halaman Masuk
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-wrap">
        <div className="portal-card">
          <div className="portal-tag">Portal Pengajuan SKPP</div>
          <h1 className="portal-title">Daftar Akun</h1>
          <p className="portal-sub">
            Daftar sebagai pegawai atau bendahara OPD. Pendaftaran memerlukan verifikasi email dan
            persetujuan admin sebelum dapat mengajukan.
          </p>

          {err && (
            <div className="p-alert p-alert-err">
              <span>⚠️</span>
              <div>{err}</div>
            </div>
          )}

          <div className="field">
            <label>Daftar sebagai</label>
            <div className="p-role">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={role === r.id ? "on" : ""}
                  onClick={() => setRole(r.id)}
                >
                  <div className="rt">{r.rt}</div>
                  <div className="rd">{r.rd}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="p-grid2">
              <div className="field">
                <label>Nama Lengkap</label>
                <input value={f.nama} onChange={(e) => set("nama", e.target.value)} placeholder="Sesuai identitas" />
              </div>
              <div className="field">
                <label>NIP</label>
                <input
                  value={f.nip}
                  onChange={(e) => set("nip", e.target.value)}
                  placeholder="18 digit"
                  style={{ fontFamily: "monospace" }}
                />
              </div>
            </div>
            <div className="field">
              <label>{role === "bendahara" ? "OPD / Instansi (yang Anda tangani)" : "OPD / Instansi"}</label>
              <select value={f.opd} onChange={(e) => set("opd", e.target.value)}>
                <option value="">— Pilih OPD / Instansi —</option>
                {DAFTAR_OPD.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </div>
            <div className="p-grid2">
              <div className="field">
                <label>Kata Sandi</label>
                <input
                  type="password"
                  value={f.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>Ulangi Kata Sandi</label>
                <input
                  type="password"
                  value={f.ulang}
                  onChange={(e) => set("ulang", e.target.value)}
                  placeholder="Ketik ulang"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {TURNSTILE_ENABLED && (
              <div className="field">
                <Turnstile onToken={setCaptcha} />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "⟳ Memproses…" : "Daftar"}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: 13, color: "var(--g500)", textAlign: "center" }}>
            Sudah punya akun?{" "}
            <button className="p-link" onClick={() => nav("/masuk")}>
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
