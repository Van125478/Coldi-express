import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublishedShipment, PublishShipmentInput, TemperatureGroup } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { listMyShipments, publishShipment } from "@/services/shipmentService";

const temperatures: readonly { value: TemperatureGroup; label: string }[] = [
  { value: "COOL", label: "Lạnh mát" },
  { value: "FROZEN", label: "Đông" },
  { value: "DEEP_FROZEN", label: "Cực lạnh" },
];

const steps = ["Điểm bốc hàng", "Điểm giao hàng", "Hàng hóa và xe"] as const;

type Step = 1 | 2 | 3;

type FieldName = keyof FormState;

type FormState = {
  pickupCompany: string;
  pickupLocation: string;
  pickupContactName: string;
  pickupPhone: string;
  pickupEmail: string;
  pickupDate: string;
  pickupTimeFrom: string;
  pickupTimeTo: string;
  deliveryCompany: string;
  deliveryLocation: string;
  deliveryContactName: string;
  deliveryPhone: string;
  deliveryEmail: string;
  deliveryDate: string;
  deliveryTimeFrom: string;
  deliveryTimeTo: string;
  cargoDescription: string;
  temperatureGroup: TemperatureGroup | "";
  cargoWeightTon: string;
  cargoVolumeM3: string;
  packageCount: string;
  vehicleRequirement: string;
  listedPriceVnd: string;
};

const emptyForm: FormState = {
  pickupCompany: "",
  pickupLocation: "",
  pickupContactName: "",
  pickupPhone: "",
  pickupEmail: "",
  pickupDate: "",
  pickupTimeFrom: "",
  pickupTimeTo: "",
  deliveryCompany: "",
  deliveryLocation: "",
  deliveryContactName: "",
  deliveryPhone: "",
  deliveryEmail: "",
  deliveryDate: "",
  deliveryTimeFrom: "",
  deliveryTimeTo: "",
  cargoDescription: "",
  temperatureGroup: "",
  cargoWeightTon: "",
  cargoVolumeM3: "",
  packageCount: "",
  vehicleRequirement: "",
  listedPriceVnd: "",
};

const stepFields: Record<Step, readonly FieldName[]> = {
  1: ["pickupCompany", "pickupLocation", "pickupContactName", "pickupPhone", "pickupEmail", "pickupDate", "pickupTimeFrom", "pickupTimeTo"],
  2: ["deliveryCompany", "deliveryLocation", "deliveryContactName", "deliveryPhone", "deliveryEmail", "deliveryDate", "deliveryTimeFrom", "deliveryTimeTo"],
  3: ["cargoDescription", "temperatureGroup", "cargoWeightTon", "cargoVolumeM3", "packageCount", "vehicleRequirement", "listedPriceVnd"],
};

