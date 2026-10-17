import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/workspace/carrier/fleet/FleetNav";
import { accountStatusLabel, activationLabel } from "@/features/auth/driverAccess";
import { OneTimeCredential } from "@/features/workspace/carrier/fleet/OneTimeCredential";
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
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

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
    setPending(true);
    setNotice(null);
    try {
      const body = await updateCarrierDriverName(id, name);
      setDriver(body.driver);
      setName(body.driver.displayName ?? "");
      setNotice("Đã lưu tên hiển thị.");
    } catch (error) {
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
        const body = await resetCarrierDriverPassword(id);
        setDriver(body.driver);
        setTemporaryPassword(body.temporaryPassword);
      }
      setConfirming(null);
    } catch (error) {
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
          <PageHeader title={driver.displayName ?? "Chưa có tên"} summary="Tài khoản thuộc nhà xe đang đăng nhập. Mật khẩu không hiện lại sau khi đóng." />
          {temporaryPassword ? <OneTimeCredential password={temporaryPassword} onClose={() => setTemporaryPassword(null)} /> : null}
          <DetailBlock title="Hồ sơ">
            <FactLine term="Email" value={driver.email ?? ""} />
            <FactLine term="Trạng thái" value={accountStatusLabel(driver.accountStatus)} />
            <FactLine term="Kích hoạt" value={activationLabel(driver.mustChangePassword)} />
            <FactLine term="Phân công" value={driver.accountStatus === "LOCKED" || driver.mustChangePassword ? "Chưa thể nhận chuyến." : "Có thể nhận chuyến khi tài khoản đang mở và đã đổi mật khẩu."} />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <label className="block space-y-2 text-sm font-semibold text-ink">
                Tên hiển thị
                <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu" : "Lưu tên hiển thị"}
              </Button>
            </form>
            {notice ? <p role="status" className="text-sm text-ink">{notice}</p> : null}
          </DetailBlock>
          <DetailBlock title="Tài khoản">
            <p className="text-sm leading-relaxed text-muted">Không khóa và không đặt lại mật khẩu khi tài xế đang phụ trách chuyến đã phân công hoặc đang vận chuyển.</p>
            {confirming ? (
              <div className="space-y-3">
                <p className="text-sm text-ink">
                  {confirming === "lock" ? "Khóa tài khoản này? Tài xế không đăng nhập được cho đến khi mở khóa." : null}
                  {confirming === "unlock" ? "Mở khóa tài khoản này? Chuyến hàng không đổi." : null}
                  {confirming === "reset" ? "Đặt mật khẩu tạm mới? Mật khẩu cũ và phiên đang đăng nhập sẽ hết hiệu lực." : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={pending} onClick={() => void runConfirmed()}>{pending ? "Đang xử lý" : "Xác nhận"}</Button>
                  <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirming(null)}>Hủy</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {driver.accountStatus === "LOCKED" ? (
                  <Button type="button" onClick={() => setConfirming("unlock")}>Mở khóa</Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setConfirming("lock")}>Khóa tài khoản</Button>
                )}
                <Button type="button" variant="outline" onClick={() => setConfirming("reset")}>Đặt lại mật khẩu</Button>
              </div>
            )}
          </DetailBlock>
        </>
      ) : null}
    </section>
  );
}
