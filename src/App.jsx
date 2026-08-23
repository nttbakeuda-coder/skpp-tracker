import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import { BackToTop } from "./components/BackToTop.jsx";
import Landing from "./pages/Landing.jsx";
import Ajukan from "./pages/Ajukan.jsx";
import PengajuanSaya from "./pages/PengajuanSaya.jsx";
import Panduan from "./pages/Panduan.jsx";
import Regulasi from "./pages/Regulasi.jsx";
import EmailTerkonfirmasi from "./pages/EmailTerkonfirmasi.jsx";
import { ResetSandiModal } from "./components/AuthForms.jsx";

// Batas waktu sesi tanpa aktivitas (samakan dgn dasbor): setelah IDLE_LIMIT_MINUTES
// idle muncul peringatan; jika tetap tanpa aktivitas selama IDLE_WARNING_SECONDS,
// sesi diakhiri otomatis.
const IDLE_LIMIT_MINUTES = 15;
const IDLE_WARNING_SECONDS = 60;

function Memuat() {
  return (
    <div className="portal-page">
      <div className="portal-wrap">
        <div className="portal-card">Memuat…</div>
      </div>
    </div>
  );
}

// Deteksi murah apakah masih ada sesi tersimpan (localStorage) sebelum getSession
// selesai — dipakai agar beranda publik TIDAK berkedip untuk pengguna yang
// sesinya masih aktif dan akan dialihkan ke area login.
function adaSesiTersimpan() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch {
    /* akses storage bisa gagal (mode privasi) — anggap tak ada sesi */
  }
  return false;
}

// Lindungi rute yang butuh login; tunggu status sesi termuat dulu. Bila belum
// login, arahkan ke beranda dgn sinyal buka modal Masuk (bukan halaman
// /masuk mandiri yang sudah dihapus) supaya UX seragam saat logout / akses
// rute terproteksi tanpa sesi.
function RequireAuth({ children }) {
  const { isLoggedIn, isApproved, loading } = useAuth();
  if (loading) return <Memuat />;
  if (!isLoggedIn) return <Navigate to="/" state={{ masuk: true }} replace />;
  // Akun belum disetujui tidak boleh masuk area pemilik -> kembali ke beranda.
  if (!isApproved) return <Navigate to="/" replace />;
  return children;
}

// Beranda ("/"): untuk PENGUNJUNG publik tampilkan Landing. Untuk pengguna yang
// SUDAH login & disetujui, jangan tampilkan beranda publik — langsung alihkan
// ke area login (Pengajuan Saya). Jadi menutup lalu membuka kembali tab saat
// masih login akan membuka halaman di dalam login, bukan beranda pemasaran.
// Pengecualian: proses pemulihan sandi / token verifikasi di hash / intent modal.
function Beranda() {
  const { isLoggedIn, isApproved, loading, recovery } = useAuth();
  const loc = useLocation();
  const adaAuthHash = /access_token|type=recovery|error=/.test(loc.hash || "");
  const adaIntent = !!(loc.state?.masuk || loc.state?.daftar);

  if (loading) {
    // Sesi masih tersimpan & bukan alur auth khusus -> tahan dgn loader supaya
    // beranda publik tak berkedip sebelum dialihkan.
    return adaSesiTersimpan() && !adaAuthHash && !adaIntent ? <Memuat /> : <Landing />;
  }
  if (isLoggedIn && isApproved && !recovery && !adaAuthHash && !adaIntent)
    return <Navigate to="/pengajuan-saya" replace />;
  return <Landing />;
}

// /masuk & /daftar tidak lagi berupa halaman penuh -- alihkan ke beranda dan
// buka modal terkait. Hash dipertahankan supaya tautan verifikasi email
// Supabase (origin + "/masuk#access_token=...") tetap terproses.
function AlihModal({ mode }) {
  const loc = useLocation();
  return <Navigate to={{ pathname: "/", hash: loc.hash }} state={{ [mode]: true }} replace />;
}

