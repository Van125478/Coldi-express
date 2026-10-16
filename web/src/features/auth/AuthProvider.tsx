import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SessionSnapshot } from "@/models/session";
import { AuthContext } from "@/features/auth/auth-context";
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from "@/services/sessionService";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((user) => {
        if (!active) return;
        setSnapshot(user === null ? { status: "anonymous" } : { status: "authenticated", user });
      })
      .catch(() => {
        if (active) setSnapshot({ status: "anonymous" });
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await loginRequest(email, password);
    setSnapshot({ status: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setSnapshot({ status: "anonymous" });
  }, []);

  const value = useMemo(() => ({ snapshot, login, logout }), [snapshot, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
