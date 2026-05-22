import { useState, useEffect, useCallback } from "react";

// ============================================================
//  GANTI URL INI dengan URL deployment Apps Script Anda
//  (didapat setelah deploy sebagai Web App di Apps Script)
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbxdSGg9F6P4FpNJsr3jhVklVKTqxFjepQbs4mHblDDv2ySMXD8nkZfrhMcEgz8IcPOoeA/exec";

// ─── DATA DEFINITIONS ────────────────────────────────────────
const JALUR = { A: "Jalur A – Tanpa Pangkat Pengabdian", B: "Jalur B – Ada Pangkat Pengabdian" };

const TAHAPAN_A = [
  { id: "A1", label: "Berkas Diterima di Loket", icon: "📥", pelaksana: "Staf Pengampuh OPD", keterangan: "Berkas pengajuan SKPP diterima dan dicatat dalam buku register." },
  { id: "A2", label: "Verifikasi Kelengkapan Berkas", icon: "🔍", pelaksana: "Staf Pengampuh OPD", keterangan: "Pemeriksaan kelengkapan dan kesesuaian dokumen persyaratan." },
  { id: "A3", label: "Verifikasi Data PNS", icon: "👤", pelaksana: "Staf Pengampuh OPD", keterangan: "Validasi data PNS (NIP, pangkat, gaji terakhir) dan konfirmasi tidak ada pangkat pengabdian." },
  { id: "A4", label: "Pembuatan Draft SKPP", icon: "📝", pelaksana: "Penyusun SKPP", keterangan: "Penyusunan draft SKPP berdasarkan data yang telah diverifikasi." },
  { id: "A5", label: "Pemeriksaan & Paraf Kasubid", icon: "✅", pelaksana: "Staf Pengampuh OPD → Kasubid", keterangan: "Pemeriksaan oleh Staf Pengampuh OPD, paraf Kasubid & TTD Kuasa BUD diproses internal." },
  { id: "A6", label: "Penempelan Foto & Penomoran", icon: "📸", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "Penempelan foto PNS, penomoran SKPP, dan cap dinas." },
  { id: "A7", label: "SKPP Siap Diserahkan", icon: "🎉", pelaksana: "Staf Pengampuh OPD", keterangan: "SKPP telah selesai dan siap diambil oleh pemohon/Bendahara Gaji OPD.", final: true },
];

const TAHAPAN_B = [
  { id: "B1", label: "Berkas Diterima di Loket", icon: "📥", pelaksana: "Staf Pengampuh OPD", keterangan: "Berkas pengajuan SKPP termasuk SK Pangkat Pengabdian diterima dan dicatat." },
  { id: "B2", label: "Verifikasi Kelengkapan Berkas", icon: "🔍", pelaksana: "Staf Pengampuh OPD", keterangan: "Pemeriksaan kelengkapan dokumen persyaratan." },
  { id: "B3", label: "Identifikasi Pangkat Pengabdian", icon: "🏅", pelaksana: "Staf Pengampuh OPD", keterangan: "Konfirmasi adanya pangkat pengabdian, berkas diteruskan ke Operator SIMgaji." },
  { id: "B4", label: "Perhitungan Kekurangan (SIMgaji)", icon: "🖥️", pelaksana: "Operator SIMgaji", keterangan: "Input data dan perhitungan kekurangan selisih kenaikan pangkat pada aplikasi SIMgaji Taspen." },
  { id: "B5", label: "Rincian Kekurangan → Bendahara OPD", icon: "📤", pelaksana: "Operator SIMgaji / Staf Pengampuh", keterangan: "Dokumen rincian kekurangan pangkat diserahkan ke Bendahara Gaji OPD untuk dibuatkan SPP-SPM." },
  { id: "B6", label: "SPP-SPM Diterima dari OPD", icon: "📋", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "SPP-SPM Kekurangan Pangkat diterima dan diverifikasi." },
  { id: "B7", label: "Proses SP2D Kekurangan Pangkat", icon: "💳", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "SP2D diterbitkan dan kekurangan pangkat dibayarkan ke rekening PNS." },
  { id: "B8", label: "Pembuatan Draft SKPP", icon: "📝", pelaksana: "Penyusun SKPP", keterangan: "Draft SKPP disusun berdasarkan pangkat baru (pangkat pengabdian)." },
  { id: "B9", label: "Pemeriksaan & Paraf Kasubid", icon: "✅", pelaksana: "Staf Pengampuh OPD → Kasubid", keterangan: "Pemeriksaan oleh Staf Pengampuh OPD, paraf Kasubid & TTD Kuasa BUD diproses internal." },
  { id: "B10", label: "Penempelan Foto & Penomoran", icon: "📸", pelaksana: "Staf Bidang Perbendaharaan", keterangan: "Penempelan foto PNS, penomoran SKPP, dan cap dinas." },
  { id: "B11", label: "SKPP Siap Diserahkan", icon: "🎉", pelaksana: "Staf Pengampuh OPD", keterangan: "SKPP telah selesai dan siap diambil oleh pemohon/Bendahara Gaji OPD.", final: true },
];

