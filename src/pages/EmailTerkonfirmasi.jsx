import { Link } from "react-router-dom";
import { IcoCheckCircle } from "../components/Icons.jsx";

// Halaman tujuan tautan verifikasi email (emailRedirectTo). Pemohon baru selesai
// mengonfirmasi alamat email -> tampilkan konfirmasi sederhana + status menunggu
// persetujuan admin, bukan langsung dilempar ke beranda.
export default function EmailTerkonfirmasi() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#f1f5f9",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(15,42,94,.12)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#ecfdf5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <IcoCheckCircle size={40} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f2f5e", margin: "0 0 10px" }}>
          Email Berhasil Dikonfirmasi
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#64748b", margin: "0 0 26px" }}>
          Alamat email Anda telah terverifikasi. Akun Anda kini menunggu persetujuan
          Administrator sebelum dapat digunakan untuk mengajukan SKPP. Anda akan dapat
          masuk setelah akun disetujui.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            background: "#0f2f5e",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
