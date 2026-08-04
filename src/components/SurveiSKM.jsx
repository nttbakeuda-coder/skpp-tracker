import { useState } from "react";
import { SKM_UNSUR, SKM_SKALA, kirimSurvei } from "../survei.js";
import { IcoCheckCircle, IcoAlertTriangle } from "./Icons.jsx";

// Form Survei Kepuasan Masyarakat (SKM) — 9 unsur skala 1–4 + saran.
// Dipakai di modal (Pengajuan Saya) & panel hasil lacak publik.
// props: nomor, kode (kredensial pengajuan), tipe ('pemohon'|'bendahara'|null),
//        onDone (dipanggil setelah sukses), namaLayanan (opsional teks).
export function SurveiSKM({ nomor, kode, tipe, onDone }) {
  const [jawaban, setJawaban] = useState({});
  const [saran, setSaran] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showErr, setShowErr] = useState(false);
  const [sukses, setSukses] = useState(false);

  const set = (key, nilai) => setJawaban((j) => ({ ...j, [key]: nilai }));
  const belum = SKM_UNSUR.filter((u) => !jawaban[u.key]).length;

  async function submit() {
    if (belum > 0) {
      setShowErr(true);
      setErr(`Masih ada ${belum} unsur yang belum dinilai.`);
      return;
    }
    setBusy(true);
    setErr("");
    const { ok, error } = await kirimSurvei({ nomor, kode, jawaban, saran, tipe });
    setBusy(false);
    if (!ok) {
      setErr(error);
      return;
    }
    setSukses(true);
  }

  if (sukses) {
    return (
      <div style={{ textAlign: "center", padding: "16px 8px" }}>
        <div style={{ display: "flex", justifyContent: "center", color: "#059669" }}><IcoCheckCircle size={44} /></div>
        <h3 style={{ margin: "12px 0 4px", fontSize: 18, fontWeight: 800, color: "var(--navy)" }}>Terima kasih!</h3>
        <p style={{ fontSize: 13, color: "var(--g500)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
          Penilaian Anda telah kami terima dan menjadi bahan perbaikan layanan SKPP.
        </p>
        {onDone && (
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={onDone}>Selesai</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="p-alert p-alert-info" style={{ marginBottom: 14 }}>
        <IcoCheckCircle size={16} />
        <div>
          Survei Kepuasan Masyarakat (SKM) sesuai Permenpan-RB No. 14 Tahun 2017. Nilai
          <strong> 9 unsur</strong> layanan di bawah ini. Jawaban bersifat <strong>anonim</strong>.
        </div>
      </div>

      {showErr && err && (
        <div className="p-alert p-alert-err" style={{ marginBottom: 12 }}>
          <IcoAlertTriangle size={16} /><div>{err}</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SKM_UNSUR.map((u, i) => {
          const belumIni = showErr && !jawaban[u.key];
          return (
            <div
              key={u.key}
              style={{
                border: "1px solid " + (belumIni ? "#fecaca" : "var(--g200)"),
                background: belumIni ? "#fef2f2" : "#fff",
                borderRadius: 10, padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--teal)", flexShrink: 0 }}>{i + 1}.</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--navy)" }}>{u.judul}</div>
                  <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 1, lineHeight: 1.4 }}>{u.tanya}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 10 }}>
                {SKM_SKALA.map((s) => {
                  const aktif = jawaban[u.key] === s.nilai;
                  return (
                    <button
                      key={s.nilai}
                      type="button"
                      onClick={() => set(u.key, s.nilai)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                        border: "1.5px solid " + (aktif ? s.warna : "var(--g200)"),
                        background: aktif ? s.warna : "#fff",
                        color: aktif ? "#fff" : "var(--g600)",
                        fontWeight: aktif ? 800 : 600, fontSize: 11.5, transition: "all .12s",
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{s.nilai}</span>
                      <span style={{ fontSize: 10.5, lineHeight: 1.15, textAlign: "center" }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Saran / Masukan (opsional)</label>
        <textarea
          value={saran}
          onChange={(e) => setSaran(e.target.value)}
          rows={3}
          placeholder="Tuliskan saran untuk perbaikan layanan…"
          maxLength={1000}
        />
      </div>

      {err && !showErr && (
        <div className="p-alert p-alert-err" style={{ marginTop: 4 }}>
          <IcoAlertTriangle size={16} /><div>{err}</div>
        </div>
      )}

      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy} onClick={submit}>
        {busy ? "⟳ Mengirim…" : "Kirim Penilaian"}
      </button>
    </div>
  );
}
