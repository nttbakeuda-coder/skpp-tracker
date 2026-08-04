import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Turnstile } from "../Turnstile.jsx";
import { TURNSTILE_ENABLED } from "../config.js";
import { DAFTAR_OPD } from "../refdata.js";
import { SearchableSelect } from "./SearchableSelect.jsx";
import { PasswordField } from "./PasswordField.jsx";
import { PasswordStrength } from "./PasswordStrength.jsx";
import { IcoPerson, IcoBuilding, IcoMail, IcoCheckCircle, IcoAlertTriangle } from "./Icons.jsx";

// Form Masuk & Daftar -- diekstrak dari halaman /masuk & /daftar supaya bisa
// dipakai ULANG APA ADANYA (logika, validasi, CAPTCHA sama persis) baik pada
// halaman penuh maupun panel modal di beranda. Jangan duplikasi logika di
// tempat lain -- kalau butuh tampilan berbeda, ubah pembungkus, bukan ini.

export function MasukForm({ onSuccess, onSwitchToDaftar }) {
  const { signIn, resetSandiEmail } = useAuth();
  const [lupa, setLupa] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [verified] = useState(
    () => typeof window !== "undefined" && /(?:type=signup|access_token)/.test(window.location.hash)
  );

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
    onSuccess();
  }

  if (lupa) return <LupaSandiForm onBack={() => setLupa(false)} resetSandiEmail={resetSandiEmail} />;

  return (
    <>
      <div className="portal-tag">Portal Pengajuan SKPP</div>
      <h1 className="portal-title">Masuk ke Akun Anda</h1>
      <p className="portal-sub">
        Selamat datang kembali. Pantau setiap tahap penerbitan SKPP secara terintegrasi dan transparan.
      </p>
      {verified && !err && (
        <div className="p-alert p-alert-ok">
          <IcoCheckCircle size={16} />
          <div>Email terverifikasi. Silakan masuk. Akun menunggu persetujuan admin sebelum dapat mengajukan.</div>
        </div>
      )}
      {err && (
        <div className="p-alert p-alert-err">
          <IcoAlertTriangle size={16} />
          <div>{err}</div>
        </div>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" />
        </div>
        <PasswordField label="Kata Sandi" value={password} onChange={setPassword} autoComplete="current-password" />
        <div style={{ textAlign: "right", margin: "-4px 0 10px" }}>
          <button type="button" className="p-link" style={{ fontSize: 12.5 }} onClick={() => { setErr(""); setLupa(true); }}>Lupa kata sandi?</button>
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
        <button type="button" className="p-link" onClick={onSwitchToDaftar}>
          Daftar di sini
        </button>
      </p>
    </>
  );
}

// Sub-tampilan "Lupa Kata Sandi" di dalam modal Masuk: kirim email berisi
// tautan reset. Tampil menggantikan form Masuk saat tautan "Lupa kata sandi?"
// diklik, dan bisa kembali lewat tombol "Kembali ke Masuk".
function LupaSandiForm({ onBack, resetSandiEmail }) {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) { setErr("Email wajib diisi."); return; }
    if (TURNSTILE_ENABLED && !captcha) { setErr("Selesaikan verifikasi CAPTCHA terlebih dahulu."); return; }
    setBusy(true); setErr("");
    const { error } = await resetSandiEmail(email.trim(), captcha);
    setBusy(false);
    if (error) { setErr(error.message || "Gagal mengirim tautan reset."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <div className="portal-tag">Portal Pengajuan SKPP</div>
        <h1 className="portal-title">Tautan Terkirim</h1>
        <div className="p-alert p-alert-ok" style={{ marginTop: 4 }}>
          <IcoCheckCircle size={16} />
          <div>Tautan pengaturan ulang kata sandi telah dikirim ke <strong>{email.trim()}</strong>. Buka email tersebut (periksa juga folder Spam), lalu ikuti tautannya untuk menyetel kata sandi baru.</div>
        </div>
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={onBack}>Kembali ke Masuk</button>
      </>
    );
  }

  return (
    <>
      <div className="portal-tag">Portal Pengajuan SKPP</div>
      <h1 className="portal-title">Lupa Kata Sandi</h1>
      <p className="portal-sub">Masukkan email akun Anda. Kami akan mengirimkan tautan untuk menyetel kata sandi baru.</p>
      {err && (
        <div className="p-alert p-alert-err">
          <IcoAlertTriangle size={16} />
          <div>{err}</div>
        </div>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" />
        </div>
        {TURNSTILE_ENABLED && (
          <div className="field">
            <Turnstile onToken={setCaptcha} />
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "⟳ Mengirim…" : "Kirim Tautan Reset"}
        </button>
      </form>
      <p style={{ marginTop: 18, fontSize: 13, color: "var(--g500)", textAlign: "center" }}>
        <button type="button" className="p-link" onClick={onBack}>← Kembali ke Masuk</button>
      </p>
    </>
  );
}

// Modal global "Setel Kata Sandi Baru" — muncul saat pengguna membuka tautan
// reset dari email (event PASSWORD_RECOVERY). Dipasang di root (App) sehingga
// tampil di halaman mana pun. Setelah sukses: sesi dibersihkan & diarahkan ke
// beranda dgn modal Masuk terbuka untuk login memakai sandi baru.
export function ResetSandiModal() {
  const { recovery, updateSandi, clearRecovery, signOut } = useAuth();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!recovery) return null;

  async function submit(e) {
    e.preventDefault();
    if (pw.length < 6 || !/[A-Z]/.test(pw)) { setErr("Kata sandi minimal 6 karakter & mengandung 1 huruf kapital."); return; }
    if (pw !== pw2) { setErr("Konfirmasi kata sandi tidak cocok."); return; }
    setBusy(true); setErr("");
    const { error } = await updateSandi(pw);
    if (error) { setBusy(false); setErr(error.message || "Gagal memperbarui kata sandi."); return; }
    clearRecovery();
    await signOut();
    setBusy(false);
    nav({ pathname: "/", hash: "" }, { replace: true, state: { masuk: true } });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,16,38,0.66)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="portal-card" style={{ maxWidth: 420, width: "100%" }}>
        <div className="portal-tag">Portal Pengajuan SKPP</div>
        <h1 className="portal-title">Setel Kata Sandi Baru</h1>
        <p className="portal-sub">Masukkan kata sandi baru untuk akun Anda.</p>
        {err && (
          <div className="p-alert p-alert-err">
            <IcoAlertTriangle size={16} />
            <div>{err}</div>
          </div>
        )}
        <form onSubmit={submit}>
          <PasswordField label="Kata Sandi Baru" value={pw} onChange={setPw} autoComplete="new-password" />
          <PasswordField label="Konfirmasi Kata Sandi" value={pw2} onChange={setPw2} autoComplete="new-password" />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "⟳ Menyimpan…" : "Simpan Kata Sandi"}
          </button>
        </form>
      </div>
    </div>
  );
}