// ─── API CALLS ───────────────────────────────────────────────
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── HELPERS ─────────────────────────────────────────────────
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

// ─── STYLES ──────────────────────────────────────────────────
const S = `
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
  .navbar{background:var(--navy);padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,.2);}
  .navbar-logo{width:32px;height:32px;background:var(--blue);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .navbar-title{color:white;font-weight:700;font-size:15px;}
  .navbar-sub{color:#94a3b8;font-size:11px;}
  .nav-tabs{display:flex;gap:4px;}
  .nav-tab{padding:7px 16px;border-radius:7px;border:none;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:600;transition:all .15s;}
  .nav-tab.active{background:var(--blue);color:white;}
  .nav-tab:not(.active){background:rgba(255,255,255,.08);color:#94a3b8;}
  .nav-tab:not(.active):hover{background:rgba(255,255,255,.15);color:white;}
  .container{max-width:1200px;margin:0 auto;padding:28px 20px;}
  .container-sm{max-width:720px;margin:0 auto;padding:28px 20px;}
  .card{background:white;border-radius:var(--r);box-shadow:var(--shadow);border:1px solid var(--g200);}
  .card-header{padding:18px 22px;border-bottom:1px solid var(--g100);display:flex;align-items:center;justify-content:space-between;}
  .card-body{padding:22px;}
  .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;}
  .badge-blue{background:#dbeafe;color:#1d4ed8;}
  .badge-green{background:#d1fae5;color:#065f46;}
  .badge-amber{background:#fef3c7;color:#92400e;}
  .progress-wrap{background:var(--g100);border-radius:999px;height:6px;overflow:hidden;}
  .progress-bar{height:100%;border-radius:999px;transition:width .5s ease;}
  .search-wrap{position:relative;}
  .search-input{width:100%;padding:11px 16px 11px 42px;border:1.5px solid var(--g200);border-radius:var(--rs);font-family:var(--font);font-size:14px;background:white;color:var(--g800);transition:border-color .15s;outline:none;}
  .search-input:focus{border-color:var(--blue-light);}
  .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--g400);font-size:15px;pointer-events:none;}
  .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--rs);font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;border:none;}
  .btn-primary{background:var(--blue);color:white;}
  .btn-primary:hover{background:#1e40af;}
  .btn-secondary{background:var(--g100);color:var(--g700);}
  .btn-secondary:hover{background:var(--g200);}
  .btn-success{background:#059669;color:white;}
  .btn-success:hover{background:#047857;}
  .btn-sm{padding:6px 12px;font-size:12px;}
  .btn:disabled{opacity:.5;cursor:not-allowed;}
  .timeline{position:relative;}
  .timeline-item{display:flex;gap:16px;position:relative;}
  .timeline-item:not(:last-child){padding-bottom:24px;}
  .timeline-left{display:flex;flex-direction:column;align-items:center;width:36px;flex-shrink:0;}
  .timeline-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;position:relative;z-index:1;border:2.5px solid transparent;}
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
  .table-wrap{overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:var(--g50);padding:11px 14px;text-align:left;font-weight:700;color:var(--g600);font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid var(--g200);white-space:nowrap;}
  td{padding:13px 14px;border-bottom:1px solid var(--g100);color:var(--g700);vertical-align:middle;}
  tr:hover td{background:var(--g50);cursor:pointer;}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:12px;font-weight:700;color:var(--g600);margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;}
  .form-control{width:100%;padding:10px 14px;border:1.5px solid var(--g200);border-radius:var(--rs);font-family:var(--font);font-size:14px;color:var(--g800);transition:border-color .15s;outline:none;background:white;}
  .form-control:focus{border-color:var(--blue-light);}
  select.form-control{cursor:pointer;}
  textarea.form-control{resize:vertical;min-height:80px;}
  .modal-overlay{position:fixed;inset:0;background:rgba(15,30,60,.5);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;z-index:1000;padding:20px;overflow-y:auto;}
  .modal{background:white;border-radius:16px;width:100%;max-width:700px;box-shadow:0 20px 60px rgba(0,0,0,.2);margin:auto;animation:slideUp .2s ease;}
  .modal-header{padding:22px 26px;border-bottom:1px solid var(--g100);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  .modal-body{padding:24px 26px;max-height:70vh;overflow-y:auto;}
  .modal-footer{padding:16px 26px;border-top:1px solid var(--g100);display:flex;gap:10px;justify-content:flex-end;}
  .modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:var(--g400);padding:4px;border-radius:6px;}
  .modal-close:hover{background:var(--g100);}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .stat-card{background:white;border-radius:var(--r);padding:20px;border:1px solid var(--g200);box-shadow:var(--shadow);}
  .stat-number{font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1;}
  .stat-label{font-size:12px;color:var(--g500);font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:.4px;}
  .hero{background:linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 100%);padding:40px 24px;text-align:center;color:white;}
  .hero h1{font-size:26px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px;}
  .hero p{color:#94a3b8;font-size:14px;}
  .hero-search-wrap{max-width:500px;margin:24px auto 0;position:relative;}
  .hero-search-input{width:100%;padding:14px 20px;padding-right:110px;border:none;border-radius:12px;font-family:var(--font);font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.2);outline:none;color:var(--g800);}
  .hero-search-btn{position:absolute;right:6px;top:6px;padding:8px 16px;background:var(--blue);color:white;border:none;border-radius:8px;font-family:var(--font);font-weight:700;font-size:13px;cursor:pointer;}
  .hero-search-btn:hover{background:#1e40af;}
  .alert{padding:12px 16px;border-radius:var(--rs);margin-bottom:16px;font-size:13px;display:flex;gap:10px;align-items:flex-start;}
  .alert-amber{background:#fffbeb;border:1px solid #fde68a;color:#92400e;}
  .alert-blue{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;}
  .alert-green{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;}
  .alert-red{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;}
  .info-row{display:flex;gap:8px;align-items:baseline;margin-bottom:8px;}
  .info-label{font-size:11px;color:var(--g500);font-weight:700;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;min-width:100px;}
  .info-value{font-size:13px;color:var(--g800);font-weight:500;}
  .chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;background:var(--g100);color:var(--g600);}
  .chip-blue{background:#dbeafe;color:#1e40af;}
  .chip-green{background:#d1fae5;color:#065f46;}
  .step-btn{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:var(--rs);border:1.5px solid var(--g200);background:white;font-family:var(--font);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;width:100%;text-align:left;margin-bottom:8px;}
  .step-btn.active-step{border-color:var(--blue);background:var(--blue-pale);color:var(--blue);}
  .step-btn.done-step{border-color:#059669;background:#ecfdf5;color:#065f46;cursor:default;}
  .step-btn.wait-step{opacity:.4;cursor:not-allowed;}
  .loading-overlay{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px;color:var(--g500);}
  .spinner{width:32px;height:32px;border:3px solid var(--g200);border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @media(max-width:600px){.grid-2{grid-template-columns:1fr;}.stat-grid{grid-template-columns:1fr 1fr !important;}}
`;

