import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/workspace/carrier/fleet/FleetNav";
import { accountStatusLabel, activationLabel, driverDraftErrors } from "@/features/auth/driverAccess";
import { DetailBlock, FactLine, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierDriver } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { getCarrierDriver, lockCarrierDriver, resetCarrierDriverPassword, unlockCarrierDriver, updateCarrierDriverName } from "@/services/shipmentService";

export function CarrierDriverProfile() {
  usePageTitle("Hồ sơ tài xế");
  const { id } = useParams();
  const [driver, setDriver] = useState<CarrierDriver | null>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"lock" | "unlock" | "reset" | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<"password" | "confirmPassword", string>>>({});

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCarrierDriver(id)
      .then((body) => {
        if (!active) return;
        setDriver(body.driver);
        setName(body.driver.displayName ?? "");
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(error instanceof ApiError && error.status === 404 ? "missing" : "error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function save() {
    if (!id) return;
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      setNameError("Tên hiển thị cần từ 1 đến 80 ký tự.");
      document.getElementById("driver-display-name")?.focus();
      return;
    }
    setNameError(null);
    setPending(true);
    setNotice(null);
    try {
      const body = await updateCarrierDriverName(id, name);
      setDriver(body.driver);
      setName(body.driver.displayName ?? "");
      setNotice("Đã lưu tên hiển thị.");
    } catch (error) {
      if (error instanceof ApiError && error.fields?.displayName) {
        setNameError(error.fields.displayName);
        document.getElementById("driver-display-name")?.focus();
        return;
      }
      setNotice(error instanceof ApiError ? error.message : "Không lưu được tên.");
    } finally {
      setPending(false);
    }
  }

  async function runConfirmed() {
    if (!id || !confirming) return;
    setPending(true);
    setNotice(null);
    try {
      if (confirming === "lock") {
        const body = await lockCarrierDriver(id);
        setDriver(body.driver);
        setNotice("Đã khóa tài khoản.");
      } else if (confirming === "unlock") {
        const body = await unlockCarrierDriver(id);
        setDriver(body.driver);
        setNotice("Đã mở khóa tài khoản.");
      } else {
        const fieldErrors = driverDraftErrors({ displayName: name || "Tài xế", username: "taixe.hop.le", password, confirmPassword });
        const nextErrors: Partial<Record<"password" | "confirmPassword", string>> = {};
        if (fieldErrors.password) nextErrors.password = fieldErrors.password;
        if (fieldErrors.confirmPassword) nextErrors.confirmPassword = fieldErrors.confirmPassword;
        if (Object.keys(nextErrors).length > 0) {
          setPasswordErrors(nextErrors);
          document.getElementById(nextErrors.password ? "reset-password" : "reset-confirm")?.focus();
          setPending(false);
          return;
        }
        const body = await resetCarrierDriverPassword(id, { password, confirmPassword });
        setDriver(body.driver);
        setPassword("");
        setConfirmPassword("");
        setNotice("Đã đặt mật khẩu mới. Mật khẩu không hiện lại.");
      }
      setConfirming(null);
    } catch (error) {
      if (confirming === "reset" && error instanceof ApiError && error.fields) {
        const nextErrors: Partial<Record<"password" | "confirmPassword", string>> = {};
        if (error.fields.password) nextErrors.password = error.fields.password;
        if (error.fields.confirmPassword) nextErrors.confirmPassword = error.fields.confirmPassword;
        if (Object.keys(nextErrors).length > 0) {
          setPasswordErrors(nextErrors);
          document.getElementById(nextErrors.password ? "reset-password" : "reset-confirm")?.focus();
          return;
        }
      }
      setNotice(error instanceof ApiError ? error.message : "Không thực hiện được thao tác.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-6">
      <Link to={paths.carrierDrivers} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Danh sách tài xế
      </Link>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải hồ sơ.</p> : null}
      {state === "missing" ? <p className="text-sm text-ink">Không tìm thấy tài xế này trong nhà xe của bạn.</p> : null}
      {state === "error" ? <p className="text-sm text-ink">Không tải được hồ sơ.</p> : null}
      {state === "ready" && driver ? (
        <>
          <PageHeader title={driver.displayName ?? "Chưa có tên"} summary="Tài khoản thuộc nhà xe đang đăng nhập. Mật khẩu không hiện lại sau khi đặt." />
          <DetailBlock title="Hồ sơ">
            <FactLine term="Tên đăng nhập" value={driver.username ?? "Tài khoản cũ dùng email"} />
            <FactLine term="Email" value={driver.email ?? "Không dùng email"} />
            <FactLine term="Trạng thái" value={accountStatusLabel(driver.accountStatus)} />
            <FactLine term="Kích hoạt" value={activationLabel(driver.mustChangePassword)} />
            <FactLine term="Phân công" value={driver.accountStatus === "LOCKED" || driver.mustChangePassword ? "Chưa thể nhận chuyến." : "Có thể nhận chuyến khi tài khoản đang mở."} />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <label className="block space-y-2 text-sm font-semibold text-ink">
                Tên hiển thị
                <input
                  id="driver-display-name"
                  aria-invalid={nameError !== null}
                  aria-describedby={nameError ? "driver-display-name-error" : undefined}
                  className={`${fieldClass} ${nameError ? "border-danger" : ""}`}
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setName(value);
                    const trimmed = value.trim();
                    if (nameError && trimmed.length >= 1 && trimmed.length <= 80) setNameError(null);
                  }}
                />
                {nameError ? <p id="driver-display-name-error" className="text-sm font-normal text-ink">{nameError}</p> : null}
              </label>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu" : "Lưu tên hiển thị"}
              </Button>
            </form>
            {notice ? <p role="status" className="text-sm text-ink">{notice}</p> : null}
          </DetailBlock>
          <DetailBlock title="Tài khoản">
            <p className="text-sm leading-relaxed text-muted">Không khóa và không đặt lại mật khẩu khi tài xế đang phụ trách chuyến đã phân công hoặc đang vận chuyển.</p>
            <div className="flex flex-wrap gap-2">
              {driver.accountStatus === "LOCKED" ? (
                <Button type="button" onClick={() => setConfirming("unlock")}>Mở khóa</Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setConfirming("lock")}>Khóa tài khoản</Button>
              )}
              <Button type="button" variant="outline" onClick={() => setConfirming("reset")}>Đặt lại mật khẩu</Button>
            </div>
          </DetailBlock>
          {confirming ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1E293B]/40 p-4 sm:items-center">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="driver-action-title"
                tabIndex={-1}
                className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 outline-none"
                onKeyDown={(event) => {
                  if (event.key === "Escape" && !pending) setConfirming(null);
                }}
              >
                <h2 id="driver-action-title" className="text-lg font-bold text-ink">
                  {confirming === "lock" ? "Khóa tài khoản" : confirming === "unlock" ? "Mở khóa tài khoản" : "Đặt lại mật khẩu"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  {confirming === "lock" ? "Tài xế không đăng nhập được cho đến khi mở khóa. Chuyến đang chạy sẽ chặn thao tác này." : null}
                  {confirming === "unlock" ? "Mở khóa không đổi chuyến hàng và không hiện lại mật khẩu cũ." : null}
                  {confirming === "reset" ? "Nhà xe đặt mật khẩu mới. Mật khẩu không được lưu lại trên màn hình và phiên đang đăng nhập sẽ hết hiệu lực." : null}
                </p>
                {confirming === "reset" ? (
                  <div className="mt-4 space-y-3">
                    <label className="block space-y-2 text-sm font-semibold text-ink" htmlFor="reset-password">
                      Mật khẩu mới
                      <input id="reset-password" type="password" autoComplete="new-password" aria-invalid={passwordErrors.password !== undefined} aria-describedby={passwordErrors.password ? "reset-password-error" : undefined} className={`${fieldClass} ${passwordErrors.password ? "border-danger" : ""}`} value={password} onChange={(event) => {
                        const value = event.target.value;
                        setPassword(value);
                        const fieldErrors = driverDraftErrors({ displayName: name || "Tài xế", username: "taixe.hop.le", password: value, confirmPassword });
                        setPasswordErrors((current) => {
                          const next = { ...current };
                          if (!fieldErrors.password) delete next.password;
                          if (!fieldErrors.confirmPassword) delete next.confirmPassword;
                          return next;
                        });
                      }} />
                      {passwordErrors.password ? <p id="reset-password-error" className="text-sm font-normal text-ink">{passwordErrors.password}</p> : null}
                    </label>
                    <label className="block space-y-2 text-sm font-semibold text-ink" htmlFor="reset-confirm">
                      Nhập lại mật khẩu
                      <input id="reset-confirm" type="password" autoComplete="new-password" aria-invalid={passwordErrors.confirmPassword !== undefined} aria-describedby={passwordErrors.confirmPassword ? "reset-confirm-error" : undefined} className={`${fieldClass} ${passwordErrors.confirmPassword ? "border-danger" : ""}`} value={confirmPassword} onChange={(event) => {
                        const value = event.target.value;
                        setConfirmPassword(value);
                        const fieldErrors = driverDraftErrors({ displayName: name || "Tài xế", username: "taixe.hop.le", password, confirmPassword: value });
                        setPasswordErrors((current) => {
                          const next = { ...current };
                          if (!fieldErrors.confirmPassword) delete next.confirmPassword;
                          return next;
                        });
                      }} />
                      {passwordErrors.confirmPassword ? <p id="reset-confirm-error" className="text-sm font-normal text-ink">{passwordErrors.confirmPassword}</p> : null}
                    </label>
                  </div>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirming(null)}>
                    Hủy
                  </Button>
                  <Button type="button" disabled={pending} onClick={() => void runConfirmed()}>
                    {pending ? "Đang xử lý" : "Xác nhận"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
