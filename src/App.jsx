import { useEffect, useRef, useState } from "react";
import {
  TAHAPAN_A,
  TAHAPAN_B,
  CAPTIONS,
  HERO_SLIDES,
  STAT_FALLBACK,
  PROSEDUR,
} from "./data.jsx";
import { lacak, fetchStatistik, getProgress } from "./lacak.js";
import { FormatCatatan } from "./FormatCatatan.jsx";

// ── UTILITAS NAVIGASI ────────────────────────────────────────────
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function scrollToLacak() {
  scrollToId("lacak");
  setTimeout(() => {
    const input = document.getElementById("inputNomor");
    if (input) input.focus();
  }, 700);
}

// ── NAVBAR ───────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  return (
    <nav className={"navbar" + (scrolled ? " scrolled" : "")} id="navbar">
      <div className="nav-left">
        <div className="nav-logo">
          <img src="/logo.png" alt="Logo Badan Keuangan Daerah Provinsi NTT" />
        </div>
        <div className="nav-brand">
          <div className="instansi">Pemerintah Provinsi Nusa Tenggara Timur</div>
          <div className="nama">Badan Keuangan Daerah Provinsi Nusa Tenggara Timur</div>
        </div>
      </div>
      <div className="nav-links">
        <a
          href="#prosedur"
          className="nav-a"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("prosedur");
          }}
        >
          Prosedur
        </a>
        <a
          href="#lacak"
          className="nav-btn"
          onClick={(e) => {
            e.preventDefault();
            scrollToLacak();
          }}
        >
          🔍 Lacak Status SKPP
        </a>
      </div>
    </nav>
  );
}