function money(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

function civil(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function optionalEmail(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return trimmed.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function phoneOk(value: string): boolean {
  const count = digits(value).length;
  return value.trim().length >= 8 && value.trim().length <= 20 && count >= 8 && count <= 15;
}

function measureOk(value: string): boolean {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return false;
  const number = Number(normalized);
  return number > 0 && number <= 100000;
}

function measureValue(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function localErrors(form: FormState): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (form.pickupCompany.trim().length === 0) errors.pickupCompany = "Nhập tên công ty hoặc kho gửi.";
  if (form.pickupLocation.trim().length === 0) errors.pickupLocation = "Nhập địa chỉ lấy hàng.";
  if (form.pickupContactName.trim().length === 0) errors.pickupContactName = "Nhập người bốc hàng.";
  if (!phoneOk(form.pickupPhone)) errors.pickupPhone = "Nhập số điện thoại lấy hàng.";
  if (!optionalEmail(form.pickupEmail)) errors.pickupEmail = "Email nhận thông báo chưa hợp lệ.";
  if (form.pickupDate === "") errors.pickupDate = "Chọn ngày lấy hàng.";
  if (form.pickupTimeFrom === "" || form.pickupTimeTo === "" || form.pickupTimeFrom >= form.pickupTimeTo) {
    errors.pickupTimeTo = "Khung giờ bốc hàng phải có giờ bắt đầu sớm hơn giờ kết thúc.";
  }
  if (form.deliveryCompany.trim().length === 0) errors.deliveryCompany = "Nhập tên công ty hoặc kho nhận.";
  if (form.deliveryLocation.trim().length === 0) errors.deliveryLocation = "Nhập địa chỉ giao hàng.";
  if (form.deliveryContactName.trim().length === 0) errors.deliveryContactName = "Nhập người nhận hàng.";
  if (!phoneOk(form.deliveryPhone)) errors.deliveryPhone = "Nhập số điện thoại giao hàng.";
  if (!optionalEmail(form.deliveryEmail)) errors.deliveryEmail = "Email kho nhận chưa hợp lệ.";
  if (form.deliveryDate === "") errors.deliveryDate = "Chọn ngày giao hàng.";
  if (form.pickupDate !== "" && form.deliveryDate !== "" && form.deliveryDate < form.pickupDate) {
    errors.deliveryDate = "Ngày giao muộn nhất không được trước ngày lấy hàng.";
  }
  if (form.deliveryTimeFrom === "" || form.deliveryTimeTo === "" || form.deliveryTimeFrom >= form.deliveryTimeTo) {
    errors.deliveryTimeTo = "Khung giờ nhận hàng phải có giờ bắt đầu sớm hơn giờ kết thúc.";
  }
  if (form.cargoDescription.trim().length === 0) errors.cargoDescription = "Nhập mô tả hàng hóa.";
  if (form.temperatureGroup === "") errors.temperatureGroup = "Chọn nhóm nhiệt.";
  if (!measureOk(form.cargoWeightTon)) errors.cargoWeightTon = "Nhập trọng lượng bằng tấn, lớn hơn 0.";
  if (!measureOk(form.cargoVolumeM3)) errors.cargoVolumeM3 = "Nhập thể tích bằng mét khối, lớn hơn 0.";
  if (!/^[1-9]\d*$/.test(form.packageCount) || Number(form.packageCount) > 1000000) {
    errors.packageCount = "Nhập số thùng bằng số nguyên, lớn hơn 0.";
  }
  if (form.vehicleRequirement.trim().length === 0) errors.vehicleRequirement = "Nhập yêu cầu xe.";
  if (!/^[1-9]\d*$/.test(form.listedPriceVnd)) errors.listedPriceVnd = "Nhập giá cước bằng số nguyên đồng, lớn hơn 0.";
  return errors;
}

function errorsForStep(form: FormState, step: Step): Partial<Record<FieldName, string>> {
  const all = localErrors(form);
  const names = new Set<FieldName>(stepFields[step]);
  if (step === 2) names.add("deliveryDate");
  return Object.fromEntries(Object.entries(all).filter(([name]) => names.has(name as FieldName))) as Partial<Record<FieldName, string>>;
}

function toInput(form: FormState): PublishShipmentInput {
  const temperatureGroup = form.temperatureGroup;
  if (temperatureGroup === "") throw new Error("Temperature is required.");
  return {
    cargoDescription: form.cargoDescription.trim(),
    pickupCompany: form.pickupCompany.trim(),
    pickupLocation: form.pickupLocation.trim(),
    pickupContactName: form.pickupContactName.trim(),
    pickupPhone: form.pickupPhone.trim(),
    pickupEmail: form.pickupEmail.trim() === "" ? null : form.pickupEmail.trim(),
    pickupDate: form.pickupDate,
    pickupTimeFrom: form.pickupTimeFrom,
    pickupTimeTo: form.pickupTimeTo,
    deliveryCompany: form.deliveryCompany.trim(),
    deliveryLocation: form.deliveryLocation.trim(),
    deliveryContactName: form.deliveryContactName.trim(),
    deliveryPhone: form.deliveryPhone.trim(),
    deliveryEmail: form.deliveryEmail.trim() === "" ? null : form.deliveryEmail.trim(),
    deliveryDate: form.deliveryDate,
    deliveryTimeFrom: form.deliveryTimeFrom,
    deliveryTimeTo: form.deliveryTimeTo,
    cargoWeightTon: measureValue(form.cargoWeightTon),
    cargoVolumeM3: measureValue(form.cargoVolumeM3),
    packageCount: Number(form.packageCount),
    temperatureGroup,
    vehicleRequirement: form.vehicleRequirement.trim(),
    listedPriceVnd: Number(form.listedPriceVnd),
  };
}

export function PublishShipmentPage({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [published, setPublished] = useState<PublishedShipment | null>(null);
  const [shipments, setShipments] = useState<PublishedShipment[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    listMyShipments()
      .then((body) => {
        if (!active) return;
        setShipments(body.shipments);
        setListState("ready");
      })
      .catch(() => {
        if (active) setListState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function next() {
    const stepErrors = errorsForStep(form, step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((current) => (current === 3 ? 3 : ((current + 1) as Step)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 3 || pending) return;
    const stepErrors = errorsForStep(form, 3);
    const dateError = localErrors(form).deliveryDate;
    if (dateError) stepErrors.deliveryDate = dateError;
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      if (stepErrors.deliveryDate && Object.keys(stepErrors).length === 1) setStep(2);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const body = await publishShipment(toInput(form));
      setPublished(body.shipment);
      setShipments((current) => [body.shipment, ...current.filter((item) => item.id !== body.shipment.id)]);
      setListState("ready");
      setForm(emptyForm);
      setStep(1);
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields) {
        const serverErrors = caught.fields as Partial<Record<FieldName, string>>;
        setErrors(serverErrors);
        const names = Object.keys(serverErrors);
        const earlier = names.some((name) => stepFields[1].includes(name as FieldName));
        const middle = names.some((name) => stepFields[2].includes(name as FieldName));
        if (earlier) setStep(1);
        else if (middle) setStep(2);
      }
      setFormError(caught instanceof ApiError ? caught.message : "Không đăng được đơn. Hãy thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-navy">Đăng đơn hàng</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Niêm yết nhu cầu vận chuyển</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        {email} đăng đơn với vai trò Chủ hàng. Đơn được niêm yết ở trạng thái Đang tìm xe. Bước này chưa gán nhà xe, xe hoặc tài xế, và chưa có nghĩa là đã thanh toán.
      </p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {steps.map((label, index) => {
          const number = (index + 1) as Step;
          const active = step === number;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={`rounded-2xl border px-4 py-3 text-sm ${active ? "border-navy bg-surface font-semibold text-navy" : "border-line bg-canvas text-muted"}`}
            >
              Bước {number}/3 · {label}
            </li>
          );
        })}
      </ol>

      <form className="mt-8 space-y-8" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {step === 1 ? (
          <fieldset className="space-y-4" disabled={pending}>
            <legend className="text-lg font-bold text-ink">Địa chỉ kho gửi và lấy hàng</legend>
            <p className="text-sm leading-relaxed text-muted">Sổ địa chỉ và bản đồ chưa mở. Thông tin dưới đây được lưu cùng đơn.</p>
            <Field label="Tên công ty / kho gửi" id="pickup-company" error={errors.pickupCompany}>
              <Input id="pickup-company" value={form.pickupCompany} onChange={(event) => update("pickupCompany", event.target.value)} aria-invalid={errors.pickupCompany !== undefined} />
            </Field>
            <Field label="Địa chỉ lấy hàng" id="pickup-location" error={errors.pickupLocation}>
              <Input id="pickup-location" value={form.pickupLocation} onChange={(event) => update("pickupLocation", event.target.value)} aria-invalid={errors.pickupLocation !== undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Người bốc hàng" id="pickup-contact" error={errors.pickupContactName}>
                <Input id="pickup-contact" value={form.pickupContactName} onChange={(event) => update("pickupContactName", event.target.value)} aria-invalid={errors.pickupContactName !== undefined} />
              </Field>
              <Field label="Số điện thoại" id="pickup-phone" error={errors.pickupPhone}>
                <Input id="pickup-phone" inputMode="tel" value={form.pickupPhone} onChange={(event) => update("pickupPhone", event.target.value)} aria-invalid={errors.pickupPhone !== undefined} />
              </Field>
            </div>
            <Field label="Email nhận thông báo (tùy chọn)" id="pickup-email" error={errors.pickupEmail}>
              <Input id="pickup-email" type="email" value={form.pickupEmail} onChange={(event) => update("pickupEmail", event.target.value)} aria-invalid={errors.pickupEmail !== undefined} />
            </Field>
            <Field label="Ngày lấy hàng" id="pickup-date" error={errors.pickupDate}>
              <Input id="pickup-date" type="date" value={form.pickupDate} onChange={(event) => update("pickupDate", event.target.value)} aria-invalid={errors.pickupDate !== undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Khung giờ bốc hàng từ" id="pickup-from" error={errors.pickupTimeFrom}>
                <Input id="pickup-from" type="time" value={form.pickupTimeFrom} onChange={(event) => update("pickupTimeFrom", event.target.value)} aria-invalid={errors.pickupTimeFrom !== undefined} />
              </Field>
              <Field label="Đến" id="pickup-to" error={errors.pickupTimeTo}>
                <Input id="pickup-to" type="time" value={form.pickupTimeTo} onChange={(event) => update("pickupTimeTo", event.target.value)} aria-invalid={errors.pickupTimeTo !== undefined} />
              </Field>
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="space-y-4" disabled={pending}>
            <legend className="text-lg font-bold text-ink">Thông tin kho nhận và điểm giao</legend>
            <p className="text-sm leading-relaxed text-muted">Sổ địa chỉ và bản đồ chưa mở. Thông tin dưới đây được lưu cùng đơn.</p>
            <Field label="Tên công ty / kho nhận" id="delivery-company" error={errors.deliveryCompany}>
              <Input id="delivery-company" value={form.deliveryCompany} onChange={(event) => update("deliveryCompany", event.target.value)} aria-invalid={errors.deliveryCompany !== undefined} />
            </Field>
            <Field label="Địa chỉ giao hàng" id="delivery-location" error={errors.deliveryLocation}>
              <Input id="delivery-location" value={form.deliveryLocation} onChange={(event) => update("deliveryLocation", event.target.value)} aria-invalid={errors.deliveryLocation !== undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Người nhận hàng" id="delivery-contact" error={errors.deliveryContactName}>
                <Input id="delivery-contact" value={form.deliveryContactName} onChange={(event) => update("deliveryContactName", event.target.value)} aria-invalid={errors.deliveryContactName !== undefined} />
              </Field>
              <Field label="Số điện thoại" id="delivery-phone" error={errors.deliveryPhone}>
                <Input id="delivery-phone" inputMode="tel" value={form.deliveryPhone} onChange={(event) => update("deliveryPhone", event.target.value)} aria-invalid={errors.deliveryPhone !== undefined} />
              </Field>
            </div>
            <Field label="Email kho nhận (không bắt buộc)" id="delivery-email" error={errors.deliveryEmail}>
              <Input id="delivery-email" type="email" value={form.deliveryEmail} onChange={(event) => update("deliveryEmail", event.target.value)} aria-invalid={errors.deliveryEmail !== undefined} />
            </Field>
            <Field label="Ngày giao hàng muộn nhất" id="delivery-date" error={errors.deliveryDate}>
              <Input id="delivery-date" type="date" value={form.deliveryDate} onChange={(event) => update("deliveryDate", event.target.value)} aria-invalid={errors.deliveryDate !== undefined} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Khung giờ nhận hàng từ" id="delivery-from" error={errors.deliveryTimeFrom}>
                <Input id="delivery-from" type="time" value={form.deliveryTimeFrom} onChange={(event) => update("deliveryTimeFrom", event.target.value)} aria-invalid={errors.deliveryTimeFrom !== undefined} />
              </Field>
              <Field label="Đến" id="delivery-to" error={errors.deliveryTimeTo}>
                <Input id="delivery-to" type="time" value={form.deliveryTimeTo} onChange={(event) => update("deliveryTimeTo", event.target.value)} aria-invalid={errors.deliveryTimeTo !== undefined} />
              </Field>
            </div>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <fieldset className="space-y-4" disabled={pending}>
            <legend className="text-lg font-bold text-ink">Hàng hóa và yêu cầu xe</legend>
            <p className="text-sm leading-relaxed text-muted">
              Gợi ý loại xe, cước tự tính, dịch vụ bốc xếp, chứng từ bắt buộc, giá trị khai báo và hạn mức công nợ chưa được áp dụng. Cước niêm yết do chủ hàng nhập. Nhóm nhiệt chưa dùng ngưỡng °C.
            </p>
            <Field label="Mô tả hàng hóa" id="cargo-description" error={errors.cargoDescription}>
              <textarea
                id="cargo-description"
                value={form.cargoDescription}
                onChange={(event) => update("cargoDescription", event.target.value)}
                rows={3}
                className="flex w-full rounded-xl border border-line bg-surface px-3 py-3 text-base text-ink disabled:opacity-50"
                aria-invalid={errors.cargoDescription !== undefined}
              />
            </Field>
            <Field label="Nhóm nhiệt" id="temperature-group" error={errors.temperatureGroup}>
              <select
                id="temperature-group"
                value={form.temperatureGroup}
                onChange={(event) => update("temperatureGroup", event.target.value as FormState["temperatureGroup"])}
                className="flex h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink disabled:opacity-50"
                aria-invalid={errors.temperatureGroup !== undefined}
              >
                <option value="">Chọn nhóm nhiệt</option>
                {temperatures.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Trọng lượng (tấn)" id="cargo-weight" error={errors.cargoWeightTon}>
                <Input id="cargo-weight" inputMode="decimal" value={form.cargoWeightTon} onChange={(event) => update("cargoWeightTon", event.target.value)} aria-invalid={errors.cargoWeightTon !== undefined} />
              </Field>
              <Field label="Thể tích (m³)" id="cargo-volume" error={errors.cargoVolumeM3}>
                <Input id="cargo-volume" inputMode="decimal" value={form.cargoVolumeM3} onChange={(event) => update("cargoVolumeM3", event.target.value)} aria-invalid={errors.cargoVolumeM3 !== undefined} />
              </Field>
              <Field label="Số thùng" id="package-count" error={errors.packageCount}>
                <Input id="package-count" inputMode="numeric" value={form.packageCount} onChange={(event) => update("packageCount", event.target.value.replace(/\D/g, ""))} aria-invalid={errors.packageCount !== undefined} />
              </Field>
            </div>
            <Field label="Yêu cầu xe" id="vehicle-requirement" error={errors.vehicleRequirement}>
              <Input id="vehicle-requirement" value={form.vehicleRequirement} onChange={(event) => update("vehicleRequirement", event.target.value)} aria-invalid={errors.vehicleRequirement !== undefined} />
            </Field>
            <Field label="Giá cước niêm yết (đồng)" id="listed-price" error={errors.listedPriceVnd}>
              <Input id="listed-price" inputMode="numeric" value={form.listedPriceVnd} onChange={(event) => update("listedPriceVnd", event.target.value.replace(/\D/g, ""))} aria-invalid={errors.listedPriceVnd !== undefined} />
            </Field>
            <div className="rounded-2xl border border-line bg-canvas p-4 text-sm leading-6 text-ink">
              <p className="font-semibold text-navy">Xem lại trước khi đăng</p>
              <p>
                Lấy: {form.pickupCompany || "—"}, {form.pickupLocation || "—"}. {form.pickupContactName || "—"} · {form.pickupPhone || "—"}.{" "}
                {form.pickupDate ? civil(form.pickupDate) : "—"}, {form.pickupTimeFrom || "—"}–{form.pickupTimeTo || "—"}.
              </p>
              <p>
                Giao: {form.deliveryCompany || "—"}, {form.deliveryLocation || "—"}. {form.deliveryContactName || "—"} · {form.deliveryPhone || "—"}.{" "}
                {form.deliveryDate ? civil(form.deliveryDate) : "—"}, {form.deliveryTimeFrom || "—"}–{form.deliveryTimeTo || "—"}.
              </p>
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          {step > 1 ? (
            <Button type="button" variant="outline" disabled={pending} onClick={() => setStep((current) => (current === 1 ? 1 : ((current - 1) as Step)))}>
              Quay lại
            </Button>
          ) : null}
          {step < 3 ? (
            <Button type="button" disabled={pending} onClick={next}>
              {step === 1 ? "Tiếp tục: Điểm giao hàng" : "Tiếp tục: Hàng hóa và xe"}
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? "Đang đăng đơn" : "Hoàn tất và đăng đơn"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onLogout}>
            Đăng xuất
          </Button>
        </div>
        {formError ? (
          <p role="alert" className="text-sm leading-relaxed text-ink">
            {formError}
          </p>
        ) : null}
      </form>

      {published ? (
        <div role="status" className="mt-8 rounded-2xl border border-success-line bg-success-bg p-5">
          <p className="text-sm font-semibold text-success">Đơn đã được niêm yết</p>
          <dl className="mt-3 space-y-1 text-sm leading-6 text-ink">
            <div>Mã đơn: {published.id}</div>
            <div>Trạng thái: {published.statusLabel}</div>
            <div>Hàng hóa: {published.cargoDescription}</div>
            <div>
              Lộ trình: {published.pickupLocation} → {published.deliveryLocation}
            </div>
            <div>
              Lấy hàng: {published.pickupDate ? civil(published.pickupDate) : "—"}
              {published.pickupTimeFrom && published.pickupTimeTo ? `, ${published.pickupTimeFrom}–${published.pickupTimeTo}` : ""}
            </div>
            <div>Nhóm nhiệt: {published.temperatureLabel}</div>
            <div>
              Hàng: {published.cargoWeightTon ?? "—"} tấn · {published.cargoVolumeM3 ?? "—"} m³ · {published.packageCount ?? "—"} thùng
            </div>
            <div>Yêu cầu xe: {published.vehicleRequirement}</div>
            <div>Cước niêm yết: {money(published.listedPriceVnd)}</div>
          </dl>
        </div>
      ) : null}

      <div className="mt-12">
        <h2 className="text-xl font-bold text-ink">Đơn đã niêm yết</h2>
        {listState === "loading" ? <p className="mt-4 text-sm text-muted">Đang tải đơn đã niêm yết.</p> : null}
        {listState === "error" ? (
          <p role="alert" className="mt-4 text-sm text-ink">
            Không tải được danh sách đơn. Hãy tải lại trang.
          </p>
        ) : null}
        {listState === "ready" && shipments.length === 0 ? <p className="mt-4 text-sm text-muted">Chưa có đơn nào.</p> : null}
        {listState === "ready" && shipments.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {shipments.map((shipment) => (
              <li key={shipment.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{shipment.cargoDescription}</p>
                  <p className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-navy">{shipment.statusLabel}</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {[shipment.pickupCompany, shipment.pickupLocation].filter(Boolean).join(" — ")} →{" "}
                  {[shipment.deliveryCompany, shipment.deliveryLocation].filter(Boolean).join(" — ")}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {shipment.temperatureLabel}
                  {shipment.cargoWeightTon !== null ? ` · ${shipment.cargoWeightTon} tấn` : ""} · {shipment.vehicleRequirement} · {money(shipment.listedPriceVnd)}
                </p>
                {shipment.pickupDate && shipment.pickupTimeFrom && shipment.pickupTimeTo ? (
                  <p className="mt-1 text-sm text-muted">
                    Lấy hàng: {civil(shipment.pickupDate)}, {shipment.pickupTimeFrom}–{shipment.pickupTimeTo}
                  </p>
                ) : null}
                {shipment.status === "MATCHED" && shipment.vehicleId === null ? <p className="mt-2 text-sm text-ink">Chưa phân công xe và tài xế.</p> : null}
                {shipment.status === "MATCHED" && shipment.vehicleId !== null ? (
                  <p className="mt-2 text-sm text-ink">
                    Xe: {shipment.vehicleLabel ?? "Xe đã phân công"}. Tài xế: {shipment.driverName ?? "Tài xế đã phân công"}. Chưa xác nhận lấy hàng.
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted">Mã đơn {shipment.id}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