// Akhiri sesi otomatis setelah tidak ada aktivitas. Aktif hanya saat login.
// Memakai selisih waktu nyata (timestamp) agar akurat walau tab di-background.
function IdleTimeout() {
  const { isLoggedIn, signOut } = useAuth();
  const nav = useNavigate();
  const [warn, setWarn] = useState(false);
  const [countdown, setCountdown] = useState(IDLE_WARNING_SECONDS);
  const resetRef = useRef(() => {});

  const keluar = () => {
    setWarn(false);
    signOut().catch(() => {});
    // Ke beranda + minta Landing membuka modal Masuk (seragam dgn tombol Keluar).
    nav("/", { state: { masuk: true } });
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const IDLE_MS = IDLE_LIMIT_MINUTES * 60 * 1000;
    const WARN_MS = IDLE_WARNING_SECONDS * 1000;
    let lastAct = Date.now();
    let warning = false; // true saat popup peringatan sedang tampil
    let ticker = null;

    const endSession = () => {
      if (ticker) clearInterval(ticker);
      setWarn(false);
      signOut().catch(() => {});
      nav("/", { state: { masuk: true } });
    };

    // Dipanggil tombol "Tetap Masuk": mulai ulang hitungan dari sekarang.
    const reset = () => {
      lastAct = Date.now();
      warning = false;
      setWarn(false);
      setCountdown(IDLE_WARNING_SECONDS);
    };
    resetRef.current = reset;

    const tick = () => {
      const idleFor = Date.now() - lastAct;
      if (idleFor >= IDLE_MS + WARN_MS) { endSession(); return; }
      if (idleFor >= IDLE_MS) {
        warning = true;
        setWarn(true);
        setCountdown(Math.max(1, Math.ceil((IDLE_MS + WARN_MS - idleFor) / 1000)));
      }
    };

    // Aktivitas hanya menunda peringatan SEBELUM muncul. Saat peringatan sudah
    // tampil, aktivitas diabaikan — hilang hanya lewat tombol.
    const onActivity = () => { if (!warning) lastAct = Date.now(); };
    const onVisible = () => { if (!document.hidden) tick(); };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    ticker = setInterval(tick, 1000);
    return () => {
      if (ticker) clearInterval(ticker);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (!warn) return null;
  const btn = {
    border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 12000, background: "rgba(0,20,50,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, maxWidth: 400, width: "100%",
        boxShadow: "0 24px 60px rgba(0,35,82,0.35)", overflow: "hidden",
      }}>
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "14px 22px", fontWeight: 800, fontSize: 14, color: "#92400e" }}>
          Sesi Akan Berakhir
        </div>
        <div style={{ padding: 22, fontSize: 13, lineHeight: 1.6, color: "#1f2937", textAlign: "center" }}>
          Anda tidak aktif selama beberapa waktu. Demi keamanan, sesi akan berakhir otomatis dalam:
          <div style={{ margin: "14px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 40, fontWeight: 800, color: countdown <= 10 ? "#dc2626" : "var(--navy, #002352)" }}>
            {countdown}<span style={{ fontSize: 16, fontWeight: 500, marginLeft: 6 }}>detik</span>
          </div>
          Klik <strong>Tetap Masuk</strong> untuk melanjutkan, atau biarkan untuk keluar.
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 22px 22px", justifyContent: "center" }}>
          <button type="button" onClick={keluar} style={{ ...btn, background: "#eef1f6", color: "#334155" }}>Keluar Sekarang</button>
          <button type="button" onClick={() => resetRef.current()} style={{ ...btn, background: "var(--navy, #002352)", color: "#fff" }}>Tetap Masuk</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [showBtt, setShowBtt] = useState(false);
  const loc = useLocation();
  // Beranda ("/") punya header & footer sendiri (desain layar-penuh). Halaman
  // aplikasi (butuh login) punya AppHeader sendiri (sticky navy + avatar).
  // Navbar publik/Footer/BackToTop global hanya dipakai Masuk & Daftar.
  const isLanding = loc.pathname === "/";
  const APP_PATHS = ["/ajukan", "/pengajuan-saya", "/panduan", "/regulasi"];
  const isAppPage = APP_PATHS.includes(loc.pathname);
  // /masuk & /daftar hanya mengalihkan ke beranda -- jangan tampilkan Navbar/
  // Footer sekilas supaya tak ada kedipan.
  const isAlih = loc.pathname === "/masuk" || loc.pathname === "/daftar";
  const isKonfirmasi = loc.pathname === "/email-terkonfirmasi";
  const hasOwnChrome = isLanding || isAppPage || isAlih || isKonfirmasi;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowBtt(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {!hasOwnChrome && <Navbar scrolled={scrolled} />}
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/masuk" element={<AlihModal mode="masuk" />} />
        <Route path="/daftar" element={<AlihModal mode="daftar" />} />
        <Route path="/ajukan" element={<RequireAuth><Ajukan /></RequireAuth>} />
        <Route path="/pengajuan-saya" element={<RequireAuth><PengajuanSaya /></RequireAuth>} />
        <Route path="/panduan" element={<RequireAuth><Panduan /></RequireAuth>} />
        <Route path="/regulasi" element={<RequireAuth><Regulasi /></RequireAuth>} />
        <Route path="/email-terkonfirmasi" element={<EmailTerkonfirmasi />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hasOwnChrome && <Footer />}
      {!hasOwnChrome && <BackToTop show={showBtt} />}
      <ResetSandiModal />
      <IdleTimeout />
    </>
  );
}
