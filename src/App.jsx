import { useState } from "react";

// Sumber data: Supabase (sama dengan dashboard admin). Portal hanya MEMBACA
// (anon key + kebijakan "public read" RLS). Pencarian via Nomor Pengajuan / Kode Akses.
const SUPABASE_URL = "https://phxyrferpnylgbbghgsn.supabase.co";
const SUPABASE_KEY = "sb_publishable_jqC1ntXlQai4j2X_e9x1vg_VZ0E6nBy";
const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY };

const JALUR = { A: "Jalur A – Tanpa Pangkat Pengabdian", B: "Jalur B – Ada Pangkat Pengabdian" };

// Tahapan disamakan persis dengan dashboard (ID & label terbaru).
const TAHAPAN_A = [
  { id: "A1", label: "Berkas Diterima di Loket", icon: "📥", pelaksana: "Staf Loket" },
  { id: "A2", label: "Verifikasi Kelengkapan Berkas", icon: "🔍", pelaksana: "Staf Pengampu OPD" },
  { id: "A4", label: "Pembuatan Draft SKPP", icon: "📝", pelaksana: "Penyusun SKPP" },
  { id: "A5", label: "Verifikasi & Proses Tanda Tangan Pimpinan", icon: "✅", pelaksana: "Staf Pengampu OPD → Kasubid → Kuasa BUD" },
  { id: "A6", label: "Penempelan Foto & Penomoran", icon: "📸", pelaksana: "Staf Loket" },
  { id: "A7", label: "SKPP Siap Diserahkan", icon: "🎉", pelaksana: "Staf Loket", final: true },
];

const TAHAPAN_B = [
  { id: "B1", label: "Berkas Diterima di Loket", icon: "📥", pelaksana: "Staf Loket" },
  { id: "B2", label: "Verifikasi Kelengkapan Berkas", icon: "🔍", pelaksana: "Staf Pengampu OPD" },
  { id: "B4", label: "Perhitungan Kekurangan (SIMgaji)", icon: "🖥️", pelaksana: "Staf Pengampu OPD" },
  { id: "B5", label: "Rincian Perhitungan Kekurangan Pembayaran Pangkat Pengabdian diserahkan ke Bendahara OPD", icon: "📤", pelaksana: "Staf Pengampu OPD" },
  { id: "B6", label: "SPP-SPM Diterima dari OPD", icon: "📋", pelaksana: "Staf Perbendaharaan" },
  { id: "B7", label: "Proses SP2D Kekurangan Pembayaran Pangkat Pengabdian", icon: "💳", pelaksana: "Staf Perbendaharaan" },
  { id: "B8", label: "Pembuatan Draft SKPP", icon: "📝", pelaksana: "Staf Perbendaharaan" },
  { id: "B9", label: "Verifikasi & Proses Tanda Tangan Pimpinan", icon: "✅", pelaksana: "Staf Pengampu OPD → Kasubid → Kuasa BUD" },
  { id: "B10", label: "Penempelan Foto & Penomoran", icon: "📸", pelaksana: "Staf Loket" },
  { id: "B11", label: "SKPP Siap Diserahkan", icon: "🎉", pelaksana: "Staf Loket", final: true },
];

// Lacak satu pengajuan dari Supabase berdasarkan Nomor Pengajuan (id) atau Kode Akses.
async function lacakSupabase(query) {
  const q = encodeURIComponent(query);
  const url = `${SUPABASE_URL}/rest/v1/Pengajuan?or=(id.ilike.${q},kodeAkses.ilike.${q})&select=*`;
  const res = await fetch(url, { headers: SB_HEADERS });
  if (!res.ok) return { ok: false, pesan: "Gagal terhubung ke server." };
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0)
    return { ok: false, pesan: "Data tidak ditemukan. Periksa Nomor Pengajuan atau Kode Akses Anda." };
  const p = rows[0];
  const rurl = `${SUPABASE_URL}/rest/v1/Riwayat?pengajuanId=eq.${encodeURIComponent(p.id)}&select=*&order=waktu.asc`;
  const rres = await fetch(rurl, { headers: SB_HEADERS });
  const riwayat = rres.ok ? await rres.json() : [];
  return { ok: true, data: { ...p, riwayat: Array.isArray(riwayat) ? riwayat : [] } };
}

// Ubah catatan Formulir Pengembalian (JSON) menjadi teks yang mudah dibaca warga.
function bacaCatatan(str) {
  if (!str) return "";
  let o = null;
  try { o = JSON.parse(str); } catch { return str; }
  if (!o || o._type !== "FORMULIR_KEMBALI") return str;
  const parts = [];
  const dok = (o.rincian || []).filter((r) => r.dokumen);
  if (dok.length) parts.push("Dokumen yang harus dilengkapi: " + dok.map((r) => r.dokumen + (r.tindakan ? ` (${r.tindakan})` : "")).join("; "));
  const hut = (o.rincianHutang || []).filter((r) => r.jenis);
  if (hut.length) parts.push("Hutang/kewajiban yang harus diselesaikan: " + hut.map((r) => r.jenis).join("; "));
  return parts.join(" — ") || "Berkas dikembalikan untuk dilengkapi.";
}