// ── HERO (slider) ────────────────────────────────────────────────
function Hero() {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="hero">
      <div className="hero-slides">
        {HERO_SLIDES.map((src, i) => (
          <div
            key={i}
            className={"slide" + (i === cur ? " active" : "")}
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}
      </div>
      <div className="hero-body">
        <div className="hero-eyebrow">
          <i></i>SI-PASTI · Sistem Pemantauan Alur SKPP Terintegrasi
        </div>
        <h1 className="hero-h1">
          Status SKPP Anda,
          <br />
          Kini <em>Pasti</em>
          <br />
          &amp; Terpantau
        </h1>
        <p className="hero-p">
          Lewat SI-PASTI, Badan Keuangan Daerah Provinsi Nusa Tenggara Timur menghadirkan
          kepastian dan transparansi — pantau setiap tahap pengajuan SKPP Anda secara daring,
          kapan saja.
        </p>
        <a
          href="#lacak"
          className="hero-cta"
          onClick={(e) => {
            e.preventDefault();
            scrollToLacak();
          }}
        >
          Lacak Status SKPP
        </a>
      </div>
      <div className="indicators">
        {HERO_SLIDES.map((_, i) => (
          <div
            key={i}
            className={"dot" + (i === cur ? " active" : "")}
            onClick={() => setCur(i)}
          />
        ))}
      </div>
      <div className="slide-caption">
        <div className="caption-txt">{CAPTIONS[cur]}</div>
      </div>
    </section>
  );
}

// ── STATS (counter animasi + RPC statistik) ──────────────────────
function animCount(setter, target) {
  let v = 0;
  const step = Math.ceil(target / 55) || 1;
  const t = setInterval(() => {
    v = Math.min(v + step, target);
    setter(v);
    if (v >= target) clearInterval(t);
  }, 28);
}

function Stats() {
  const ref = useRef(null);
  const [total, setTotal] = useState(0);
  const [terbit, setTerbit] = useState(0);
  const [hari, setHari] = useState("≤ 3");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (x) => {
          if (x.isIntersecting && !started) {
            started = true;
            obs.disconnect();
            const stats = await fetchStatistik();
            animCount(setTotal, stats?.total ?? STAT_FALLBACK.total);
            animCount(setTerbit, stats?.terbit ?? STAT_FALLBACK.terbit);
            if (stats && typeof stats.rataHari === "number") {
              setHari(stats.rataHari < 1 ? "< 1" : String(stats.rataHari));
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="stats" ref={ref}>
      <div className="stat">
        <div className="stat-n">{total.toLocaleString("id-ID")}</div>
        <div className="stat-l">Total Pengajuan SKPP</div>
      </div>
      <div className="stat">
        <div className="stat-n">{terbit.toLocaleString("id-ID")}</div>
        <div className="stat-l">SKPP Telah Diterbitkan</div>
      </div>
      <div className="stat">
        <div className="stat-n">{hari}</div>
        <div className="stat-l">Hari Kerja Rata-rata Proses</div>
      </div>
      <div className="stat">
        <div className="stat-n">24/7</div>
        <div className="stat-l">Akses Pelacakan Daring</div>
      </div>
    </div>
  );
}

// ── KARTU HASIL PELACAKAN ────────────────────────────────────────
function ResultCard({ p }) {
  const tahapan = p.jalur === "A" ? TAHAPAN_A : TAHAPAN_B;
  const prog = getProgress(p);
  const progColor = prog === 100 ? "#059669" : p.status === "kembali" ? "#d97706" : "#1d4ed8";
  const barBg =
    prog === 100
      ? "linear-gradient(90deg,#059669,#10b981)"
      : p.status === "kembali"
      ? "linear-gradient(90deg,#d97706,#f59e0b)"
      : "linear-gradient(90deg,var(--teal),var(--blue))";

  const badge =
    p.status === "selesai" ? (
      <span className="badge-selesai">✓ Selesai</span>
    ) : p.status === "kembali" ? (
      <span className="badge-kembali">↩ Berkas Dikembalikan</span>
    ) : (
      <span className="badge-proses">⟳ Sedang Diproses</span>
    );

  const meta = [p.opd, p.alasan, p.jalur === "A" ? "Jalur A" : "Jalur B"]
    .filter(Boolean)
    .join(" · ");

  const infoItems = [
    ["NIP", p.nip || "-"],
    ["OPD / Instansi", p.opd || "-"],
    ["Pangkat / Gol.", p.pangkat || "-"],
    ["Tgl. Masuk", p.tanggalMasuk || "-"],
    p.status === "selesai"
      ? ["Tgl. Selesai", p.tanggalSelesai || "-"]
      : ["Est. Selesai", p.estimasiSelesai || "-"],
    p.nomorSKPP ? ["Nomor SKPP", p.nomorSKPP] : null,
  ].filter(Boolean);

  return (
    <>
      <div className="res-header">
        <div>
          <div className="res-id">{p.id}</div>
          <div className="res-name">{p.nama}</div>
          <div className="res-meta">{meta}</div>
        </div>
        <div>{badge}</div>
      </div>

      <div className="res-prog-label">
        <span>Progres Penyelesaian</span>
        <span style={{ fontWeight: 800, color: progColor }}>{prog}%</span>
      </div>
      <div className="res-prog-wrap">
        <div className="res-prog-bar" style={{ width: prog + "%", background: barBg }} />
      </div>

      <div className="res-info-grid">
        {infoItems.map(([l, v]) => (
          <div key={l}>
            <div className="res-info-lbl">{l}</div>
            <div className="res-info-val">{v}</div>
          </div>
        ))}
      </div>

      {p.status === "kembali" && p.catatan && (
        <div className="result-alert result-alert-warn">
          <span>⚠️</span>
          <div>
            <strong>Berkas Perlu Dilengkapi</strong>
            <br />
            <span style={{ fontSize: 12 }}>
              <FormatCatatan raw={p.catatan} />
            </span>
          </div>
        </div>
      )}

      {p.status === "selesai" && (
        <div className="result-alert result-alert-ok">
          <span>🎉</span>
          <div>
            <strong>SKPP Telah Selesai</strong>
            <br />
            <span style={{ fontSize: 12 }}>
              SKPP dapat diambil di Loket Bidang Perbendaharaan. Harap membawa identitas diri
              dan tanda terima pengajuan.
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--g500)",
          textTransform: "uppercase",
          letterSpacing: ".5px",
          margin: "20px 0 12px",
        }}
      >
        Riwayat Proses
      </div>

      <div className="timeline">
        {tahapan.map((step, idx) => {
          const isDone = p.tahapSelesai.includes(step.id);
          const isAktif = p.tahapAktif === step.id;
          const isLast = idx === tahapan.length - 1;
          // Ambil catatan TERBARU untuk tahap ini (entri terakhir mencerminkan
          // status akhir — selaras dashboard internal).
          const logs = p.riwayat.filter((r) => r.tahap === step.id);
          const log = logs.length ? logs[logs.length - 1] : null;
          // "dikembalikan" hanya bila tahap ini sedang aktif & status kembali.
          const isRet = !isDone && isAktif && p.status === "kembali";

          let dotCls = "w";
          let dotIcon = "○";
          if (isDone) {
            dotCls = "d";
            dotIcon = "✓";
          } else if (isRet) {
            dotCls = "r";
            dotIcon = "↩";
          } else if (isAktif) {
            dotCls = "a";
            dotIcon = "→";
          }

          return (
            <div className="tl-item" key={step.id}>
              <div className="tl-left">
                <div className={`tl-dot ${dotCls}`}>{dotIcon}</div>
                {!isLast && <div className={`tl-line ${isDone && !isRet ? "d" : ""}`} />}
              </div>
              <div className="tl-content" style={{ paddingBottom: isLast ? 0 : 18 }}>
                <div className={`tl-title ${!isDone && !isAktif ? "w" : ""}`}>
                  {step.label}
                  {isAktif && !isDone && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        marginLeft: 6,
                      }}
                    >
                      Aktif
                    </span>
                  )}
                </div>
                <div className={`tl-sub ${!isDone && !isAktif ? "w" : ""}`}>{step.pelaksana}</div>
                {log && <div className="tl-time">{log.waktu || ""}</div>}
                {log && log.catatan && (
                  <div className={`tl-note ${isRet ? "r" : ""}`}>
                    {isRet ? "⚠ " : ""}
                    <FormatCatatan raw={log.catatan} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 11,
          color: "var(--g500)",
          textAlign: "center",
        }}
      >
        Hubungi Bidang Perbendaharaan Bakeuda NTT untuk informasi lebih lanjut
        <br />
        📧 badankeuanganprovntt@gmail.com &nbsp;·&nbsp; 🕐 Senin–Jumat, 08.00–15.00 WITA
      </div>
    </>
  );
}

// ── BAGIAN LACAK (form + hasil) ──────────────────────────────────
function LacakSection() {
  const [nomor, setNomor] = useState("");
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const nomorRef = useRef(null);
  const kodeRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      const el = resultRef.current;
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }
  }, [result]);

  async function doLacak() {
    if (!nomor.trim()) {
      nomorRef.current?.focus();
      return;
    }
    if (!kode.trim()) {
      kodeRef.current?.focus();
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    scrollToId("lacak");
    try {
      const p = await lacak(nomor.trim(), kode.trim());
      if (p) setResult(p);
      else
        setError(
          "Nomor pengajuan/NIP atau kode akses tidak valid. Periksa kembali tanda terima Anda."
        );
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda dan coba kembali.");
    }
    setLoading(false);
  }

  const onEnter = (e) => e.key === "Enter" && doLacak();

  return (
    <section className="lacak-section" id="lacak">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="s-tag">Pelacakan Status Pengajuan</div>
        <h2 className="s-h2">
          Cek Status <em>Pengajuan SKPP</em> Anda
        </h2>
        <p className="s-p" style={{ maxWidth: "100%", marginBottom: 28 }}>
          Masukkan Nomor Pengajuan <strong>atau NIP</strong>, beserta Kode Akses yang tertera
          pada <strong>Tanda Terima Pengajuan</strong> yang diberikan oleh petugas loket Bidang
          Perbendaharaan.
        </p>

        <div className="search-form">
          <div className="search-row">
            <div className="search-group">
              <label className="search-label">Nomor Pengajuan / NIP</label>
              <input
                type="text"
                id="inputNomor"
                ref={nomorRef}
                className="search-field"
                placeholder="Nomor Pengajuan atau NIP"
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                onKeyDown={onEnter}
              />
            </div>
            <div className="search-group" style={{ maxWidth: 180 }}>
              <label className="search-label">Kode Akses</label>
              <input
                type="text"
                id="inputKode"
                ref={kodeRef}
                className="search-field kode-field"
                placeholder="A1B2C3"
                maxLength={6}
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                onKeyDown={onEnter}
              />
            </div>
          </div>
          <button className="search-submit" onClick={doLacak} disabled={loading}>
            <span>{loading ? "⟳ Memverifikasi…" : "Lacak Status SKPP"}</span>
          </button>
        </div>

        <div className="search-hint">
          ℹ️ Nomor Pengajuan dan Kode Akses tercantum pada <strong>Tanda Terima</strong> yang
          diberikan petugas loket saat berkas didaftarkan. Anda juga dapat mencari menggunakan{" "}
          <strong>NIP</strong> beserta Kode Akses.
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="search-spinner"></div>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--g500)" }}>
              Memverifikasi dan mencari data pengajuan…
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="result-alert result-alert-warn">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Pencarian Gagal</strong>
              <br />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="result-wrap" ref={resultRef}>
            <ResultCard p={result} />
          </div>
        )}
      </div>
    </section>
  );
}

