import { createContext } from "react";
import type { AuthUser, SessionSnapshot } from "@/models/session";

export type AuthContextValue = {
  snapshot: SessionSnapshot;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
