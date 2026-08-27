import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient.js";

const AuthCtx = createContext(null);

// Ambil baris profil (role, akun_status, dll) milik user yang login.
// RLS mengizinkan user membaca profilnya sendiri.
// Mengembalikan { data, error }: galat TIDAK boleh dibuang, sebab profil yang
// gagal dibaca akan tampak seperti akun "belum disetujui" -- dua hal yang
// sangat berbeda bagi pengguna.
// Dicoba beberapa kali: portal dilayani dari domain berbeda dengan servernya,
// sehingga di jaringan kantor yang lambat/terbatas permintaan pertama kerap
// gagal padahal datanya ada. Baris yang memang tidak ada BUKAN galat -- itu
// langsung dikembalikan tanpa diulang.
async function fetchProfile(uid, percobaan = 3) {
  if (!uid) return { data: null, error: null };
  let galatTerakhir = null;
  for (let i = 0; i < percobaan; i++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, nama, role, opd, email, akun_status")
      .eq("id", uid)
      .maybeSingle();
    if (!error) return { data: data || null, error: null };
    galatTerakhir = error;
    if (i < percobaan - 1) await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return { data: null, error: galatTerakhir };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false); // true saat user membuka tautan reset sandi dari email

  const loadProfile = useCallback(async (sess) => {
    const uid = sess?.user?.id;
    if (!uid) { setProfile(null); setProfileError(null); return; }
    const { data, error } = await fetchProfile(uid);
    setProfile(data);
    setProfileError(error);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!alive) return;
      if (_event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(sess);
      await loadProfile(sess);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [session, loadProfile]);

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    // Turunan status yang sering dipakai UI:
    isLoggedIn: !!session,
    isApproved: profile?.akun_status === "approved",
    isPending: profile?.akun_status === "pending",
    isRejected: profile?.akun_status === "rejected",
    // Sudah login tetapi profilnya tak terbaca -> status akun TIDAK DIKETAHUI.
    // Jangan tampilkan sebagai "menunggu persetujuan"; itu menyesatkan pemohon
    // yang akunnya sebenarnya sudah disetujui.
    profilGagal: !!session && !profile,
    profileError,
    role: profile?.role || null,

    async signUp({ email, password, role, nama, nip, opd, captchaToken }) {
      return supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
          // Setelah klik tautan verifikasi, tampilkan halaman konfirmasi khusus
          // (bukan langsung beranda). URL ini tercakup oleh Redirect URL
          // "https://sipasti.my.id/**" di Supabase Auth → URL Configuration.
          emailRedirectTo: window.location.origin + "/email-terkonfirmasi",
          data: { role, nama, username: nip, opd },
        },
      });
    },
    async signIn({ email, password, captchaToken }) {
      const res = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captchaToken || undefined },
      });
      if (res.error) return res;
      // Blokir akun yang BELUM disetujui: tak boleh masuk sampai admin menyetujui.
      // Ambil status profil, lalu keluarkan sesi bila pending/rejected.
      const uid = res.data?.user?.id;
      const { data: prof, error: profErr } = uid ? await fetchProfile(uid) : { data: null, error: null };
      if (prof && (prof.akun_status === "pending" || prof.akun_status === "rejected")) {
        await supabase.auth.signOut();
        return { data: { user: null, session: null }, error: { code: "not_approved", akun_status: prof.akun_status } };
      }
      // Profil tak terbaca: JANGAN diamkan. Tanpa profil, portal tak tahu peran
      // & status akun sehingga tampilannya seolah-olah belum disetujui.
      if (!prof) {
        await supabase.auth.signOut();
        return {
          data: { user: null, session: null },
          error: {
            code: "profil_tidak_terbaca",
            message: profErr?.message || "Profil akun tidak ditemukan.",
          },
        };
      }
      return res;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    // ── Reset kata sandi via email (Supabase Auth) ──
    recovery,
    clearRecovery: () => setRecovery(false),
    // Kirim email berisi tautan untuk menyetel ulang kata sandi. Tautan mengarah
    // ke origin + "/masuk" (URL yang sama dgn verifikasi daftar -> sudah terdaftar
    // di Supabase Auth > Redirect URLs). Saat dibuka, event PASSWORD_RECOVERY aktif.
    async resetSandiEmail(email, captchaToken) {
      return supabase.auth.resetPasswordForEmail((email || "").trim(), {
        redirectTo: window.location.origin + "/masuk",
        captchaToken: captchaToken || undefined,
      });
    },
    // Setel kata sandi baru untuk sesi pemulihan yang sedang aktif.
    async updateSandi(password) {
      return supabase.auth.updateUser({ password });
    },
    refreshProfile,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth harus di dalam <AuthProvider>");
  return ctx;
}
