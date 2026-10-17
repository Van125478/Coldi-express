export type AccessRole = "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";

export function needsPasswordChange(user: { role: AccessRole; mustChangePassword?: boolean }): boolean {
  return user.role === "DRIVER" && user.mustChangePassword === true;
}

export function chooseDestination(
  user: { role: AccessRole; mustChangePassword?: boolean },
  nextPath: string | null,
  paths: { password: string; home: (role: AccessRole) => string; owns: (role: AccessRole, pathname: string) => boolean },
): string {
  if (needsPasswordChange(user)) return paths.password;
  if (nextPath && paths.owns(user.role, nextPath)) return nextPath;
  return paths.home(user.role);
}

export function validateDriverDraft(displayName: string, email: string): string | null {
  const name = displayName.trim();
  if (name.length < 1 || name.length > 80) return "Tên hiển thị cần từ 1 đến 80 ký tự.";
  const normalized = email.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Email đăng nhập không hợp lệ.";
  }
  return null;
}

export function validateReplacementPassword(password: string): string | null {
  if (password.length < 8 || password.length > 72) return "Mật khẩu cần từ 8 đến 72 ký tự.";
  return null;
}

export function isAssignableDriver(driver: { accountStatus?: "ACTIVE" | "LOCKED"; mustChangePassword?: boolean }): boolean {
  return driver.accountStatus !== "LOCKED" && driver.mustChangePassword !== true;
}

export function accountStatusLabel(status: "ACTIVE" | "LOCKED" | undefined): string {
  return status === "LOCKED" ? "Đã khóa" : "Đang mở";
}

export function activationLabel(mustChangePassword: boolean | undefined): string {
  return mustChangePassword === true ? "Cần đổi mật khẩu tạm" : "Đã kích hoạt";
}
