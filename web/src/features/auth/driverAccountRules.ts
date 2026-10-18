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

export type DriverDraft = {
  displayName: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export function driverDraftErrors(draft: DriverDraft): Partial<Record<keyof DriverDraft, string>> {
  const errors: Partial<Record<keyof DriverDraft, string>> = {};
  const name = draft.displayName.trim();
  if (name.length < 1 || name.length > 80) errors.displayName = "Tên hiển thị cần từ 1 đến 80 ký tự.";
  const username = draft.username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    errors.username = "Tên đăng nhập dùng 3 đến 32 ký tự chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.";
  }
  if (draft.password.length < 8 || draft.password.length > 72) errors.password = "Mật khẩu cần từ 8 đến 72 ký tự.";
  if (draft.confirmPassword !== draft.password) errors.confirmPassword = "Mật khẩu nhập lại chưa khớp.";
  return errors;
}

export const driverFieldOrder: (keyof DriverDraft)[] = ["displayName", "username", "password", "confirmPassword"];

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
