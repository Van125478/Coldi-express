export type WorkspaceRole = "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";

export function logoDestination(role: WorkspaceRole | null): string {
  if (role === "SHIPPER") return "/shipper";
  if (role === "CARRIER") return "/carrier";
  if (role === "DRIVER") return "/driver";
  if (role === "ADMIN") return "/admin";
  return "/";
}
