import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { scrollToId, scrollToLacak } from "../nav.js";

function SipastiMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

// Navbar bersama semua halaman. Tautan "Prosedur"/"Lacak" menggulir bila di
// beranda; bila di halaman portal, arahkan ke beranda + hash lalu digulir.
// "Lacak" hanya untuk pengunjung belum login -- setelah login, pelacakan
// dilakukan langsung dari "Pengajuan Saya".
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
    nav("/", { state: { masuk: true } });
  };

  const initials = (profile?.nama || "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav className={"navbar" + (scrolled ? " scrolled" : "")} id="navbar">
      <div className="nav-left" onClick={() => nav("/")}>
        <div className="nav-sipasti">
          <span className="nav-sipasti-ic"><SipastiMark /></span>
          <span className="nav-sipasti-txt">KATONG SKPP</span>
        </div>
        <span className="nav-div" aria-hidden="true" />
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
        {!isLoggedIn && (
          <a href="#lacak" className="nav-a" onClick={(e) => { e.preventDefault(); goSection("lacak"); }}>
            Lacak
          </a>
        )}

        {!isLoggedIn && (
          <div className="nav-auth">
            <button className="nav-ghost" onClick={() => nav("/masuk")}>Masuk</button>
            <a href="/daftar" className="nav-btn" onClick={(e) => { e.preventDefault(); nav("/daftar"); }}>
              Daftar
            </a>
          </div>
        )}

        {isLoggedIn && (
          <>
            <span className="nav-div" aria-hidden="true" />
            <div className="nav-auth">
              {profile?.nama && (
                <div className="nav-who">
                  <span className="nav-av">{initials || "U"}</span>
                  <span className="nav-user">{profile.nama}</span>
                </div>
              )}
              {isApproved && (
                <a href="/ajukan" className="nav-btn" onClick={(e) => { e.preventDefault(); nav("/ajukan"); }}>
                  + Ajukan SKPP
                </a>
              )}
              <button className="nav-ghost" onClick={() => nav("/pengajuan-saya")}>Pengajuan Saya</button>
              <button className="nav-ghost" onClick={onLogout}>Keluar</button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