// ── PROSEDUR ─────────────────────────────────────────────────────
function Prosedur() {
  return (
    <section className="prosedur-section" id="prosedur">
      <div className="wrap">
        <div style={{ maxWidth: 500 }}>
          <div className="s-tag">Tata Cara Pengajuan</div>
          <h2 className="s-h2">
            Prosedur Pengajuan <em style={{ color: "var(--gold)" }}>SKPP</em>
          </h2>
          <p className="s-p">
            Berikut adalah tahapan proses penerbitan SKPP di Bidang Perbendaharaan Badan Keuangan
            Daerah Provinsi NTT sesuai dengan SOP yang berlaku.
          </p>
        </div>
        <div className="steps-grid">
          {PROSEDUR.map((s) => (
            <div className="step-card" key={s.no}>
              <div className="step-no">{s.no}</div>
              <div className="step-ico">{s.ico}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/logo.png" alt="Logo Badan Keuangan Daerah Provinsi NTT" />
              </div>
              <div>
                <div className="ft-nama">
                  Badan Keuangan Daerah
                  <br />
                  Provinsi Nusa Tenggara Timur
                </div>
                <div className="ft-sub">SI-PASTI · Sistem Pemantauan Alur SKPP Terintegrasi</div>
              </div>
            </div>
          </div>
          <div>
            <div className="fc-title">Alamat Kantor</div>
            <div className="footer-addr">
              Jl. Raya El Tari No. 52
              <br />
              Oebobo, 85111
              <br />
              Kota Kupang, Nusa Tenggara Timur
              <br />
              <br />
              <a href="mailto:badankeuanganprovntt@gmail.com">badankeuanganprovntt@gmail.com</a>
              <br />
              <a
                href="https://bakeuda.nttprov.go.id/web/home?m=MQ=="
                target="_blank"
                rel="noopener"
              >
                bakeuda.nttprov.go.id
              </a>
              <br />
              🕐 Senin–Jumat, 08.00–15.00 WITA
            </div>
          </div>
          <div>
            <div className="fc-title">Media Sosial</div>
            <div className="sosmed-list">
              <a
                href="https://www.facebook.com/people/Badan-Keuangan-Daerah-Prov-NTT/100072145037667/"
                className="sosmed-a"
                target="_blank"
                rel="noopener"
              >
                <div className="sosmed-ico" style={{ background: "#1877f2" }}>
                  <svg width="16" height="16" viewBox="0 0 320 512" fill="#fff" aria-hidden="true">
                    <path d="M279.14 288l14.22-92.66h-88.91V134.6c0-25.35 12.42-50.06 52.24-50.06h40.42V5.49S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                  </svg>
                </div>
                <span>Bkeuda NTT</span>
              </a>
              <a
                href="https://www.instagram.com/bakeuda.ntt?igsh=MW1uaDE5YXdxcjJsOA=="
                className="sosmed-a"
                target="_blank"
                rel="noopener"
              >
                <div
                  className="sosmed-ico"
                  style={{ background: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.22.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.05-.41-2.22-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41 1.27-.06 1.65-.07 4.85-.07zm0 1.95c-3.15 0-3.52.01-4.76.07-.95.04-1.46.2-1.81.34-.45.18-.78.39-1.12.73-.34.34-.55.67-.73 1.12-.13.35-.3.86-.34 1.81-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.95.2 1.46.34 1.81.18.45.39.78.73 1.12.34.34.67.55 1.12.73.35.13.86.3 1.81.34 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.95-.04 1.46-.2 1.81-.34.45-.18.78-.39 1.12-.73.34-.34.55-.67.73-1.12.13-.35.3-.86.34-1.81.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.95-.2-1.46-.34-1.81-.18-.45-.39-.78-.73-1.12-.34-.34-.67-.55-1.12-.73-.35-.13-.86-.3-1.81-.34-1.24-.06-1.61-.07-4.76-.07zm0 3.32a5.07 5.07 0 1 1 0 10.14 5.07 5.07 0 0 1 0-10.14zm0 8.36a3.29 3.29 0 1 0 0-6.58 3.29 3.29 0 0 0 0 6.58zm6.46-8.58a1.18 1.18 0 1 1-2.37 0 1.18 1.18 0 0 1 2.37 0z" />
                  </svg>
                </div>
                <span>bakeuda.ntt</span>
              </a>
              <a
                href="https://www.tiktok.com/@bkeuda.ntt"
                className="sosmed-a"
                target="_blank"
                rel="noopener"
              >
                <div className="sosmed-ico" style={{ background: "#010101" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.86a2.59 2.59 0 0 1-2.59 2.46 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.4-2.46V9.99a5.78 5.78 0 0 0-.81-.06A5.79 5.79 0 0 0 4 15.72a5.79 5.79 0 0 0 9.97 3.97 5.78 5.78 0 0 0 1.6-4V8.9a7.45 7.45 0 0 0 4.36 1.4V7.1a4.29 4.29 0 0 1-3.33-1.28z" />
                  </svg>
                </div>
                <span>bkeuda.ntt</span>
              </a>
              <a
                href="https://youtube.com/@bkeudantt?si=O-0w6nx8xTTUWhGH"
                className="sosmed-a"
                target="_blank"
                rel="noopener"
              >
                <div className="sosmed-ico" style={{ background: "#ff0000" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span>BKEUDA NTT</span>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">
            © 2026 Badan Keuangan Daerah Provinsi Nusa Tenggara Timur. Hak cipta dilindungi
            undang-undang.
          </div>
          <div className="footer-ver">SI-PASTI v1.0 · Dikembangkan oleh Dika Putra Gumay</div>
        </div>
      </div>
    </footer>
  );
}

// ── APP ──────────────────────────────────────────────────────────
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
      <Hero />
      <Stats />
      <LacakSection />
      <Prosedur />
      <Footer />
      <button
        className={"btt" + (showBtt ? " show" : "")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Kembali ke atas"
      >
        ↑
      </button>
    </>
  );
}
