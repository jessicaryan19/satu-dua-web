"use client";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

export type AuthProviderProps = {
  session: Session | null;
  isLoading: boolean;
};
const AuthContext = createContext<AuthProviderProps>({
  session: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);


  return (
    <AuthContext.Provider value={{ session, isLoading }
    } >
      {children}
    </AuthContext.Provider>
  );

}
