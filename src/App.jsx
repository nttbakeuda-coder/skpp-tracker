import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Footer } from "./components/Footer.jsx";
import { BackToTop } from "./components/BackToTop.jsx";
import Landing from "./pages/Landing.jsx";
import Masuk from "./pages/Masuk.jsx";
import Daftar from "./pages/Daftar.jsx";
import Ajukan from "./pages/Ajukan.jsx";
import PengajuanSaya from "./pages/PengajuanSaya.jsx";

// Lindungi rute yang butuh login; tunggu status sesi termuat dulu.
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
  if (!isLoggedIn) return <Navigate to="/masuk" replace />;
  return children;
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [showBtt, setShowBtt] = useState(false);

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
      <Navbar scrolled={scrolled} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/ajukan" element={<RequireAuth><Ajukan /></RequireAuth>} />
        <Route path="/pengajuan-saya" element={<RequireAuth><PengajuanSaya /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <BackToTop show={showBtt} />
    </>
  );
}
