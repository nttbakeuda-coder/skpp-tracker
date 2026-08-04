import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import { BackToTop } from "./components/BackToTop.jsx";
import Landing from "./pages/Landing.jsx";
import Ajukan from "./pages/Ajukan.jsx";
import PengajuanSaya from "./pages/PengajuanSaya.jsx";
import Panduan from "./pages/Panduan.jsx";
import Regulasi from "./pages/Regulasi.jsx";
import { ResetSandiModal } from "./components/AuthForms.jsx";

// Lindungi rute yang butuh login; tunggu status sesi termuat dulu. Bila belum
// login, arahkan ke beranda dgn sinyal buka modal Masuk (bukan halaman
// /masuk mandiri yang sudah dihapus) supaya UX seragam saat logout / akses
// rute terproteksi tanpa sesi.
function RequireAuth({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading)
    return (
      <div className="portal-page">
        <div className="portal-wrap">
          <div className="portal-card">Memuat…</div>
        </div>
      </div>
    );
  if (!isLoggedIn) return <Navigate to="/" state={{ masuk: true }} replace />;
  return children;
}

// /masuk & /daftar tidak lagi berupa halaman penuh -- alihkan ke beranda dan
// buka modal terkait. Hash dipertahankan supaya tautan verifikasi email
// Supabase (origin + "/masuk#access_token=...") tetap terproses.
function AlihModal({ mode }) {
  const loc = useLocation();
  return <Navigate to={{ pathname: "/", hash: loc.hash }} state={{ [mode]: true }} replace />;
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
  const hasOwnChrome = isLanding || isAppPage || isAlih;

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
        <Route path="/" element={<Landing />} />
        <Route path="/masuk" element={<AlihModal mode="masuk" />} />
        <Route path="/daftar" element={<AlihModal mode="daftar" />} />
        <Route path="/ajukan" element={<RequireAuth><Ajukan /></RequireAuth>} />
        <Route path="/pengajuan-saya" element={<RequireAuth><PengajuanSaya /></RequireAuth>} />
        <Route path="/panduan" element={<RequireAuth><Panduan /></RequireAuth>} />
        <Route path="/regulasi" element={<RequireAuth><Regulasi /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hasOwnChrome && <Footer />}
      {!hasOwnChrome && <BackToTop show={showBtt} />}
      <ResetSandiModal />
    </>
  );
}
