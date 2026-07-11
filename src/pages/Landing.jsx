import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { TAHAPAN_A, TAHAPAN_B, CAPTIONS, HERO_SLIDES, STAT_FALLBACK, PROSEDUR } from "../data.jsx";
import { lacak, fetchStatistik, getProgress } from "../lacak.js";
import { FormatCatatan } from "../FormatCatatan.jsx";
import { scrollToId, scrollToLacak } from "../nav.js";

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
          <div key={i} className={"dot" + (i === cur ? " active" : "")} onClick={() => setCur(i)} />
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

// Pengajuan online yang belum diverifikasi loket (jalur belum ditetapkan) ->
// tampilan ringkas, bukan progress/timeline (yang butuh jalur A/B).
function ResultCardOnlinePending({ p }) {
  const ditolak = p.status === "ditolak";
  return (
    <>
      <div className="res-header">
        <div>
          <div className="res-id">{p.id}</div>
          <div className="res-name">{p.nama}</div>
          <div className="res-meta">{[p.opd, p.alasan].filter(Boolean).join(" · ")}</div>
        </div>
        <div>
          {ditolak ? (
            <span className="badge-kembali" style={{ background: "#fee2e2", color: "#b91c1c" }}>⛔ Ditolak</span>
          ) : (
            <span className="badge-proses" style={{ background: "#fef3c7", color: "#92400e" }}>⏳ Menunggu Verifikasi Loket</span>
          )}
        </div>
      </div>

      <div className="res-info-grid" style={{ marginTop: 16 }}>
        <div>
          <div className="res-info-lbl">NIP</div>
          <div className="res-info-val">{p.nip || "-"}</div>
        </div>
        <div>
          <div className="res-info-lbl">OPD / Instansi</div>
          <div className="res-info-val">{p.opd || "-"}</div>
        </div>
        <div>
          <div className="res-info-lbl">Tgl. Diajukan</div>
          <div className="res-info-val">{p.tanggalMasuk || "-"}</div>
        </div>
      </div>

      {ditolak ? (
        <div className="result-alert result-alert-warn">
          <span>⛔</span>
          <div>
            <strong>Pengajuan Ditolak</strong>
            <br />
            <span style={{ fontSize: 12 }}>
              {p.catatan ? <FormatCatatan raw={p.catatan} /> : "Hubungi Bidang Perbendaharaan untuk informasi lebih lanjut."}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="result-alert result-alert-ok">
            <span>📥</span>
            <div>
              <strong>Pengajuan Diterima Sistem</strong>
              <br />
              <span style={{ fontSize: 12 }}>
                Berkas Anda sedang menunggu verifikasi oleh loket Bidang Perbendaharaan. Jalur proses
                (A/B) akan ditetapkan saat verifikasi.
              </span>
            </div>
          </div>
          {p.catatan && (
            <div className="result-alert result-alert-warn">
              <span>⚠️</span>
              <div>
                <strong>Perlu Dilengkapi</strong>
                <br />
                <span style={{ fontSize: 12 }}>
                  <FormatCatatan raw={p.catatan} />
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 16, fontSize: 11, color: "var(--g500)", textAlign: "center" }}>
        Hubungi Bidang Perbendaharaan Bakeuda NTT untuk informasi lebih lanjut
        <br />
        📧 badankeuanganprovntt@gmail.com &nbsp;·&nbsp; 🕐 Senin–Jumat, 08.00–15.00 WITA
      </div>
    </>
  );
}

// ── KARTU HASIL PELACAKAN ────────────────────────────────────────
function ResultCard({ p }) {
  if (p.status === "diajukan" || p.status === "ditolak") return <ResultCardOnlinePending p={p} />;
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

  const meta = [p.opd, p.alasan, p.jalur === "A" ? "Jalur A" : "Jalur B"].filter(Boolean).join(" · ");

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
              SKPP dapat diambil di Loket Bidang Perbendaharaan. Harap membawa identitas diri dan
              tanda terima pengajuan.
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
          const logs = p.riwayat.filter((r) => r.tahap === step.id);
          const log = logs.length ? logs[logs.length - 1] : null;
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

      <div style={{ marginTop: 16, fontSize: 11, color: "var(--g500)", textAlign: "center" }}>
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
        setError("Nomor pengajuan/NIP atau kode akses tidak valid. Periksa kembali tanda terima Anda.");
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
          Masukkan Nomor Pengajuan <strong>atau NIP</strong>, beserta Kode Akses yang tertera pada{" "}
          <strong>Tanda Terima Pengajuan</strong> yang diberikan oleh petugas loket Bidang
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

export default function Landing() {
  const loc = useLocation();
  // Dukung navigasi lintas-rute "/#lacak" atau "/#prosedur" dari Navbar.
  useEffect(() => {
    if (loc.hash) {
      const id = loc.hash.slice(1);
      setTimeout(() => (id === "lacak" ? scrollToLacak() : scrollToId(id)), 60);
    }
  }, [loc]);

  return (
    <>
      <Hero />
      <Stats />
      <LacakSection />
      <Prosedur />
    </>
  );
}
