import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { lacak, fetchStatistik } from "../lacak.js";
import { STAT_FALLBACK } from "../data.jsx";
import { DP_DOKUMEN_GRUP } from "../refdata.js";
import { REGULASI, DOC_SLIDE_META, PANDUAN_PERAN } from "../kontenLanding.js";
import { ResultCard } from "../components/ResultCard.jsx";
import { MasukForm, DaftarForm } from "../components/AuthForms.jsx";
import { RegulasiDetail } from "../components/RegulasiDetail.jsx";
import { SurveiSKM } from "../components/SurveiSKM.jsx";
import { bukaPdf } from "../pdfStatik.js";
import { IcoAlertTriangle, IcoX, IcoChevronDown, IcoShield, IcoCheckCircle, IcoClock, IcoPhone, IcoFacebook, IcoInstagram, IcoTiktok, IcoYoutube } from "../components/Icons.jsx";
import "../landing.css";

// Seluruh halaman dirender pada zoom global 80% (html{zoom:.8}). Satuan vw/vh
// tidak ikut menyusut oleh zoom, jadi setiap nilai vw/vh dibagi 0.8 (lihat
// contentShift & landing.css).

const BRAND_BULLETS = [
  { ic: IcoShield, t: "Data kepegawaian Anda terlindungi" },
  { ic: IcoCheckCircle, t: "Setiap tahap tercatat dan dapat dilacak" },
  { ic: IcoClock, t: "Rata-rata proses 3 hari kerja" },
];

// Latar hero (carousel) + nama tempat -- muncul saat titik indikator dihover.
const HEROES = [
  { src: "/hero1.jpg", nama: "Pulau Padar, Labuan Bajo" },
  { src: "/hero2.jpg", nama: "Desa Adat Wae Rebo, Manggarai" },
  { src: "/hero3.jpg", nama: "Nihi Sumba, Sumba Barat" },
];

const NAV_LABELS = ["Beranda", "Alur & Prosedur", "Lacak", "Panduan", "Regulasi", "Kontak"];

const ALUR = [
  { no: "01", t: "Pengajuan daring", d: "Bendahara OPD atau pegawai yang bersangkutan mengajukan permohonan SKPP dan mengunggah dokumen persyaratan secara daring." },
  { no: "02", t: "Verifikasi berkas", d: "Staf Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT memeriksa kelengkapan dan keabsahan dokumen secara berjenjang." },
  { no: "03", t: "Penerbitan SKPP", d: "Setelah seluruh verifikasi disetujui, SKPP diterbitkan dan ditandatangani oleh pejabat yang berwenang." },
  { no: "04", t: "Notifikasi & unduh", d: "Status terbit tercatat otomatis pada portal; dokumen SKPP dapat diambil di Loket Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT." },
];

const HASH_PAGE = { prosedur: 1, alur: 1, lacak: 2, panduan: 3, regulasi: 4, kontak: 5 };