function getProgress(p) {
  const tahapan = p.jalur === "A" ? TAHAPAN_A : TAHAPAN_B;
  const selesai = Array.isArray(p.tahapSelesai) ? p.tahapSelesai : (p.tahapSelesai || "").split(",").filter(Boolean);
  return Math.round((selesai.length / tahapan.length) * 100);
}

function normalizeP(p) {
  return {
    ...p,
    tahapSelesai: Array.isArray(p.tahapSelesai) ? p.tahapSelesai : (p.tahapSelesai || "").split(",").filter(Boolean),
    riwayat: p.riwayat || [],
  };
}

export default function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const res = await lacakSupabase(query.trim());
      if (res.ok) setResult(normalizeP(res.data));
      else setErr(res.pesan || "Data tidak ditemukan.");
    } catch {
      setErr("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    }
    setLoading(false);
  };

  const prog = result ? getProgress(result) : 0;

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy:#0f1e3c; --navy-mid:#1a3260; --blue:#1d4ed8; --blue-light:#3b82f6;
          --blue-pale:#eff6ff; --green:#059669; --green-pale:#ecfdf5;
          --amber:#d97706; --amber-pale:#fffbeb; --red:#dc2626; --red-pale:#fef2f2;
          --g50:#f8fafc; --g100:#f1f5f9; --g200:#e2e8f0; --g300:#cbd5e1;
          --g400:#94a3b8; --g500:#64748b; --g600:#475569; --g700:#334155; --g800:#1e293b;
          --font:'Plus Jakarta Sans',sans-serif; --mono:'JetBrains Mono',monospace;
          --r:12px; --rs:8px;
          --shadow:0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06);
        }
        body{font-family:var(--font);background:var(--g50);color:var(--g800);}
        .app{min-height:100vh;display:flex;flex-direction:column;}
        .container-sm{max-width:720px;margin:0 auto;padding:28px 20px;}
        .card{background:white;border-radius:var(--r);box-shadow:var(--shadow);border:1px solid var(--g200);margin-bottom:20px;}
        .card-header{padding:18px 22px;border-bottom:1px solid var(--g100);display:flex;align-items:center;justify-content:space-between;}
        .card-body{padding:22px;}
        .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;}
        .badge-blue{background:#dbeafe;color:#1d4ed8;}
        .badge-green{background:#d1fae5;color:#065f46;}
        .badge-amber{background:#fef3c7;color:#92400e;}
        .progress-wrap{background:var(--g100);border-radius:999px;height:6px;overflow:hidden;}
        .progress-bar{height:100%;border-radius:999px;transition:width .5s ease;}
        .timeline{position:relative;}
        .timeline-item{display:flex;gap:16px;position:relative;}
        .timeline-left{display:flex;flex-direction:column;align-items:center;width:36px;flex-shrink:0;}
        .timeline-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;position:relative;z-index:1;border:2.5px solid transparent;}
        .timeline-dot.done{background:#d1fae5;border-color:#059669;}
        .timeline-dot.active{background:#dbeafe;border-color:var(--blue);animation:pulseRing 2s infinite;}
        .timeline-dot.pending{background:var(--g100);border-color:var(--g300);opacity:.5;}
        .timeline-dot.returned{background:#fef3c7;border-color:var(--amber);}
        .timeline-line{flex:1;width:2px;background:var(--g200);min-height:24px;margin-top:4px;}
        .timeline-line.done{background:#059669;}
        .timeline-content{flex:1;}
        .timeline-title{font-weight:700;font-size:14px;color:var(--g800);margin-bottom:2px;}
        .timeline-title.pending{color:var(--g400);}
        .timeline-subtitle{font-size:12px;color:var(--g500);margin-bottom:6px;}
        .timeline-time{font-size:11px;color:var(--g400);font-family:var(--mono);}
        .timeline-note{background:var(--g50);border:1px solid var(--g200);border-radius:var(--rs);padding:8px 12px;font-size:12px;color:var(--g600);margin-top:6px;}
        .timeline-note.ret{background:#fffbeb;border-color:#fde68a;color:#92400e;}
        @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(59,130,246,.4);}70%{box-shadow:0 0 0 8px rgba(59,130,246,0);}100%{box-shadow:0 0 0 0 rgba(59,130,246,0);}}
        .hero{background:linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 100%);padding:40px 24px;text-align:center;color:white;}
        .hero h1{font-size:26px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px;}
        .hero p{color:#94a3b8;font-size:14px;}
        .hero-search-wrap{max-width:500px;margin:24px auto 0;position:relative;}
        .hero-search-input{width:100%;padding:14px 20px;padding-right:110px;border:none;border-radius:12px;font-family:var(--font);font-size:14px;outline:none;color:var(--g800);}
        .hero-search-btn{position:absolute;right:6px;top:6px;padding:8px 16px;background:var(--blue);color:white;border:none;border-radius:8px;font-family:var(--font);font-weight:700;font-size:13px;cursor:pointer;}
        .alert{padding:12px 16px;border-radius:var(--rs);margin-bottom:16px;font-size:13px;display:flex;gap:10px;align-items:flex-start;}
        .alert-amber{background:#fffbeb;border:1px solid #fde68a;color:#92400e;}
        .alert-green{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;}
        .info-row{display:flex;gap:8px;align-items:baseline;margin-bottom:8px;}
        .info-label{font-size:11px;color:var(--g500);font-weight:700;text-transform:uppercase;letter-spacing:.4px;min-width:100px;}
        .info-value{font-size:13px;color:var(--g800);font-weight:500;}
        .loading-overlay{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px;color:var(--g500);}
        .spinner{width:32px;height:32px;border:3px solid var(--g200);border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="hero">
        <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
        <h1>Lacak Status Pengajuan SKPP</h1>
        <p>Badan Keuangan dan Aset Daerah Provinsi NTT</p>
        <div className="hero-search-wrap">
          <input className="hero-search-input" placeholder="Masukkan Nomor Pengajuan atau NIP"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <button className="hero-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? "..." : "Lacak →"}
          </button>
        </div>
      </div>

      <div className="container-sm">
        {loading && <div className="loading-overlay"><div className="spinner" /><span>Mencari data...</span></div>}

        {err && !loading && (
          <div className="alert alert-amber">
            <span>⚠️</span>
            <div><strong>Data tidak ditemukan</strong><br />{err}</div>
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="card">
              <div className="card-body">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:"var(--g500)", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Nomor Pengajuan</div>
                    <div style={{ fontSize:20, fontWeight:800, fontFamily:"var(--mono)", color:"var(--navy)" }}>{result.id}</div>
                  </div>
                  <span className={`badge ${result.status === "selesai" ? "badge-green" : result.status === "kembali" ? "badge-amber" : "badge-blue"}`}>
                    {result.status === "selesai" ? "✓ Selesai" : result.status === "kembali" ? "↩ Dikembalikan" : "⟳ Diproses"}
                  </span>
                </div>
                <div style={{ background:"var(--g50)", borderRadius:"var(--rs)", padding:"14px 16px", marginBottom:16 }}>
                  {[["Nama", result.nama, true], ["NIP", result.nip], ["Instansi", result.opd], ["Keperluan", result.alasan], ["Tanggal Masuk", result.tanggalMasuk]].map(([l, v, bold]) => (
                    <div key={l} className="info-row">
                      <span className="info-label">{l}</span>
                      <span className="info-value" style={bold ? { fontWeight:700 } : {}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--g600)" }}>Progress</span>
                  <span style={{ fontSize:12, fontWeight:800, color: prog===100 ? "var(--green)" : "var(--blue)" }}>{prog}%</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width:`${prog}%`, background: prog===100 ? "var(--green)" : result.status==="kembali" ? "var(--amber)" : "var(--blue)" }} />
                </div>
              </div>
            </div>

            {result.status === "kembali" && (() => {
              const retLog = [...result.riwayat].reverse().find((r) => r.isKembali === true || r.isKembali === "TRUE");
              const pesan = bacaCatatan(retLog?.catatan);
              return pesan ? (
                <div className="alert alert-amber">
                  <span>⚠️</span>
                  <div><strong>Berkas Perlu Dilengkapi:</strong><br />{pesan}</div>
                </div>
              ) : null;
            })()}

            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:"var(--navy)" }}>Riwayat Proses</div>
                  <div style={{ fontSize:12, color:"var(--g500)" }}>{JALUR[result.jalur]}</div>
                </div>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {(result.jalur === "A" ? TAHAPAN_A : TAHAPAN_B).map((step, idx, arr) => {
                    const isDone = result.tahapSelesai.includes(step.id);
                    const isActive = result.tahapAktif === step.id;
                    const log = result.riwayat.find(r => r.tahap === step.id);
                    const isRet = log?.isKembali === true || log?.isKembali === "TRUE";
                    let dot = "pending";
                    if (isDone) dot = isRet ? "returned" : "done";
                    else if (isActive) dot = "active";

                    return (
                      <div key={step.id} className="timeline-item">
                        <div className="timeline-left">
                          <div className={`timeline-dot ${dot}`}>
                            {isDone && !isRet ? "✓" : isRet ? "↩" : step.icon}
                          </div>
                          {idx !== arr.length - 1 && <div className={`timeline-line ${isDone && !isRet ? "done" : ""}`} />}
                        </div>
                        <div className="timeline-content" style={{ paddingBottom: idx === arr.length - 1 ? 0 : 24 }}>
                          <div className={`timeline-title ${!isDone && !isActive ? "pending" : ""}`}>{step.label}</div>
                          <div className="timeline-subtitle">{step.pelaksana}</div>
                          {log?.catatan && <div className={`timeline-note ${isRet ? "ret" : ""}`}>{bacaCatatan(log.catatan)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}