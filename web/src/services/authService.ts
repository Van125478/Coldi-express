import type { AuthUser } from "@/models/session";
import { ApiError, apiRequest } from "@/services/apiClient";

type UserResponse = {
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthUser> {
  const body = await apiRequest<UserResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return body.user;
}

export async function changeRequiredPassword(newPassword: string): Promise<AuthUser> {
  const body = await apiRequest<UserResponse>("/api/auth/change-required-password", {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
  return body.user;
}

export async function logout(): Promise<void> {
  await apiRequest<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const body = await apiRequest<UserResponse>("/api/auth/me");
    return body.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
