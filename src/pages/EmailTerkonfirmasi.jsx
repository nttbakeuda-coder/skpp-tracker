import { useEffect } from "react";
import { useAuth } from "../auth.jsx";
import { IcoCheckCircle } from "../components/Icons.jsx";

// Halaman tujuan tautan verifikasi email (emailRedirectTo). Dibuka sebagai TAB
// BARU dari email -> hanya bersifat informasi. Verifikasi email sudah diproses
// Supabase saat token di URL dibaca; di sini kita beri tahu tab lain (tab utama
// tempat pengguna mendaftar) agar otomatis kembali ke beranda, lalu keluarkan
// sesi (akun masih menunggu persetujuan admin). Tidak ada tombol ke beranda —
// pengguna cukup menutup tab ini supaya tak ada dua tab membuka beranda sama.
export default function EmailTerkonfirmasi() {
  const { signOut } = useAuth();
  useEffect(() => {
    try {
      const bc = new BroadcastChannel("skpp-auth");
      bc.postMessage("email-verified");
      bc.close();
    } catch { /* BroadcastChannel tak didukung — pakai fallback storage di bawah */ }
    try {
      // Fallback lintas-tab via event "storage" (nilai unik agar selalu memicu).
      localStorage.setItem("skpp-email-verified", String(Date.now()));
    } catch { /* akses storage bisa gagal (mode privasi) */ }
    signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#64748b", margin: "0 0 22px" }}>
          Alamat email Anda telah terverifikasi. Akun Anda kini menunggu persetujuan
          Administrator sebelum dapat digunakan untuk mengajukan SKPP. Anda akan dapat
          masuk setelah akun disetujui.
        </p>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#475569",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          Silakan tutup tab ini. Halaman pada tab sebelumnya akan otomatis kembali ke beranda.
        </div>
      </div>
    </div>
  );
}
