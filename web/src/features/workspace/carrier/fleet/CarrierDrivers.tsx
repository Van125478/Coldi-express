import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { carrierDriverPath } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountStatusLabel, activationLabel, driverDraftErrors } from "@/features/auth/driverAccess";
import { driverFieldOrder, type DriverDraft } from "@/features/auth/driverAccountRules";
import { FleetNav, fieldClass } from "@/features/workspace/carrier/fleet/FleetNav";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierDriver } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { createCarrierDriver, listCarrierDrivers } from "@/services/shipmentService";

export function CarrierDrivers() {
  usePageTitle("Tài xế");
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState<DriverDraft>({ displayName: "", username: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof DriverDraft, string>>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  function update(key: keyof DriverDraft, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      setErrors((existing) => {
        if (!existing[key]) return existing;
        const refreshed = driverDraftErrors(next);
        if (refreshed[key]) return { ...existing, [key]: refreshed[key] };
        const copy = { ...existing };
        delete copy[key];
        return copy;
      });
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = driverDraftErrors(draft);
    const names = driverFieldOrder.filter((name) => fieldErrors[name]);
    if (names.length > 0) {
      setErrors(fieldErrors);
      setFormError(null);
      const first = names[0];
      if (first) document.getElementById(`driver-${first}`)?.focus();
      return;
    }
    setPending(true);
    setFormError(null);
    setErrors({});
    try {
      await createCarrierDriver({
        displayName: draft.displayName.trim(),
        username: draft.username.trim().toLowerCase(),
        password: draft.password,
        confirmPassword: draft.confirmPassword,
      });
      setDraft({ displayName: "", username: "", password: "", confirmPassword: "" });
      await load();
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        const serverErrors = error.fields as Partial<Record<keyof DriverDraft, string>>;
        setErrors(serverErrors);
        const first = driverFieldOrder.find((name) => serverErrors[name]);
        if (first) document.getElementById(`driver-${first}`)?.focus();
      } else {
        setFormError(error instanceof ApiError ? error.message : "Không tạo được tài khoản tài xế.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Tài xế" summary="Nhà xe tạo tài khoản tài xế, khóa hoặc mở, và đặt lại mật khẩu cho tài xế của mình." />
      <FleetNav current="drivers" />
      <form className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" noValidate onSubmit={(event) => void submit(event)}>
        <h2 className="text-base font-bold text-ink">Tạo tài khoản tài xế</h2>
        <p className="text-sm text-muted">Nhà xe đặt tên đăng nhập và mật khẩu. Email không bắt buộc và mật khẩu không được gửi qua email.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DriverField id="driver-displayName" label="Tên hiển thị" autoComplete="off" value={draft.displayName} error={errors.displayName} onChange={(value) => update("displayName", value)} />
          <DriverField id="driver-username" label="Tên đăng nhập" autoComplete="off" value={draft.username} error={errors.username} onChange={(value) => update("username", value)} />
          <DriverField id="driver-password" label="Mật khẩu" type="password" autoComplete="new-password" value={draft.password} error={errors.password} onChange={(value) => update("password", value)} />
          <DriverField id="driver-confirmPassword" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" value={draft.confirmPassword} error={errors.confirmPassword} onChange={(value) => update("confirmPassword", value)} />
        </div>
        {formError ? <p role="alert" className="text-sm text-ink">{formError}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? "Đang tạo" : "Tạo tài xế"}</Button>
      </form>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải danh sách tài xế.</p> : null}
      {state === "error" ? <p className="text-sm text-ink">Không tải được danh sách tài xế.</p> : null}
      {state === "ready" && drivers.length === 0 ? (
        <EmptyPanel title="Chưa có tài xế" body="Tạo tài khoản cho tài xế của nhà xe. Mật khẩu do nhà xe đặt và không hiện lại sau khi tạo." />
      ) : null}
      {state === "ready" && drivers.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {drivers.map((driver) => (
            <li key={driver.id} className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm">
              <Link to={carrierDriverPath(driver.id)} className="text-base font-bold text-ink hover:text-navy">
                {driver.displayName ?? "Chưa có tên"}
              </Link>
              <p className="mt-1 break-all text-sm text-muted">{driver.username ?? driver.email ?? "Chưa có tên đăng nhập"}</p>
              <p className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={`inline-flex min-h-7 items-center rounded-full border px-2 ${driver.accountStatus === "LOCKED" ? "border-danger text-danger" : "border-success text-success"}`}>
                  {accountStatusLabel(driver.accountStatus)}
                </span>
                <span className="inline-flex min-h-7 items-center rounded-full border border-line px-2 text-ink">{activationLabel(driver.mustChangePassword)}</span>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function DriverField({ id, label, value, error, onChange, type = "text", autoComplete }: { id: string; label: string; value: string; error?: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} autoComplete={autoComplete} aria-invalid={error !== undefined} aria-describedby={error ? errorId : undefined} className={`${fieldClass} ${error ? "border-danger" : ""}`} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p id={errorId} className="text-sm text-ink">{error}</p> : null}
    </div>
  );
}