const ROLES = [
  { id: "pemohon", ic: IcoPerson, rt: "Pegawai (Perorangan)", rd: "Mengajukan SKPP milik sendiri" },
  { id: "bendahara", ic: IcoBuilding, rt: "Bendahara OPD", rd: "Mengajukan untuk banyak pegawai (bulk)" },
];

export function DaftarForm({ onSwitchToMasuk }) {
  const { signUp } = useAuth();
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
      email: f.email.trim(), password: f.password, role,
      nama: f.nama.trim(), nip: f.nip.trim(), opd: f.opd, captchaToken: captcha,
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
      <>
        <div style={{ display: "flex", justifyContent: "center", color: "var(--teal)" }}><IcoMail size={40} /></div>
        <h1 className="portal-title" style={{ textAlign: "center", marginTop: 12 }}>Pendaftaran Terkirim</h1>
        <div className="p-alert p-alert-ok" style={{ marginTop: 12 }}>
          <IcoCheckCircle size={16} />
          <div>
            Silakan cek email <strong>{f.email}</strong> untuk <strong>verifikasi</strong>. Setelah
            verifikasi, akun Anda menunggu <strong>persetujuan admin</strong> sebelum dapat mengajukan
            SKPP. Anda akan bisa masuk setelah disetujui.
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={onSwitchToMasuk}>
          Ke Halaman Masuk
        </button>
      </>
    );
  }

  return (
    <>
      <div className="portal-tag">Portal Pengajuan SKPP</div>
      <h1 className="portal-title">Daftar Akun</h1>
      <p className="portal-sub">
        Daftar sebagai pegawai atau bendahara OPD. Pendaftaran memerlukan verifikasi email dan
        persetujuan admin sebelum dapat mengajukan.
      </p>
      {err && (
        <div className="p-alert p-alert-err">
          <IcoAlertTriangle size={16} />
          <div>{err}</div>
        </div>
      )}
      <div className="field">
        <label>Daftar sebagai</label>
        <div className="p-role">
          {ROLES.map((r) => (
            <button key={r.id} type="button" className={role === r.id ? "on" : ""} onClick={() => setRole(r.id)}>
              <div className="rt"><r.ic size={18} />{r.rt}</div>
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
            <input value={f.nip} onChange={(e) => set("nip", e.target.value)} placeholder="18 digit" style={{ fontFamily: "monospace" }} />
          </div>
        </div>
        <SearchableSelect
          label={role === "bendahara" ? "OPD / Instansi (yang Anda tangani)" : "OPD / Instansi"}
          value={f.opd} onChange={(v) => set("opd", v)} options={DAFTAR_OPD} placeholder="— Pilih OPD / Instansi —"
        />
        <div className="field">
          <label>Email</label>
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@email.com" autoComplete="email" />
        </div>
        <div className="p-grid2">
          <PasswordField label="Kata Sandi" value={f.password} onChange={(v) => set("password", v)} placeholder="Min. 8 karakter" autoComplete="new-password">
            <PasswordStrength value={f.password} />
          </PasswordField>
          <PasswordField label="Ulangi Kata Sandi" value={f.ulang} onChange={(v) => set("ulang", v)} placeholder="Ketik ulang" autoComplete="new-password" />
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
        <button type="button" className="p-link" onClick={onSwitchToMasuk}>
          Masuk di sini
        </button>
      </p>
    </>
  );
}
