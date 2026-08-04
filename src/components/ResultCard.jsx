import { tahapanUntuk } from "../data.jsx";
import { getProgress } from "../lacak.js";
import { FormatCatatan } from "../FormatCatatan.jsx";
import { IcoBan, IcoInbox, IcoAlertTriangle, IcoCheckCircle, IcoMail, IcoClock } from "./Icons.jsx";

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
            <span className="badge-kembali" style={{ background: "#fee2e2", color: "#b91c1c" }}><IcoBan size={12} /> Ditolak</span>
          ) : (
            <span className="badge-proses" style={{ background: "#fef3c7", color: "#92400e" }}><IcoClock size={12} /> Menunggu Verifikasi Loket</span>
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
          <IcoBan size={18} />
          <div>
            <strong>Pengajuan Ditolak</strong>
            <br />
            <span style={{ fontSize: 12 }}>
              {p.catatan ? <FormatCatatan raw={p.catatan} /> : "Untuk informasi lebih lanjut, silakan menghubungi Bidang Perbendaharaan."}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="result-alert result-alert-ok">
            <IcoInbox size={18} />
            <div>
              <strong>Pengajuan Diterima</strong>
              <br />
              <span style={{ fontSize: 12 }}>
                Berkas Anda telah tercatat dan berada dalam antrean verifikasi Loket Bidang
                Perbendaharaan.
              </span>
            </div>
          </div>
          {p.catatan && (
            <div className="result-alert result-alert-warn">
              <IcoAlertTriangle size={18} />
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
        Untuk informasi lebih lanjut, silakan menghubungi Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT
        <br />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IcoMail size={12} /> badankeuanganprovntt@gmail.com
        </span>
        &nbsp;·&nbsp;
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IcoClock size={12} /> Senin–Jumat, 08.00–15.00 WITA
        </span>
      </div>
    </>
  );
}

// ── KARTU HASIL PELACAKAN — dipakai beranda (Landing) & Pengajuan Saya ──
// extraOnReturn: node opsional dirender di bawah keterangan pengembalian pada
// tahap yang sedang "kembali" (dipakai Pengajuan Saya utk tombol unggah bukti
// hutang; kosong di beranda publik karena butuh sesi pemilik pengajuan).
export function ResultCard({ p, extraOnReturn, onSurvei }) {
  if (p.status === "diajukan" || p.status === "ditolak") return <ResultCardOnlinePending p={p} />;
  const tahapan = tahapanUntuk(p);
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
      <span className="badge-selesai">Selesai</span>
    ) : p.status === "kembali" ? (
      <span className="badge-kembali">↩ Berkas Dikembalikan</span>
    ) : (
      <span className="badge-proses">⟳ Sedang Diproses</span>
    );

  const meta = [p.opd, p.alasan].filter(Boolean).join(" · ");

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
          <IcoAlertTriangle size={18} />
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
          <IcoCheckCircle size={18} />
          <div>
            <strong>SKPP Telah Selesai</strong>
            <br />
            <span style={{ fontSize: 12 }}>
              {p.tanggalSerahTerima ? (
                <>
                  SKPP telah diserahkan
                  {p.penerimaNama && (
                    <>
                      {" "}
                      kepada <strong>{p.penerimaNama}</strong>
                      {p.penerimaStatus ? ` (${p.penerimaStatus})` : ""}
                    </>
                  )}{" "}
                  pada {p.tanggalSerahTerima}.
                </>
              ) : (
                "SKPP dapat diambil di Loket Bidang Perbendaharaan. Harap membawa identitas diri dan tanda terima pengajuan."
              )}
            </span>
          </div>
        </div>
      )}

      {p.status === "selesai" && onSurvei && (
        p.sudahSurvei ? (
          <div className="result-alert result-alert-ok" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <IcoCheckCircle size={18} />
            <div><strong>Survei layanan telah diisi</strong><br /><span style={{ fontSize: 12 }}>Terima kasih atas penilaian Anda.</span></div>
          </div>
        ) : (
          <div className="result-alert result-alert-warn" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <IcoAlertTriangle size={18} />
              <div>
                <strong>Wajib: Isi Survei Kepuasan Layanan</strong>
                <br />
                <span style={{ fontSize: 12 }}>
                  Sebelum menutup, mohon menilai layanan SKPP Anda (Survei Kepuasan Masyarakat, 9 unsur, anonim).
                </span>
              </div>
            </div>
            <button className="btn btn-gold btn-sm" style={{ alignSelf: "flex-start" }} onClick={onSurvei}>
              Isi Survei Layanan
            </button>
          </div>
        )
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
                    {isRet ? "" : ""}
                    <FormatCatatan raw={log.catatan} />
                  </div>
                )}
                {isLast && isDone && (p.tanggalSerahTerima || p.penerimaNama) && (
                  <div className="tl-note">
                    Diserahkan{p.tanggalSerahTerima ? ` pada ${p.tanggalSerahTerima}` : ""}
                    {p.penerimaNama && (
                      <>
                        {" "}
                        kepada <strong>{p.penerimaNama}</strong>
                        {p.penerimaStatus ? ` (${p.penerimaStatus})` : ""}
                      </>
                    )}
                  </div>
                )}
                {isRet && extraOnReturn}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "var(--g500)", textAlign: "center" }}>
        Untuk informasi lebih lanjut, silakan menghubungi Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT
        <br />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IcoMail size={12} /> badankeuanganprovntt@gmail.com
        </span>
        &nbsp;·&nbsp;
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IcoClock size={12} /> Senin–Jumat, 08.00–15.00 WITA
        </span>
      </div>
    </>
  );
}
