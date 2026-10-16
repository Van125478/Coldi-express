export type BusinessRole = "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: BusinessRole;
};

export type SessionSnapshot =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthUser };
