import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, SessionSnapshot } from "@/models/session";
import { AuthContext } from "@/features/auth/auth-context";
import { ApiError } from "@/services/apiClient";
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
    try {
      await logoutRequest();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
    }
    setSnapshot({ status: "anonymous" });
  }, []);

  const acceptUser = useCallback((user: AuthUser) => {
    setSnapshot({ status: "authenticated", user });
  }, []);

  const value = useMemo(() => ({ snapshot, login, logout, acceptUser }), [snapshot, login, logout, acceptUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