// ─── COMPONENTS ──────────────────────────────────────────────

function Spinner({ text = "Memuat data..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span style={{ fontSize: 13 }}>{text}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "selesai") return <span className="badge badge-green">✓ Selesai</span>;
  if (status === "kembali") return <span className="badge badge-amber">↩ Dikembalikan</span>;
  return <span className="badge badge-blue">⟳ Sedang Diproses</span>;
}

function TrackingTimeline({ pengajuan }) {
  const tahapan = pengajuan.jalur === "A" ? TAHAPAN_A : TAHAPAN_B;
  const selesai = pengajuan.tahapSelesai || [];
  const riwayat = pengajuan.riwayat || [];

  return (
    <div className="timeline">
      {tahapan.map((step, idx) => {
        const isDone = selesai.includes(step.id);
        const isActive = pengajuan.tahapAktif === step.id;
        const isLast = idx === tahapan.length - 1;
        const log = riwayat.find(r => r.tahap === step.id);
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
              {!isLast && <div className={`timeline-line ${isDone && !isRet ? "done" : ""}`} />}
            </div>
            <div className="timeline-content" style={{ paddingBottom: isLast ? 0 : 24 }}>
              <div className={`timeline-title ${!isDone && !isActive ? "pending" : ""}`}>{step.label}</div>
              <div className="timeline-subtitle">{step.pelaksana}</div>
              {isActive && !isDone && <span className="badge badge-blue" style={{ marginBottom: 6 }}>Sedang diproses</span>}
              {log && <div className="timeline-time">{log.waktu}</div>}
              {log?.catatan && <div className={`timeline-note ${isRet ? "ret" : ""}`}>{isRet ? "⚠️ " : ""}{log.catatan}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── VIEW PUBLIK ─────────────────────────────────────────────
function PublikView() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const res = await apiGet({ action: "lacak", query: query.trim() });
      if (res.ok) setResult(normalizeP(res.data));
      else setErr(res.pesan || "Data tidak ditemukan.");
    } catch {
      setErr("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    }
    setLoading(false);
  };

  const prog = result ? getProgress(result) : 0;

  return (
    <div>
      <div className="hero">
        <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
        <h1>Lacak Status Pengajuan SKPP</h1>
        <p>Masukkan Nomor Pengajuan atau NIP untuk melacak status SKPP Anda</p>
        <div className="hero-search-wrap">
          <input className="hero-search-input" placeholder="Contoh: SKPP-2025-0042 atau NIP Anda"
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <button className="hero-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? "⟳" : "Lacak →"}
          </button>
        </div>
      </div>

      <div className="container-sm">
        {loading && <div style={{ marginTop: 32 }}><Spinner text="Mencari data pengajuan..." /></div>}

        {err && !loading && (
          <div className="alert alert-amber" style={{ marginTop: 24 }}>
            <span>⚠️</span>
            <div><strong>Data tidak ditemukan</strong><br />{err}</div>
          </div>
        )}

        {result && !loading && (
          <div style={{ marginTop: 24 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-body">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:"var(--g500)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", marginBottom:4 }}>Nomor Pengajuan</div>
                    <div style={{ fontSize:20, fontWeight:800, fontFamily:"var(--mono)", color:"var(--navy)", letterSpacing:"-.5px" }}>{result.id}</div>
                  </div>
                  <StatusBadge status={result.status} />
                </div>
                <div style={{ background:"var(--g50)", borderRadius:"var(--rs)", padding:"14px 16px", marginBottom:16 }}>
                  {[["Nama", result.nama, true], ["NIP", result.nip], ["Instansi", result.opd], ["Keperluan", result.alasan], ["Tanggal Masuk", result.tanggalMasuk]].map(([l, v, bold]) => (
                    <div key={l} className="info-row">
                      <span className="info-label">{l}</span>
                      <span className="info-value" style={bold ? { fontWeight:700 } : {}}>{v}</span>
                    </div>
                  ))}
                  {result.status === "selesai"
                    ? <div className="info-row"><span className="info-label">Tgl Selesai</span><span className="info-value" style={{ color:"var(--green)", fontWeight:700 }}>{result.tanggalSelesai}</span></div>
                    : <div className="info-row"><span className="info-label">Est. Selesai</span><span className="info-value">{result.estimasiSelesai}</span></div>}
                  {result.nomorSKPP && <div className="info-row"><span className="info-label">No. SKPP</span><span className="info-value" style={{ color:"var(--green)", fontWeight:700, fontFamily:"var(--mono)" }}>{result.nomorSKPP}</span></div>}
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

            {result.status === "kembali" && result.catatan && (
              <div className="alert alert-amber" style={{ marginBottom:20 }}>
                <span>⚠️</span>
                <div><strong>Berkas Perlu Dilengkapi</strong><br />{result.catatan}<br />
                  <span style={{ fontSize:12, marginTop:4, display:"block" }}>Segera lengkapi dan serahkan kembali ke Loket Bidang Perbendaharaan.</span>
                </div>
              </div>
            )}
            {result.status === "selesai" && (
              <div className="alert alert-green" style={{ marginBottom:20 }}>
                <span>🎉</span>
                <div><strong>SKPP Telah Selesai!</strong><br />
                  <span style={{ fontSize:13 }}>SKPP dapat diambil di Loket Bidang Perbendaharaan. Harap membawa identitas diri.</span>
                </div>
              </div>
            )}
            <div className="card">
              <div className="card-header">
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:"var(--navy)" }}>Riwayat Proses</div>
                  <div style={{ fontSize:12, color:"var(--g500)", marginTop:2 }}>{JALUR[result.jalur]}</div>
                </div>
              </div>
              <div className="card-body"><TrackingTimeline pengajuan={result} /></div>
            </div>
            <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"var(--g400)" }}>
              Butuh bantuan? Hubungi Bidang Perbendaharaan<br />📞 (0xxx) xxxx-xxxx &nbsp;|&nbsp; 🕐 Senin–Jumat, 08.00–15.00 WIB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VIEW STAF ───────────────────────────────────────────────
function StafView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errLoad, setErrLoad] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUpdate, setShowUpdate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErrLoad("");
    try {
      const res = await apiGet({ action: "daftarSemua" });
      if (res.ok) setData(res.data.map(normalizeP));
      else setErrLoad(res.pesan);
    } catch {
      setErrLoad("Gagal memuat data. Periksa koneksi atau URL Apps Script.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleInputBaru = async (formData) => {
    setSaving(true);
    try {
      const res = await apiPost({ action: "inputBaru", data: formData });
      if (res.ok) { showToast(`✓ ${res.id} berhasil disimpan`); setShowForm(false); load(); }
      else alert("Gagal menyimpan: " + res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const handleUpdateTahap = async ({ pengajuanId, stepId, catatan, isKembali, jalur }) => {
    const tahapan = jalur === "A" ? TAHAPAN_A : TAHAPAN_B;
    const stepIdx = tahapan.findIndex(t => t.id === stepId);
    const isFinal = tahapan[stepIdx]?.final || false;
    const nextStepId = tahapan[stepIdx + 1]?.id || "";

    setSaving(true);
    try {
      const res = await apiPost({ action: "updateTahap", data: { pengajuanId, stepId, catatan, isKembali, jalur, isFinal, nextStepId } });
      if (res.ok) {
        showToast(isKembali ? "↩ Berkas dikembalikan" : "✓ Tahap berhasil diperbarui");
        setShowUpdate(null);
        await load();
        // Refresh selected
        const refreshed = await apiGet({ action: "detail", id: pengajuanId });
        if (refreshed.ok) setSelected(normalizeP(refreshed.data));
      } else alert("Gagal: " + res.pesan);
    } catch { alert("Gagal terhubung ke server."); }
    setSaving(false);
  };

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    const matchS = !q || p.id?.toLowerCase().includes(q) || p.nama?.toLowerCase().includes(q) || p.nip?.toString().includes(q) || p.opd?.toLowerCase().includes(q);
    const matchF = filterStatus === "semua" || p.status === filterStatus;
    return matchS && matchF;
  });

  const stats = { total: data.length, proses: data.filter(d=>d.status==="proses").length, selesai: data.filter(d=>d.status==="selesai").length, kembali: data.filter(d=>d.status==="kembali").length };

  return (
    <div className="container">
      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, background:"var(--navy)", color:"white", padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.3)", animation:"slideUp .2s ease" }}>
          {toast}
        </div>
      )}

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }} className="stat-grid">
        {[["Total", stats.total, "var(--navy)"], ["Diproses", stats.proses, "var(--blue)"], ["Selesai", stats.selesai, "#059669"], ["Dikembalikan", stats.kembali, "#d97706"]].map(([l,v,c]) => (
          <div key={l} className="stat-card">
            <div className="stat-number" style={{ color:c }}>{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      {errLoad && (
        <div className="alert alert-red" style={{ marginBottom:20 }}>
          <span>❌</span>
          <div><strong>Gagal memuat data</strong><br />{errLoad}<br />
            <button className="btn btn-secondary btn-sm" style={{ marginTop:8 }} onClick={load}>Coba Lagi</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div style={{ fontWeight:800, fontSize:16, color:"var(--navy)" }}>Daftar Pengajuan SKPP</div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>⟳ Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Input Baru</button>
          </div>
        </div>
        <div style={{ padding:"16px 22px", borderBottom:"1px solid var(--g100)", display:"flex", gap:12, flexWrap:"wrap" }}>
          <div className="search-wrap" style={{ flex:1, minWidth:220 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Cari nama, NIP, nomor, OPD..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width:"auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="semua">Semua Status</option>
            <option value="proses">Sedang Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="kembali">Dikembalikan</option>
          </select>
        </div>
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Pengajuan</th><th>Nama PNS</th><th>NIP</th><th>OPD</th>
                  <th>Keperluan</th><th>Jalur</th><th>Progress</th><th>Status</th><th>Tgl Masuk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const prog = getProgress(p);
                  return (
                    <tr key={p.id} onClick={() => setSelected(p)}>
                      <td style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:"var(--blue)" }}>{p.id}</td>
                      <td style={{ fontWeight:600 }}>{p.nama}</td>
                      <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--g500)" }}>{p.nip}</td>
                      <td style={{ fontSize:12 }}>{p.opd}</td>
                      <td><span className="chip">{p.alasan}</span></td>
                      <td><span className={`chip ${p.jalur==="A"?"chip-blue":"chip-green"}`}>Jalur {p.jalur}</span></td>
                      <td style={{ width:120 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div className="progress-wrap" style={{ flex:1 }}>
                            <div className="progress-bar" style={{ width:`${prog}%`, background: prog===100?"var(--green)":p.status==="kembali"?"var(--amber)":"var(--blue)" }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color:"var(--g500)", minWidth:30 }}>{prog}%</span>
                        </div>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td style={{ fontSize:12, color:"var(--g500)" }}>{p.tanggalMasuk}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:"var(--g400)" }}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) setSelected(null); }}>
          <div className="modal" style={{ maxWidth:800 }}>
            <div className="modal-header">
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--blue)", fontWeight:700, marginBottom:2 }}>{selected.id}</div>
                <div style={{ fontWeight:800, fontSize:18, color:"var(--navy)" }}>{selected.nama}</div>
                <div style={{ fontSize:13, color:"var(--g500)", marginTop:2 }}>{selected.opd} · {selected.alasan} · {JALUR[selected.jalur]}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <StatusBadge status={selected.status} />
                <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ background:"var(--g50)", borderRadius:"var(--rs)", padding:"14px 16px", marginBottom:20 }}>
                <div className="grid-2" style={{ gap:8 }}>
                  {[["NIP", selected.nip, true], ["Jabatan", selected.jabatan], ["Pangkat", selected.pangkat], ["Tgl Masuk", selected.tanggalMasuk]].map(([l,v,mono]) => (
                    <div key={l} className="info-row">
                      <span className="info-label">{l}</span>
                      <span className="info-value" style={mono ? { fontFamily:"var(--mono)", fontSize:12 } : {}}>{v}</span>
                    </div>
                  ))}
                  {selected.nomorSKPP && <div className="info-row"><span className="info-label">No. SKPP</span><span className="info-value" style={{ color:"var(--green)", fontWeight:700 }}>{selected.nomorSKPP}</span></div>}
                </div>
              </div>

              {selected.status !== "selesai" && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"var(--g700)", marginBottom:10 }}>Update Tahap Proses</div>
                  {(selected.jalur === "A" ? TAHAPAN_A : TAHAPAN_B).map(step => {
                    const isDone = selected.tahapSelesai.includes(step.id);
                    const isActive = selected.tahapAktif === step.id;
                    let cls = "step-btn wait-step";
                    if (isDone) cls = "step-btn done-step";
                    else if (isActive) cls = "step-btn active-step";
                    return (
                      <button key={step.id} className={cls}
                        onClick={() => isActive && !isDone && setShowUpdate({ pengajuanId: selected.id, step, jalur: selected.jalur })}
                        disabled={!isActive || isDone}>
                        <span>{isDone ? "✓" : step.icon}</span>
                        <span style={{ flex:1 }}>{step.label}</span>
                        {isDone && <span style={{ fontSize:11, color:"#059669" }}>Selesai</span>}
                        {isActive && !isDone && <span style={{ fontSize:11, background:"var(--blue)", color:"white", padding:"2px 8px", borderRadius:999 }}>Update →</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ fontWeight:700, fontSize:13, color:"var(--g700)", marginBottom:14 }}>Riwayat Lengkap</div>
              <TrackingTimeline pengajuan={selected} />
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {showUpdate && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget && !saving) setShowUpdate(null); }}>
          <div className="modal" style={{ maxWidth:480 }}>
            <UpdateModal step={showUpdate.step} pengajuanId={showUpdate.pengajuanId} jalur={showUpdate.jalur}
              saving={saving} onClose={() => !saving && setShowUpdate(null)} onSubmit={handleUpdateTahap} />
          </div>
        </div>
      )}

      {/* INPUT BARU MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget && !saving) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth:560 }}>
            <InputModal saving={saving} onClose={() => !saving && setShowForm(false)} onSave={handleInputBaru} />
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateModal({ step, pengajuanId, jalur, saving, onClose, onSubmit }) {
  const [catatan, setCatatan] = useState("");
  const [isKembali, setIsKembali] = useState(false);
  return (
    <>
      <div className="modal-header">
        <div>
          <div style={{ fontWeight:800, fontSize:16, color:"var(--navy)" }}>Update Tahap Proses</div>
          <div style={{ fontSize:13, color:"var(--g500)", marginTop:2 }}>{step.icon} {step.label}</div>
        </div>
        <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
      </div>
      <div className="modal-body">
        <div className="alert alert-blue" style={{ marginBottom:16 }}>
          <span>ℹ️</span>
          <div style={{ fontSize:12 }}><strong>Pelaksana:</strong> {step.pelaksana}<br />{step.keterangan}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Catatan Proses</label>
          <textarea className="form-control" placeholder="Tuliskan catatan proses pada tahap ini..." value={catatan} onChange={e => setCatatan(e.target.value)} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:"var(--rs)", cursor:"pointer" }}
          onClick={() => setIsKembali(!isKembali)}>
          <input type="checkbox" checked={isKembali} readOnly style={{ width:16, height:16 }} />
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#92400e" }}>Kembalikan Berkas</div>
            <div style={{ fontSize:12, color:"#b45309" }}>Berkas tidak lengkap/sesuai dan perlu dikembalikan</div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
        <button className={`btn ${isKembali ? "" : "btn-success"}`}
          style={isKembali ? { background:"#d97706", color:"white" } : {}}
          disabled={saving}
          onClick={() => onSubmit({ pengajuanId, stepId: step.id, catatan: catatan || step.keterangan, isKembali, jalur })}>
          {saving ? "⟳ Menyimpan..." : isKembali ? "↩ Kembalikan Berkas" : "✓ Tandai Selesai"}
        </button>
      </div>
    </>
  );
}

function InputModal({ saving, onClose, onSave }) {
  const [form, setForm] = useState({ nama:"", nip:"", opd:"", jabatan:"", pangkat:"", alasan:"Pensiun", jalur:"A" });
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  return (
    <>
      <div className="modal-header">
        <div style={{ fontWeight:800, fontSize:16, color:"var(--navy)" }}>Input Pengajuan SKPP Baru</div>
        <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
      </div>
      <div className="modal-body">
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Nama Lengkap *</label><input className="form-control" value={form.nama} onChange={e=>set("nama",e.target.value)} placeholder="Nama sesuai SK" /></div>
          <div className="form-group"><label className="form-label">NIP *</label><input className="form-control" value={form.nip} onChange={e=>set("nip",e.target.value)} placeholder="18 digit NIP" style={{ fontFamily:"var(--mono)" }} /></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label className="form-label">OPD / Instansi *</label><input className="form-control" value={form.opd} onChange={e=>set("opd",e.target.value)} placeholder="Nama OPD" /></div>
          <div className="form-group"><label className="form-label">Jabatan Terakhir</label><input className="form-control" value={form.jabatan} onChange={e=>set("jabatan",e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Pangkat / Golongan</label><input className="form-control" value={form.pangkat} onChange={e=>set("pangkat",e.target.value)} placeholder="Contoh: Pembina / IV-a" /></div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Keperluan</label>
            <select className="form-control" value={form.alasan} onChange={e=>set("alasan",e.target.value)}>
              <option>Pensiun</option><option>Berhenti Atas Permintaan Sendiri</option><option>Pindah</option><option>Meninggal Dunia</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Jalur Proses</label>
            <select className="form-control" value={form.jalur} onChange={e=>set("jalur",e.target.value)}>
              <option value="A">Jalur A – Tanpa Pangkat Pengabdian</option>
              <option value="B">Jalur B – Ada Pangkat Pengabdian</option>
            </select>
          </div>
        </div>
        {form.jalur==="B" && <div className="alert alert-amber"><span>ℹ️</span><div style={{ fontSize:12 }}>Jalur B memerlukan proses kekurangan pangkat via SIMgaji dan SP2D sebelum SKPP dibuat.</div></div>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
        <button className="btn btn-primary" disabled={saving || !form.nama || !form.nip || !form.opd}
          onClick={() => onSave(form)}>
          {saving ? "⟳ Menyimpan..." : "Simpan & Mulai Proses"}
        </button>
      </div>
    </>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("publik");
  return (
    <>
      <style>{S}</style>
      <div className="app">
        <nav className="navbar">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="navbar-logo">📄</div>
            <div>
              <div className="navbar-title">SKPP Tracker</div>
              <div className="navbar-sub">Bidang Perbendaharaan – BPKD</div>
            </div>
          </div>
          <div className="nav-tabs">
            <button className={`nav-tab ${view==="publik"?"active":""}`} onClick={() => setView("publik")}>🔍 Lacak Status</button>
            <button className={`nav-tab ${view==="staf"?"active":""}`} onClick={() => setView("staf")}>🗂️ Dashboard Staf</button>
          </div>
        </nav>
        <main style={{ flex:1 }}>
          {view==="publik" ? <PublikView /> : <StafView />}
        </main>
        <footer style={{ background:"var(--navy)", color:"#64748b", textAlign:"center", padding:14, fontSize:12 }}>
          © 2025 Bidang Perbendaharaan – BPKD &nbsp;|&nbsp; SKPP Tracker v1.0
        </footer>
      </div>
    </>
  );
}