export default function Landing() {
  const { isLoggedIn, isApproved, isRejected, profilGagal, profile, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [page, setPage] = useState(() => HASH_PAGE[loc.hash.slice(1)] ?? 0);
  const [docSlide, setDocSlide] = useState(0);

  // Modal Masuk / Daftar (panel kiri). Saat terbuka, logo KATONG SKPP di header
  // "terbang" (morph) ke sebelah H1, dan wordmark "KATONG SKPP" bergeser ke kanan
  // memberi ruang. ANTI-JITTER TOTAL: yang beranimasi HANYA transform (logo &
  // wordmark) -- tidak ada perubahan font-size / lebar / margin (reflow), tidak
  // ada pemusatan-ulang. Ukuran H1 TETAP. Transform dihitung sinkron di
  // useLayoutEffect lalu ditulis langsung ke DOM dengan forced-reflow, supaya
  // transisi selalu mulai dari posisi identitas (tanpa lag 1-frame rAF).
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("masuk");
  const [menuOpen, setMenuOpen] = useState(false); // menu hamburger (mobile)
  const [heroIdx, setHeroIdx] = useState(0);   // indeks latar hero aktif (carousel)
  const logoRef = useRef(null);   // <img> logo di header (yang terbang)
  const wordRef = useRef(null);   // <span> "KATONG SKPP" di H1 (yang bergeser)
  const h1Ref = useRef(null);     // <h1> untuk ukur tinggi -> skala logo target

  // Panel pelacakan
  const [trackOpen, setTrackOpen] = useState(false);
  const [nomor, setNomor] = useState("");
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [surveiOpen, setSurveiOpen] = useState(false);
  const nomorRef = useRef(null);
  const kodeRef = useRef(null);

  // Panel regulasi
  const [regOpen, setRegOpen] = useState(false);
  const [regIdx, setRegIdx] = useState(0);
  const [regTab, setRegTab] = useState(0);

  // Statistik beranda
  const [stats, setStats] = useState({ total: null, terbit: null, hari: "≤ 3" });

  useEffect(() => {
    fetchStatistik().then((s) => {
      if (s) setStats({ total: s.total, terbit: s.terbit, hari: typeof s.rataHari === "number" ? (s.rataHari < 1 ? "< 1" : String(s.rataHari)) : "≤ 3" });
    });
  }, []);

  // Carousel hero: berpindah otomatis (crossfade) tiap 8 dtk; berhenti saat
  // ada panel/modal terbuka supaya latar tidak berubah-ubah ketika fokus mengisi.
  useEffect(() => {
    if (modalOpen || trackOpen || regOpen) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % HEROES.length), 15000);
    return () => clearInterval(id);
  }, [modalOpen, trackOpen, regOpen]);

  function go(i) {
    setPage(i);
    setTrackOpen(false);
    setRegOpen(false);
    setModalOpen(false);
    setMenuOpen(false);
  }

  function openModal(mode) {
    setModalMode(mode);
    setModalOpen(true);
    setTrackOpen(false);
    setRegOpen(false);
    setMenuOpen(false);
    setPage(0); // tujuan morph ada di H1 Beranda -- pastikan halamannya aktif
  }
  const closeModal = () => setModalOpen(false);
  const closeAll = () => { setModalOpen(false); setTrackOpen(false); setRegOpen(false); };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeAll();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hitung & terapkan morph secara SINKRON sebelum paint. Posisi diukur lewat
  // offsetLeft/Top (bukan getBoundingClientRect) supaya tidak terpengaruh
  // transform contentShift yang sedang beranimasi. Transform ditulis langsung
  // ke elemen dgn forced-reflow (void offsetWidth) di antara reset->target
  // supaya transisi CSS selalu berjalan dari identitas -> tanpa loncatan.
  useLayoutEffect(() => {
    const logo = logoRef.current, word = wordRef.current, h1 = h1Ref.current;
    if (!logo || !word || !h1) return;

    if (!modalOpen) {
      // Kembali ke posisi semula (dianimasikan oleh transisi CSS).
      logo.style.transform = "";
      word.style.transform = "";
      return;
    }

    const off = (el) => {
      let x = 0, y = 0;
      while (el) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      return { x, y };
    };
    const lp = off(logo), wp = off(word);
    const logoW = logo.offsetWidth, logoH = logo.offsetHeight;
    const targetH = Math.min(h1.offsetHeight * 0.74, 96); // tinggi logo di sebelah wordmark
    const scale = targetH / logoH;
    const targetW = logoW * scale;
    const gap = 24;
    const shift = targetW + gap; // geseran wordmark ke kanan (beri ruang logo)

    // Logo mendarat di [wp.x, wp.x+targetW], pusat vertikal = pusat wordmark.
    const dx = (wp.x + targetW / 2) - (lp.x + logoW / 2);
    const dy = (wp.y + word.offsetHeight / 2) - (lp.y + logoH / 2);
    const targetLogo = `translate(${dx}px, ${dy}px) scale(${scale})`;
    const targetWord = `translateX(${shift}px)`;

    // Reset ke identitas tanpa transisi -> forced reflow -> pasang target
    // dgn transisi aktif kembali, agar animasi dijamin mulai dari identitas.
    logo.style.transition = "none"; logo.style.transform = "none";
    word.style.transition = "none"; word.style.transform = "none";
    void logo.offsetWidth; // flush layout
    logo.style.transition = ""; word.style.transition = "";
    logo.style.transform = targetLogo;
    word.style.transform = targetWord;
  }, [modalOpen]);

  // Logout / akses rute terproteksi / klik Masuk|Daftar mengarahkan ke "/"
  // dgn state {masuk:true} atau {daftar:true} -- buka modal terkait otomatis
  // (hanya bila belum login). Penyesuaian dilakukan SAAT RENDER (bukan di
  // efek, menghindari set-state-in-effect), dipagari state-guard agar sekali
  // jalan; efek di bawah hanya membersihkan state router (navigasi, bukan
  // setState).
  const [authModalHandled, setAuthModalHandled] = useState(false);
  const mintaModal = loc.state?.masuk ? "masuk" : loc.state?.daftar ? "daftar" : null;
  if (mintaModal && !authModalHandled) {
    setAuthModalHandled(true);
    if (!isLoggedIn) {
      setModalMode(mintaModal);
      setModalOpen(true);
      setTrackOpen(false);
      setRegOpen(false);
      setPage(0);
    }
  }
  useEffect(() => {
    if (loc.state?.masuk || loc.state?.daftar) {
      nav({ pathname: "/", hash: loc.hash }, { replace: true, state: null });
    }
  }, [loc.state, loc.hash, nav]);

  async function doTrack() {
    if (!nomor.trim()) { nomorRef.current?.focus(); return; }
    if (!kode.trim()) { kodeRef.current?.focus(); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const p = await lacak(nomor.trim(), kode.trim());
      if (p) { setResult(p); setTrackOpen(true); setModalOpen(false); }
      else setError("Nomor pengajuan/NIP atau kode akses tidak valid. Periksa kembali tanda terima Anda.");
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda dan coba kembali.");
    }
    setLoading(false);
  }
  const onEnter = (e) => e.key === "Enter" && doTrack();

  function bukaRegulasi(i) {
    setRegIdx(i);
    setRegTab(0);
    setRegOpen(true);
    setTrackOpen(false);
    setModalOpen(false);
  }

  const initials = (profile?.nama || "").split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const rd = REGULASI[regIdx];
  const anyPanelOpen = modalOpen || trackOpen || regOpen;
  // Nilai vw prototipe (44/36/32vw) dibagi zoom 0.8 (satuan vw tak ikut zoom).
  const contentShift = modalOpen
    ? "translateX(min(440px, calc(44vw / 0.8)))"
    : trackOpen
    ? "translateX(calc(-1 * min(360px, 45vw)))"
    : regOpen
    ? "translateX(calc(-1 * min(320px, calc(32vw / 0.8))))"
    : "none";

  return (
    <div className="lp">
      <div className="lp-stage">
        <div className="lp-bg">
          {HEROES.map((h, i) => (
            <img key={h.src} src={h.src} alt="" className={i === heroIdx ? "on" : ""} />
          ))}
          <div className="scrim1" />
          <div className="scrim2" />
        </div>

        <div className="lp-frame" style={{ transform: contentShift, transition: "transform 420ms cubic-bezier(0.2,0,0,1)" }}>
          {/* Header */}
          <header className="lp-head">
            <div className="lp-brand" onClick={() => go(0)}>
              <img src="/logo.png" alt="Lambang Provinsi NTT" />
              <div className="lp-brand-div" />
              <span className="lp-logo-slot" style={{ width: modalOpen ? 0 : undefined }}>
                <img ref={logoRef} src="/logo-sipasti-white.png" alt="KATONG SKPP" className="lp-logo-morph" />
              </span>
              {modalOpen && (
                <div className="lp-brand-inst">
                  <div className="l1">Pemerintah Provinsi Nusa Tenggara Timur</div>
                  <div className="l2">Badan Keuangan Daerah</div>
                </div>
              )}
            </div>
            <nav className="lp-nav" style={{ opacity: anyPanelOpen ? 0 : 1, pointerEvents: anyPanelOpen ? "none" : "auto", transition: "opacity 420ms cubic-bezier(0.2,0,0,1)" }}>
              {NAV_LABELS.map((label, i) => (
                <a key={label} className={page === i ? "on" : ""} onClick={() => go(i)}>{label}</a>
              ))}
            </nav>
            <div className="lp-auth" style={{ opacity: anyPanelOpen ? 0 : 1, pointerEvents: anyPanelOpen ? "none" : "auto", transition: "opacity 420ms cubic-bezier(0.2,0,0,1)" }}>
              {isLoggedIn ? (
                <>
                  {profile?.nama && (
                    <div className="lp-who">
                      <span className="lp-who-av">{initials || "U"}</span>
                      <span className="lp-who-name">{profile.nama}</span>
                    </div>
                  )}
                  {isApproved ? (
                    <>
                      <button type="button" className="lp-btn lp-btn-gold lp-btn-sm" onClick={() => nav("/ajukan")}>+ Ajukan SKPP</button>
                      <button type="button" className="lp-auth-ghost" onClick={() => nav("/pengajuan-saya")}>Pengajuan Saya</button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", padding: "6px 13px", borderRadius: 999, ...(isRejected ? { color: "#fca5a5", background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.4)" } : { color: "#fcd34d", background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.4)" }) }}>
                      {isRejected ? "Pendaftaran Ditolak" : profilGagal ? "Profil Tidak Terbaca" : "Menunggu Persetujuan"}
                    </span>
                  )}
                  <button type="button" className="lp-auth-ghost" onClick={async () => { await signOut(); openModal("masuk"); }}>Keluar</button>
                </>
              ) : (
                <>
                  <button type="button" className="lp-auth-ghost" onClick={() => openModal("daftar")}>Daftar</button>
                  <button type="button" className="lp-btn lp-btn-gold lp-btn-sm" onClick={() => openModal("masuk")}>Masuk</button>
                </>
              )}
            </div>
            <button type="button" className="lp-burger" aria-label="Menu navigasi"
              style={{ opacity: anyPanelOpen ? 0 : 1, pointerEvents: anyPanelOpen ? "none" : "auto" }}
              onClick={() => setMenuOpen((v) => !v)}>
              <span /><span /><span />
            </button>
            {menuOpen && !anyPanelOpen && (
              <div className="lp-mobile-menu">
                {NAV_LABELS.map((label, i) => (
                  <button key={label} type="button" className={page === i ? "on" : ""} onClick={() => go(i)}>{label}</button>
                ))}
              </div>
            )}
          </header>

          {/* Konten halaman */}
          <main className="lp-main">
            {page === 0 && (
              // Nonaktifkan animasi masuk (lpPageIn) bila Beranda dimount saat
              // modal sudah terbuka (dibuka dari halaman lain) -> target morph
              // tak ikut bergerak naik.
              <div className="lp-screen" key="beranda" style={{ animation: modalOpen ? "none" : undefined }}>
                <div className="lp-eyebrow" style={{ opacity: anyPanelOpen ? 0 : 1, transition: "opacity 420ms cubic-bezier(0.2,0,0,1)" }}>
                  <span className="bar" /><span>Portal Resmi · Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</span>
                </div>
                <h1 ref={h1Ref} className="lp-h1">
                  <span ref={wordRef} className="lp-h1-word">KATONG <b>SKPP</b></span>
                </h1>
                <p className="lp-tagline">
                  Kanal Administrasi Telusur Online dan Pengajuan SKPP
                </p>
                {/* Kedua state (normal vs "Melayani dengan Pasti") menempati SEL
                    grid yang sama -> tinggi tetap = maksimum keduanya, sehingga
                    membuka modal tidak mengubah tinggi konten & tak memicu
                    pemusatan-ulang vertikal (sumber utama geseran/jitter). */}
                <div className="lp-beranda-stack">
                  <div className="lp-beranda-cell" style={{ opacity: modalOpen ? 0 : 1, pointerEvents: modalOpen ? "none" : "auto" }}>
                    <p className="lp-lede">
                      Selamat datang. Ajukan, pantau, dan kelola penerbitan Surat Keterangan Penghentian
                      Pembayaran (SKPP) secara terintegrasi dan transparan — dari pengajuan oleh Bendahara
                      OPD hingga SKPP terbit dan siap diunduh.
                    </p>
                    <div className="lp-cta-row">
                      {isLoggedIn ? (
                        isApproved ? (
                          <button type="button" className="lp-btn lp-btn-gold lp-btn-lg" onClick={() => nav("/ajukan")}>Ajukan SKPP</button>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", maxWidth: 460, lineHeight: 1.5, fontSize: 14, padding: "13px 18px", borderRadius: 12, ...(isRejected ? { color: "#fecaca", background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.35)" } : { color: "#fde68a", background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.35)" }) }}>
                            {isRejected
                              ? "Pendaftaran akun Anda tidak disetujui. Silakan hubungi Bidang Perbendaharaan."
                              : profilGagal
                              ? "Profil akun Anda tidak dapat dibaca, sehingga status akun belum diketahui. Coba muat ulang halaman; bila tetap muncul, hubungi Bidang Perbendaharaan."
                              : "Akun Anda menunggu persetujuan Administrator. Anda dapat mengajukan SKPP setelah akun disetujui."}
                          </div>
                        )
                      ) : (
                        <>
                          <button type="button" className="lp-btn lp-btn-gold lp-btn-lg" onClick={() => openModal("masuk")}>Masuk ke Aplikasi</button>
                          <button type="button" className="lp-auth-ghost" style={{ height: 48, padding: "0 26px", fontSize: 15 }} onClick={() => openModal("daftar")}>Daftar Akun</button>
                        </>
                      )}
                      <button type="button" className="lp-cta-link" onClick={() => go(1)}>
                        <span className="lp-cta-ring"><IcoChevronDown size={15} style={{ transform: "rotate(-90deg)" }} /></span>
                        Lihat alur pengajuan
                      </button>
                    </div>
                    <div className="lp-stats">
                      <div className="lp-stat"><div className="lp-stat-n">{(stats.total ?? STAT_FALLBACK.total).toLocaleString("id-ID")}</div><div className="lp-stat-l">Total pengajuan SKPP</div></div>
                      <div className="lp-stat"><div className="lp-stat-n">{(stats.terbit ?? STAT_FALLBACK.terbit).toLocaleString("id-ID")}</div><div className="lp-stat-l">SKPP telah diterbitkan</div></div>
                      <div className="lp-stat"><div className="lp-stat-n">{stats.hari}</div><div className="lp-stat-l">Hari kerja rata-rata proses</div></div>
                      <div className="lp-stat"><div className="lp-stat-n">24/7</div><div className="lp-stat-l">Akses pengajuan &amp; pelacakan daring</div></div>
                    </div>
                  </div>
                  <div className="lp-beranda-cell" style={{ opacity: modalOpen ? 1 : 0, pointerEvents: "none" }} aria-hidden={!modalOpen}>
                    <p className="lp-slogan" style={{ marginTop: 20, marginBottom: 4 }}>Urus SKPP? Biar KATONG yang bantu kasih mudah!</p>
                    <div className="lp-brand-bullets">
                      {BRAND_BULLETS.map((b) => (
                        <div className="lp-brand-bullet" key={b.t}>
                          <span className="ic"><b.ic size={16} /></span>
                          <span>{b.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 1 && (
              <div className="lp-screen" key="alur">
                <div className="lp-eyebrow"><span className="bar" /><span>Alur &amp; Prosedur</span></div>
                <h2 className="lp-h2">Empat tahap menuju SKPP terbit</h2>
                <p className="lp-sub">Setiap perpindahan tahap tercatat dalam sistem dan dapat dipantau oleh Bendahara OPD maupun pegawai yang bersangkutan.</p>
                <div className="lp-alur-grid">
                  {ALUR.map((a) => (
                    <div className="lp-alur-item" key={a.no}>
                      <div className="lp-alur-no">{a.no}</div>
                      <div className="lp-alur-t">{a.t}</div>
                      <p className="lp-alur-d">{a.d}</p>
                    </div>
                  ))}
                </div>
                <button type="button" className="lp-cta-link" style={{ marginTop: 32, color: "var(--lp-gold-400)" }} onClick={() => go(2)}>
                  Lacak pengajuan Anda
                  <IcoChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                </button>
              </div>
            )}

            {page === 2 && (
              <div className="lp-lacak-wrap" key="lacak">
                <div className="lp-lacak-copy">
                  <div className="lp-fadeblock" style={{ opacity: trackOpen ? 0 : 1, pointerEvents: trackOpen ? "none" : "auto" }}>
                    <div className="lp-eyebrow"><span className="bar" /><span>Lacak Pengajuan</span></div>
                    <h2 className="lp-h2">Pantau status SKPP Anda</h2>
                    <p className="lp-sub">Masukkan nomor pengajuan atau NIP pegawai yang bersangkutan untuk melihat posisi pengajuan Anda pada setiap tahap — tanpa perlu masuk ke aplikasi.</p>
                    <p className="lp-lacak-note">Kode akses tercantum pada Tanda Terima yang diberikan petugas loket saat berkas didaftarkan.</p>
                  </div>
                  <div className="lp-track-info" style={{ opacity: trackOpen ? 1 : 0 }}>
                    <div className="lp-eyebrow"><span className="bar" style={{ width: 26 }} /><span>Lacak Pengajuan</span></div>
                    <div className="lp-track-big">Lacak deng <b>KATONG</b></div>
                    <p className="lp-track-sub">Pantau posisi pengajuan SKPP Anda pada setiap tahap — transparan dan tercatat.</p>
                    <div className="lp-brand-bullets">
                      <div className="lp-brand-bullet"><span className="ic"><IcoClock size={16} /></span><span>Senin–Jumat, 08.00–15.00 WITA</span></div>
                      <div className="lp-brand-bullet"><span className="ic"><IcoCheckCircle size={16} /></span><span>Rata-rata proses 3 hari kerja</span></div>
                      <div className="lp-brand-bullet"><span className="ic"><IcoPhone size={16} /></span><span>Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT</span></div>
                    </div>
                    <p className="lp-track-note">Simpan nomor pengajuan dan kode akses Anda untuk pelacakan berikutnya.</p>
                  </div>
                </div>
                <div className="lp-card" style={{ opacity: trackOpen ? 0 : 1, pointerEvents: trackOpen ? "none" : "auto", transition: "opacity 420ms cubic-bezier(0.2,0,0,1)" }}>
                  <div className="lp-card-title">Lacak status pengajuan</div>
                  <div className="lp-field">
                    <label>Nomor Pengajuan / NIP</label>
                    <input ref={nomorRef} value={nomor} onChange={(e) => setNomor(e.target.value)} onKeyDown={onEnter} placeholder="SKPP-NTT-2026-04821" />
                  </div>
                  <div className="lp-field">
                    <label>Kode Akses</label>
                    <input ref={kodeRef} value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} onKeyDown={onEnter} placeholder="A1B2C3D4" maxLength={8} style={{ fontFamily: "monospace", letterSpacing: 2 }} />
                    <div className="hint">Kode akses diberikan saat pengajuan dibuat.</div>
                  </div>
                  {error && (
                    <div className="lp-field-err"><IcoAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span></div>
                  )}
                  <button type="button" className="lp-btn lp-btn-primary lp-btn-md" style={{ width: "100%" }} onClick={doTrack} disabled={loading}>
                    {loading ? "⟳ Memverifikasi…" : "Lacak Status"}
                  </button>
                </div>
              </div>
            )}

            {page === 3 && (
              <div className="lp-screen" key="panduan">
                <div className="lp-eyebrow"><span className="bar" /><span>Panduan</span></div>
                <h2 className="lp-h2">Siapkan pengajuan Anda dengan mudah</h2>
                <div className="lp-pand-grid">
                  {PANDUAN_PERAN.map((p) => (
                    <div className="lp-pcard" key={p.label}>
                      <div className="lp-pcard-eyebrow">{p.label}</div>
                      <div className="lp-pcard-title">Panduan pengajuan SKPP</div>
                      <ul>{p.items.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      <div style={{ marginTop: "auto", paddingTop: 6 }}>
                        <button
                          type="button" className="lp-btn lp-btn-secondary lp-btn-sm"
                          onClick={() => bukaPdf(p.pdf, `panduan ${p.label}`)}
                        >
                          Unduh panduan (PDF)
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="lp-doc-card">
                    <div className="lp-doc-head">
                      <div className="lp-doc-eyebrow">Persyaratan dokumen</div>
                      <div className="lp-doc-nav">
                        <button type="button" aria-label="Sebelumnya" onClick={() => setDocSlide((d) => (d - 1 + DP_DOKUMEN_GRUP.length) % DP_DOKUMEN_GRUP.length)}>
                          <IcoChevronDown size={13} style={{ transform: "rotate(90deg)" }} />
                        </button>
                        <button type="button" aria-label="Berikutnya" onClick={() => setDocSlide((d) => (d + 1) % DP_DOKUMEN_GRUP.length)}>
                          <IcoChevronDown size={13} style={{ transform: "rotate(-90deg)" }} />
                        </button>
                      </div>
                    </div>
                    <div className="lp-doc-body">
                      <div className="lp-doc-slide" key={docSlide}>
                        <div className="lp-doc-title">{DOC_SLIDE_META[docSlide]?.t || DP_DOKUMEN_GRUP[docSlide].grup}</div>
                        <ul>{DP_DOKUMEN_GRUP[docSlide].items.map((it, i) => <li key={i}>{it.t}</li>)}</ul>
                        {DOC_SLIDE_META[docSlide]?.n && <div className="lp-doc-note">{DOC_SLIDE_META[docSlide].n}</div>}
                      </div>
                    </div>
                    <div className="lp-doc-dots">
                      {DP_DOKUMEN_GRUP.map((g, i) => (
                        <button key={i} type="button" aria-label={g.grup} onClick={() => setDocSlide(i)}
                          style={{ width: i === docSlide ? 18 : 6, background: i === docSlide ? "var(--lp-gold-500)" : "var(--lp-grey-300)" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 4 && (
              <div className="lp-screen lp-screen-grid" key="regulasi">
                <div className="lp-fadeblock" style={{ opacity: regOpen ? 0 : 1, pointerEvents: regOpen ? "none" : "auto" }}>
                  <div className="lp-eyebrow"><span className="bar" /><span>Regulasi</span></div>
                  <h2 className="lp-h2">Dasar hukum layanan SKPP</h2>
                  <div className="lp-reg-list">
                    {REGULASI.map((r, i) => (
                      <button type="button" key={r.kode} className="lp-reg-row" onClick={() => bukaRegulasi(i)}>
                        <div className="lp-reg-kode">{r.kode}</div>
                        <div style={{ flex: 1 }}>
                          <div className="lp-reg-jdl">{r.judul}</div>
                          <div className="lp-reg-desk">{r.deskripsi}</div>
                        </div>
                        <IcoChevronDown size={16} style={{ flex: "none", alignSelf: "center", transform: "rotate(-90deg)", color: "rgba(255,255,255,0.5)" }} />
                      </button>
                    ))}
                  </div>
                  <p className="lp-reg-note">Daftar bersifat ringkasan. Salinan resmi peraturan dapat diakses melalui JDIH Provinsi Nusa Tenggara Timur.</p>
                </div>
                <div className="lp-reg-info" style={{ opacity: regOpen ? 1 : 0 }}>
                  <div className="lp-eyebrow"><span className="bar" style={{ width: 26 }} /><span>Regulasi</span></div>
                  <div className="lp-reg-info-kode">{rd.kode}</div>
                  <p className="lp-track-sub">{rd.judul}</p>
                  <p className="lp-track-note">Salinan resmi dapat diakses melalui JDIH.</p>
                </div>
              </div>
            )}

            {page === 5 && (
              <div className="lp-screen" key="kontak">
                <div className="lp-eyebrow"><span className="bar" /><span>Kontak</span></div>
                <h2 className="lp-h2">Biar KATONG yang bantu kasih mudah</h2>
                <div className="lp-kontak-grid">
                  <div style={{ flex: "0 1 360px" }}>
                    <div className="lp-kontak-label">Alamat kantor</div>
                    <p className="lp-kontak-addr">
                      Jl. Raya El Tari No. 52<br />Oebobo, 85111<br />Kota Kupang, Nusa Tenggara Timur
                    </p>
                    <p className="lp-kontak-addr">
                      <a href="mailto:badankeuanganprovntt@gmail.com">badankeuanganprovntt@gmail.com</a><br />
                      <a href="https://bakeuda.nttprov.go.id/web/home?m=MQ==" target="_blank" rel="noopener">bakeuda.nttprov.go.id</a>
                    </p>
                    <p className="lp-kontak-addr" style={{ fontSize: 13, opacity: 0.75 }}>Senin–Jumat, 08.00–15.00 WITA</p>
                  </div>
                  <div style={{ flex: "0 1 320px" }}>
                    <div className="lp-kontak-label">Media sosial</div>
                    <div className="lp-sos">
                      <a href="https://www.facebook.com/people/Badan-Keuangan-Daerah-Prov-NTT/100072145037667/" target="_blank" rel="noopener">
                        <span className="lp-sos-ico"><IcoFacebook size={18} /></span>
                        <span>Bkeuda NTT</span>
                      </a>
                      <a href="https://www.instagram.com/bakeuda.ntt?igsh=MW1uaDE5YXdxcjJsOA==" target="_blank" rel="noopener">
                        <span className="lp-sos-ico"><IcoInstagram size={18} /></span>
                        <span>bakeuda.ntt</span>
                      </a>
                      <a href="https://www.tiktok.com/@bkeuda.ntt" target="_blank" rel="noopener">
                        <span className="lp-sos-ico"><IcoTiktok size={18} /></span>
                        <span>bkeuda.ntt</span>
                      </a>
                      <a href="https://youtube.com/@bkeudantt?si=O-0w6nx8xTTUWhGH" target="_blank" rel="noopener">
                        <span className="lp-sos-ico"><IcoYoutube size={18} /></span>
                        <span>BKEUDA NTT</span>
                      </a>
                    </div>
                  </div>
                </div>
                <p className="lp-copy">© 2026 Badan Keuangan Daerah Provinsi Nusa Tenggara Timur. Hak cipta dilindungi undang-undang.</p>
              </div>
            )}
          </main>

          {/* Indikator hero (carousel): tiap titik = satu latar; hover -> nama tempat. */}
          <div className="lp-hero-rail" aria-label="Pilih latar hero"
            style={{ opacity: anyPanelOpen ? 0 : 1, pointerEvents: anyPanelOpen ? "none" : "auto", transition: "opacity 420ms cubic-bezier(0.2,0,0,1)" }}>
            {HEROES.map((h, i) => (
              <button key={h.src} type="button"
                className={"lp-hero-dot" + (i === heroIdx ? " on" : "")}
                onClick={() => setHeroIdx(i)}
                aria-label={h.nama} aria-current={i === heroIdx}>
                <span className="lp-hero-tip">{h.nama}</span>
              </button>
            ))}
          </div>

          <div className="lp-footbar" style={{ opacity: anyPanelOpen ? 0 : 1, transition: "opacity 420ms cubic-bezier(0.2,0,0,1)" }}>
            <span>KATONG SKPP v1.0 · Dikembangkan oleh Dika Putra Gumay</span>
          </div>
        </div>

        {/* Backdrop + panel: Status Pelacakan */}
        <div className={"lp-backdrop" + (anyPanelOpen ? " show" : "")} onClick={closeAll} />

        {/* Panel Masuk / Daftar (kiri, dengan morph konten) */}
        <aside className={"lp-panel lp-panel-left" + (modalOpen ? " open" : "")}>
          <div className="lp-panel-in">
            <div className="lp-panel-head" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="lp-panel-close" onClick={closeModal}><IcoX size={16} /></button>
            </div>
            {modalMode === "masuk" ? (
              <MasukForm
                onSuccess={() => { setModalOpen(false); nav("/pengajuan-saya"); }}
                onSwitchToDaftar={() => setModalMode("daftar")}
              />
            ) : (
              <DaftarForm onSwitchToMasuk={() => setModalMode("masuk")} />
            )}
          </div>
        </aside>

        <aside className={"lp-panel" + (trackOpen ? " open" : "")}>
          <div className="lp-panel-in">
            <div className="lp-panel-head">
              <div className="lp-eyebrow"><span className="bar" style={{ width: 22 }} /><span style={{ color: "var(--lp-grey-600)" }}>Status Pengajuan</span></div>
              <button type="button" className="lp-panel-close" onClick={() => setTrackOpen(false)}><IcoX size={16} /></button>
            </div>
            {result && <ResultCard p={result} onSurvei={() => setSurveiOpen(true)} />}
          </div>
        </aside>

        {/* Jendela melayang Survei Kepuasan (SKM) — alur lacak publik */}
        {surveiOpen && result && (
          <div className="pm-overlay" onClick={() => setSurveiOpen(false)}>
            <div className="pm-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <div className="pm-head">
                <div>
                  <div className="pm-title">Survei Kepuasan Layanan</div>
                  <div className="pm-sub">{result.id}</div>
                </div>
                <button type="button" className="pm-close" aria-label="Tutup" onClick={() => setSurveiOpen(false)}>
                  <IcoX size={17} />
                </button>
              </div>
              <div className="pm-body">
                <SurveiSKM
                  nomor={nomor.trim()}
                  kode={kode.trim()}
                  onDone={() => { setResult((r) => (r ? { ...r, sudahSurvei: true } : r)); setSurveiOpen(false); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Backdrop + panel: Detail Regulasi */}
        <aside className={"lp-panel wide" + (regOpen ? " open" : "")}>
          <div className="lp-panel-in">
            <div className="lp-panel-head">
              <div className="lp-eyebrow"><span className="bar" style={{ width: 22 }} /><span style={{ color: "var(--lp-grey-600)" }}>Regulasi</span></div>
              <button type="button" className="lp-panel-close" onClick={() => setRegOpen(false)}><IcoX size={16} /></button>
            </div>
            <RegulasiDetail rd={rd} tab={regTab} onTab={setRegTab} />
          </div>
        </aside>
      </div>
    </div>
  );
}
