import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient.js";

const AuthCtx = createContext(null);

// Ambil baris profil (role, akun_status, dll) milik user yang login.
// RLS mengizinkan user membaca profilnya sendiri.
async function fetchProfile(uid) {
  if (!uid) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, nama, role, opd, email, akun_status")
    .eq("id", uid)
    .maybeSingle();
  return data || null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (sess) => {
    const uid = sess?.user?.id;
    setProfile(uid ? await fetchProfile(uid) : null);
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
    role: profile?.role || null,

    async signUp({ email, password, role, nama, nip, opd, captchaToken }) {
      return supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken: captchaToken || undefined,
          data: { role, nama, username: nip, opd },
        },
      });
    },
    async signIn({ email, password, captchaToken }) {
      return supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captchaToken || undefined },
      });
    },
    async signOut() {
      await supabase.auth.signOut();
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
