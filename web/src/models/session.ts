export type BusinessRole = "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  username?: string | null;
  role: BusinessRole;
  accountStatus?: "ACTIVE" | "LOCKED";
  mustChangePassword?: boolean;
};

export type SessionSnapshot =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: AuthUser };
