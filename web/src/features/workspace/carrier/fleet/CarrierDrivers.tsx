import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { carrierDriverPath } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountStatusLabel, activationLabel, validateDriverDraft } from "@/features/auth/driverAccess";
import { FleetNav, fieldClass } from "@/features/workspace/carrier/fleet/FleetNav";
import { OneTimeCredential } from "@/features/workspace/carrier/fleet/OneTimeCredential";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierDriver } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { createCarrierDriver, listCarrierDrivers } from "@/services/shipmentService";

export function CarrierDrivers() {
  usePageTitle("Tài xế");
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  function load() {
    return listCarrierDrivers().then((body) => {
      setDrivers(body.drivers);
      setState("ready");
    });
  }

  useEffect(() => {
    let active = true;
    listCarrierDrivers()
      .then((body) => {
        if (!active) return;
        setDrivers(body.drivers);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateDriverDraft(name, email);
    if (problem) {
      setFormError(problem);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const created = await createCarrierDriver({ displayName: name.trim(), email: email.trim().toLowerCase() });
      setName("");
      setEmail("");
      setTemporaryPassword(created.temporaryPassword);
      await load();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Không tạo được tài khoản tài xế.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Tài xế" summary="Nhà xe tạo tài khoản tài xế, khóa hoặc mở, và đặt lại mật khẩu cho tài xế của mình." />
      <FleetNav current="drivers" />
      {temporaryPassword ? <OneTimeCredential password={temporaryPassword} onClose={() => setTemporaryPassword(null)} /> : null}
      <form className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" onSubmit={(event) => void submit(event)}>
        <h2 className="text-base font-bold text-ink">Tạo tài khoản tài xế</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="driver-name">Tên hiển thị</Label>
            <Input id="driver-name" className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="driver-email">Email đăng nhập</Label>
            <Input id="driver-email" type="email" autoComplete="off" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
        {formError ? <p role="alert" className="text-sm text-ink">{formError}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? "Đang tạo" : "Tạo tài xế"}</Button>
      </form>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải danh sách tài xế.</p> : null}
      {state === "error" ? <p className="text-sm text-ink">Không tải được danh sách tài xế.</p> : null}
      {state === "ready" && drivers.length === 0 ? <p className="text-sm text-ink">Chưa có tài xế liên kết.</p> : null}
      {state === "ready" && drivers.length > 0 ? (
        <ul className="grid gap-3">
          {drivers.map((driver) => (
            <li key={driver.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
              <Link to={carrierDriverPath(driver.id)} className="text-base font-bold text-ink hover:text-navy">
                {driver.displayName ?? "Chưa có tên"}
              </Link>
              <p className="mt-1 break-all text-sm text-muted">{driver.email}</p>
              <p className="mt-2 text-sm text-ink">{accountStatusLabel(driver.accountStatus)} · {activationLabel(driver.mustChangePassword)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
