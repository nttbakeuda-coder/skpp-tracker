import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Turnstile } from "../Turnstile.jsx";
import { TURNSTILE_ENABLED } from "../config.js";

export default function Masuk() {
  const { signIn, isLoggedIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isLoggedIn) nav("/pengajuan-saya", { replace: true });
  }, [isLoggedIn, nav]);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr("Email dan kata sandi wajib diisi.");
      return;
    }
    if (TURNSTILE_ENABLED && !captcha) {
      setErr("Selesaikan verifikasi CAPTCHA terlebih dahulu.");
      return;
    }
    setBusy(true);
    setErr("");
    const { error } = await signIn({ email: email.trim(), password, captchaToken: captcha });
    setBusy(false);
    if (error) {
      const m = error.message || "";
      if (/confirm/i.test(m)) setErr("Email belum diverifikasi. Cek kotak masuk Anda.");
      else if (/invalid/i.test(m)) setErr("Email atau kata sandi salah.");
      else setErr(m || "Gagal masuk.");
      return;
    }
    nav("/pengajuan-saya", { replace: true });
  }

  return (
    <div className="portal-page">
      <div className="portal-wrap">
        <div className="portal-card">
          <div className="portal-tag">Portal Pengajuan SKPP</div>
          <h1 className="portal-title">Masuk Akun</h1>
          <p className="portal-sub">
            Masuk untuk mengajukan SKPP secara daring dan memantau pengajuan Anda.
          </p>

          {err && (
            <div className="p-alert p-alert-err">
              <span>⚠️</span>
              <div>{err}</div>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label>Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {TURNSTILE_ENABLED && (
              <div className="field">
                <Turnstile onToken={setCaptcha} />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? "⟳ Memproses…" : "Masuk"}
            </button>
          </form>

          <p style={{ marginTop: 18, fontSize: 13, color: "var(--g500)", textAlign: "center" }}>
            Belum punya akun?{" "}
            <button className="p-link" onClick={() => nav("/daftar")}>
              Daftar di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
