import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { scrollToId, scrollToLacak } from "../nav.js";

// Navbar bersama semua halaman. Tautan "Prosedur"/"Lacak" menggulir bila di
// beranda; bila di halaman portal, arahkan ke beranda + hash lalu digulir.
export function Navbar({ scrolled }) {
  const { isLoggedIn, isApproved, profile, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const goSection = (id) => {
    if (loc.pathname !== "/") nav("/#" + id);
    else if (id === "lacak") scrollToLacak();
    else scrollToId(id);
  };

  const onLogout = async () => {
    await signOut();
    nav("/");
  };

  return (
    <nav className={"navbar" + (scrolled ? " scrolled" : "")} id="navbar">
      <div className="nav-left" style={{ cursor: "pointer" }} onClick={() => nav("/")}>
        <div className="nav-logo">
          <img src="/logo.png" alt="Logo Badan Keuangan Daerah Provinsi NTT" />
        </div>
        <div className="nav-brand">
          <div className="instansi">Pemerintah Provinsi Nusa Tenggara Timur</div>
          <div className="nama">Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</div>
        </div>
      </div>

      <div className="nav-links">
        <a href="#prosedur" className="nav-a" onClick={(e) => { e.preventDefault(); goSection("prosedur"); }}>
          Prosedur
        </a>
        <a href="#lacak" className="nav-a" onClick={(e) => { e.preventDefault(); goSection("lacak"); }}>
          Lacak
        </a>

        {!isLoggedIn && (
          <div className="nav-auth">
            <button className="nav-ghost" onClick={() => nav("/masuk")}>Masuk</button>
            <a href="/daftar" className="nav-btn" onClick={(e) => { e.preventDefault(); nav("/daftar"); }}>
              Daftar
            </a>
          </div>
        )}

        {isLoggedIn && (
          <div className="nav-auth">
            {profile?.nama && <span className="nav-user">{profile.nama}</span>}
            {isApproved && (
              <a href="/ajukan" className="nav-btn" onClick={(e) => { e.preventDefault(); nav("/ajukan"); }}>
                + Ajukan SKPP
              </a>
            )}
            <button className="nav-ghost" onClick={() => nav("/pengajuan-saya")}>Pengajuan Saya</button>
            <button className="nav-ghost" onClick={onLogout}>Keluar</button>
          </div>
        )}
      </div>
    </nav>
  );
}
