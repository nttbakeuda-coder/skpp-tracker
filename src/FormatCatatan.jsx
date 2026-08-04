import { Fragment } from "react";
import { fmtTgl } from "./lacak.js";

// Catatan pengembalian dari dashboard tersimpan sebagai JSON "Formulir Kembali".
// Di modul pelacakan cukup tampilkan ALASAN pengembalian, bukan seluruh formulir.
// React meng-escape teks otomatis, jadi tidak perlu escHtml manual.
export function FormatCatatan({ raw }) {
  if (!raw) return null;
  let d;
  try {
    d = JSON.parse(raw);
  } catch {
    return <>{raw}</>;
  }
  if (!d || d._type !== "FORMULIR_KEMBALI") return <>{raw}</>;

  const nodes = [<strong key="h">Berkas dikembalikan untuk dilengkapi.</strong>];

  const alasan = [];
  if (d.alasan && d.alasan.dokumen) alasan.push("Dokumen persyaratan belum lengkap");
  if (d.alasan && d.alasan.hutang)
    alasan.push("Terdapat hutang/kewajiban finansial yang belum diselesaikan");
  if (alasan.length) {
    nodes.push(
      <Fragment key="al">
        <br />
        Alasan: {alasan.join("; ")}.
      </Fragment>
    );
  }

  const docs = (d.rincian || []).filter((r) => r && r.dokumen);
  if (docs.length) {
    nodes.push(
      <Fragment key="dh">
        <br />
        Dokumen yang perlu dilengkapi:
      </Fragment>
    );
    docs.forEach((r, i) =>
      nodes.push(
        <Fragment key={"d" + i}>
          <br />• {r.dokumen}
          {r.batas ? ` (paling lambat ${fmtTgl(r.batas)})` : ""}
          {r.tindakan ? (
            <>
              <br />
              &nbsp;&nbsp;Keterangan: {r.tindakan}
            </>
          ) : (
            ""
          )}
        </Fragment>
      )
    );
  }

  const hut = (d.rincianHutang || []).filter((r) => r && r.jenis);
  if (hut.length) {
    nodes.push(
      <Fragment key="hh">
        <br />
        Kewajiban yang harus diselesaikan:
      </Fragment>
    );
    hut.forEach((r, i) =>
      nodes.push(
        <Fragment key={"h" + i}>
          <br />• {r.jenis}
          {r.batas ? ` (paling lambat ${fmtTgl(r.batas)})` : ""}
        </Fragment>
      )
    );
  }

  // Nominal hutang: jika dihitung Staf Pengampu OPD tampilkan angkanya; jika
  // dihitung Bendahara OPD arahkan pemohon menghubungi Bendahara OPD.
  if (d.alasan && d.alasan.hutang) {
    const mek = d.mekanisme || {};
    if (mek.penghitung === "pengampu" && mek.jumlah) {
      nodes.push(
        <Fragment key="nm">
          <br />
          Nominal hutang yang harus diselesaikan:{" "}
          <strong>Rp {Number(mek.jumlah).toLocaleString("id-ID")}</strong>.
        </Fragment>
      );
    } else if (mek.penghitung === "bendahara") {
      nodes.push(
        <Fragment key="nb">
          <br />
          Nominal hutang dihitung oleh Bendahara OPD. Silakan hubungi Bendahara OPD.
        </Fragment>
      );
    }
  }

  return <>{nodes}</>;
}
