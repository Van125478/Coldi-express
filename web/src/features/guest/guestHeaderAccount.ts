import { logoDestination, type WorkspaceRole } from "../workspace/logoDestination";

export type GuestAccountAction =
  | { kind: "login"; href: "/dang-nhap"; label: "Đăng nhập" }
  | { kind: "workspace"; href: string; label: "Vào khu làm việc" };

export function guestAccountAction(role: WorkspaceRole | null): GuestAccountAction {
  if (role === null) return { kind: "login", href: "/dang-nhap", label: "Đăng nhập" };
  return { kind: "workspace", href: logoDestination(role), label: "Vào khu làm việc" };
}
