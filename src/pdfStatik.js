// Buka berkas PDF statis dari folder public/ (regulasi & panduan). Berkas
// dicek dulu dengan HEAD. PENTING: server SPA (Vite dev / hosting seperti
// Vercel) melempar path yang tak ada ke index.html dengan status 200, jadi
// cek res.ok saja tidak cukup -- kalau content-type "text/html" berarti itu
// fallback SPA (berkas BELUM ada), bukan PDF. Berkas PDF nyata bertipe
// application/pdf (atau setidaknya bukan text/html).
export async function bukaPdf(url, label) {
  // URL absolut (mis. bucket Supabase Storage): buka langsung. HEAD lintas-domain
  // bisa terblokir CORS dan tak perlu -- berkasnya memang ada di bucket publik.
  if (/^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener");
    return;
  }
  try {
    const res = await fetch(url, { method: "HEAD" });
    const type = (res.headers.get("content-type") || "").toLowerCase();
    if (res.ok && !type.includes("text/html")) {
      window.open(url, "_blank", "noopener");
      return;
    }
  } catch {
    /* jaringan gagal -> jatuh ke pesan di bawah */
  }
  window.alert(
    `Berkas ${label || "PDF"} belum tersedia. Silakan hubungi Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT.`
  );
}

// Buka tautan eksternal (mis. halaman JDIH). Tidak bisa di-HEAD-cek karena
// lintas-domain (CORS); cukup pastikan berupa URL http(s) yang terisi.
export function bukaTautan(url, label) {
  if (url && /^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener");
    return;
  }
  window.alert(
    `Tautan ${label || "JDIH"} belum tersedia. Silakan hubungi Bidang Perbendaharaan Badan Keuangan Daerah Provinsi NTT.`
  );
}
