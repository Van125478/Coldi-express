import { ApiError } from "@/services/apiClient";

export function lostSession(error: unknown, logout: () => Promise<void>) {
  if (error instanceof ApiError && error.status === 401) {
    void logout();
    return true;
  }
  return false;
}
