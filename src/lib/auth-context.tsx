import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Cargo } from "./cargos";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  agrupamento_id: string | null;
  avatar_url: string | null;
};

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  cargos: { cargo: Cargo; agrupamento_id: string | null }[];
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cargos, setCargos] = useState<{ cargo: Cargo; agrupamento_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async (uid: string) => {
    const [{ data: prof }, { data: roles }, { data: noms }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("nominations").select("cargo, agrupamento_id").eq("user_id", uid),
    ]);
    setProfile(prof as Profile | null);
    const adminFlag = (roles ?? []).some((r: any) => r.role === "admin");
    const provincialFlag = (noms ?? []).some((n: any) =>
      ["coord_provincial", "adj_coord_provincial"].includes(n.cargo)
    );
    setIsAdmin(adminFlag || provincialFlag);
    setCargos((noms ?? []) as any);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadAll(s.user.id), 0);
      } else {
        setProfile(null); setIsAdmin(false); setCargos([]);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadAll(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refresh = async () => { if (session?.user) await loadAll(session.user.id); };

  return (
    <Ctx.Provider value={{
      loading, session, user: session?.user ?? null, profile, isAdmin, cargos, refresh
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
