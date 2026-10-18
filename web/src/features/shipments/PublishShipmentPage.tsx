import { cloneElement, isValidElement, useEffect, useRef, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublishedShipment, PublishShipmentInput, TemperatureGroup } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { deleteCargoImage, uploadCargoImage } from "@/services/cargoImageClient";
import { shipmentFieldErrors, shipmentStepErrors, shipmentStepFields, type ShipmentFieldName } from "@/features/shipments/shipmentFieldRules";
import { publishShipment } from "@/services/shipmentService";

const temperatures: readonly { value: TemperatureGroup; label: string }[] = [
  { value: "COOL", label: "Lạnh mát" },
  { value: "FROZEN", label: "Đông" },
  { value: "DEEP_FROZEN", label: "Cực lạnh" },
];

const steps = ["Điểm bốc hàng", "Điểm giao hàng", "Hàng hóa và xe"] as const;

type Step = 1 | 2 | 3;

type FieldName = ShipmentFieldName;

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

const fieldMeta: Record<FieldName, { id: string; label: string }> = {
  pickupCompany: { id: "pickup-company", label: "Tên công ty / kho gửi" },
  pickupLocation: { id: "pickup-location", label: "Địa chỉ lấy hàng" },
  pickupContactName: { id: "pickup-contact", label: "Người bốc hàng" },
  pickupPhone: { id: "pickup-phone", label: "Số điện thoại lấy hàng" },
  pickupEmail: { id: "pickup-email", label: "Email nhận thông báo" },
  pickupDate: { id: "pickup-date", label: "Ngày lấy hàng" },
  pickupTimeFrom: { id: "pickup-from", label: "Giờ bắt đầu bốc hàng" },
  pickupTimeTo: { id: "pickup-to", label: "Giờ kết thúc bốc hàng" },
  deliveryCompany: { id: "delivery-company", label: "Tên công ty / kho nhận" },
  deliveryLocation: { id: "delivery-location", label: "Địa chỉ giao hàng" },
  deliveryContactName: { id: "delivery-contact", label: "Người nhận hàng" },
  deliveryPhone: { id: "delivery-phone", label: "Số điện thoại giao hàng" },
  deliveryEmail: { id: "delivery-email", label: "Email kho nhận" },
  deliveryDate: { id: "delivery-date", label: "Ngày giao hàng muộn nhất" },
  deliveryTimeFrom: { id: "delivery-from", label: "Giờ bắt đầu nhận hàng" },
  deliveryTimeTo: { id: "delivery-to", label: "Giờ kết thúc nhận hàng" },
  cargoDescription: { id: "cargo-description", label: "Mô tả hàng hóa" },
  temperatureGroup: { id: "temperature-group", label: "Nhóm nhiệt" },
  cargoWeightTon: { id: "cargo-weight", label: "Trọng lượng" },
  cargoVolumeM3: { id: "cargo-volume", label: "Thể tích" },
  packageCount: { id: "package-count", label: "Số thùng" },
  vehicleRequirement: { id: "vehicle-requirement", label: "Yêu cầu xe" },
  listedPriceVnd: { id: "listed-price", label: "Giá cước niêm yết" },
  cargoImages: { id: "cargo-images", label: "Ảnh hàng hóa" },
};

const stepFields = shipmentStepFields;
const timePartners: Partial<Record<keyof FormState, (keyof FormState)[]>> = {
  pickupTimeFrom: ["pickupTimeFrom", "pickupTimeTo"],
  pickupTimeTo: ["pickupTimeFrom", "pickupTimeTo"],
  deliveryTimeFrom: ["deliveryTimeFrom", "deliveryTimeTo"],
  deliveryTimeTo: ["deliveryTimeFrom", "deliveryTimeTo"],
};

function money(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

function civil(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function filled(value: string): string | null {
  const text = value.trim();
  return text === "" ? null : text;
}

function joinFilled(parts: Array<string | null>): string | null {
  const values = parts.filter((part): part is string => part !== null);
  return values.length > 0 ? values.join(" · ") : null;
}

function summaryRows(form: FormState): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const pickup = joinFilled([filled(form.pickupCompany), filled(form.pickupLocation)]);
  if (pickup) rows.push({ label: "Điểm lấy", value: pickup });
  const pickupWhen = joinFilled([
    form.pickupDate ? civil(form.pickupDate) : null,
    form.pickupTimeFrom && form.pickupTimeTo ? `${form.pickupTimeFrom}–${form.pickupTimeTo}` : filled(form.pickupTimeFrom) ?? filled(form.pickupTimeTo),
  ]);
  if (pickupWhen) rows.push({ label: "Lịch lấy", value: pickupWhen });
  const delivery = joinFilled([filled(form.deliveryCompany), filled(form.deliveryLocation)]);
  if (delivery) rows.push({ label: "Điểm giao", value: delivery });
  const deliveryWhen = joinFilled([
    form.deliveryDate ? civil(form.deliveryDate) : null,
    form.deliveryTimeFrom && form.deliveryTimeTo ? `${form.deliveryTimeFrom}–${form.deliveryTimeTo}` : filled(form.deliveryTimeFrom) ?? filled(form.deliveryTimeTo),
  ]);
  if (deliveryWhen) rows.push({ label: "Lịch giao", value: deliveryWhen });
  const cargo = filled(form.cargoDescription);
  if (cargo) rows.push({ label: "Hàng hóa", value: cargo });
  const temperature = temperatures.find((item) => item.value === form.temperatureGroup)?.label ?? null;
  if (temperature) rows.push({ label: "Nhóm nhiệt", value: temperature });
  const measure = joinFilled([
    filled(form.cargoWeightTon) ? `${form.cargoWeightTon.trim()} tấn` : null,
    filled(form.cargoVolumeM3) ? `${form.cargoVolumeM3.trim()} m³` : null,
    filled(form.packageCount) ? `${form.packageCount.trim()} thùng` : null,
  ]);
  if (measure) rows.push({ label: "Khối lượng", value: measure });
  const vehicle = filled(form.vehicleRequirement);
  if (vehicle) rows.push({ label: "Yêu cầu xe", value: vehicle });
  if (/^[1-9]\d*$/.test(form.listedPriceVnd)) rows.push({ label: "Giá niêm yết", value: money(Number(form.listedPriceVnd)) });
  return rows;
}

function measureValue(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function errorsForStep(form: FormState, step: Step, cargoImageCount: number): Partial<Record<FieldName, string>> {
  return shipmentStepErrors(form, step, cargoImageCount);
}

function toInput(form: FormState): Omit<PublishShipmentInput, "cargoImageIds"> {
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

type CargoDraft = { id: string; name: string; previewUrl: string };

export function PublishShipmentPage({ email }: { email: string }) {
  usePageTitle("Tạo đơn");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [published, setPublished] = useState<PublishedShipment | null>(null);
  const [images, setImages] = useState<CargoDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [focusRequest, setFocusRequest] = useState<FieldName | null>(null);
  const imagesRef = useRef<CargoDraft[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) URL.revokeObjectURL(image.previewUrl);
    };
  }, []);

  useEffect(() => {
    if (!focusRequest) return;
    document.getElementById(fieldMeta[focusRequest].id)?.focus();
  }, [focusRequest, step]);

  function focusFirst(names: FieldName[]) {
    const first = names[0];
    if (first) setFocusRequest(first);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      setErrors((existing) => {
        const related = timePartners[key] ?? [key];
        if (!related.some((name) => existing[name] != null)) return existing;
        const refreshed = shipmentFieldErrors(next, images.length);
        const copy = { ...existing };
        for (const name of related) {
          const message = refreshed[name];
          if (message) copy[name] = message;
          else delete copy[name];
        }
        return copy;
      });
      return next;
    });
  }

  function next() {
    const stepErrors = errorsForStep(form, step, images.length);
    setErrors(stepErrors);
    const names = Object.keys(stepErrors) as FieldName[];
    if (names.length > 0) {
      focusFirst(names);
      return;
    }
    setErrors({});
    setStep((current) => (current === 3 ? 3 : ((current + 1) as Step)));
  }

  async function addImages(list: FileList | null) {
    if (!list || pending || uploading) return;
    const selected = Array.from(list);
    const room = 5 - images.length;
    if (room <= 0 || selected.length > room) {
      setErrors((current) => ({ ...current, cargoImages: "Chỉ được tối đa 5 ảnh hàng hóa." }));
      focusFirst(["cargoImages"]);
      if (room <= 0) return;
    }
    setUploading(true);
    setFormError(null);
    let rejected = selected.length > room;
    try {
      for (const file of selected.slice(0, Math.max(room, 0))) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 2_000_000) {
          rejected = true;
          setErrors((current) => ({ ...current, cargoImages: "Ảnh hàng hóa dùng JPG, PNG hoặc WebP, mỗi ảnh không quá 2 MB." }));
          focusFirst(["cargoImages"]);
          continue;
        }
        const uploaded = await uploadCargoImage(file);
        setImages((current) => [...current, { id: uploaded.id, name: file.name, previewUrl: URL.createObjectURL(file) }]);
      }
      if (!rejected) {
        setErrors((current) => {
          if (!current.cargoImages) return current;
          const copy = { ...current };
          delete copy.cargoImages;
          return copy;
        });
      }
    } catch (caught) {
      setErrors((current) => ({
        ...current,
        cargoImages: caught instanceof ApiError ? caught.message : "Không tải được ảnh. Thông tin đã nhập vẫn được giữ.",
      }));
      focusFirst(["cargoImages"]);
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(id: string) {
    try {
      await deleteCargoImage(id);
      setImages((current) => {
        const target = current.find((item) => item.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return current.filter((item) => item.id !== id);
      });
    } catch (caught) {
      setErrors((current) => ({ ...current, cargoImages: caught instanceof ApiError ? caught.message : "Không xóa được ảnh." }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 3 || pending || uploading) return;
    const stepErrors = errorsForStep(form, 3, images.length);
    const dateError = shipmentFieldErrors(form, images.length).deliveryDate;
    if (dateError) stepErrors.deliveryDate = dateError;
    setErrors(stepErrors);
    const names = Object.keys(stepErrors) as FieldName[];
    if (names.length > 0) {
      if (stepErrors.deliveryDate && !names.some((name) => stepFields[3].includes(name) && name !== "deliveryDate")) setStep(2);
      focusFirst(names);
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const body = await publishShipment({ ...toInput(form), cargoImageIds: images.map((image) => image.id) });
      for (const image of images) URL.revokeObjectURL(image.previewUrl);
      setImages([]);
      setPublished(body.shipment);
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
        focusFirst(names as FieldName[]);
      } else {
        setFormError(caught instanceof ApiError ? caught.message : "Không đăng được đơn. Hãy thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
      <p className="text-sm font-semibold tracking-[0.14em] text-navy">BƯỚC {step}/3</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Tạo đơn vận chuyển</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        {email} đăng đơn ở trạng thái Đang tìm xe. Đơn chưa gán nhà xe, xe hoặc tài xế, và chưa phải thanh toán.
      </p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
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

      <form className="mt-6 space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-6" onSubmit={(event) => void handleSubmit(event)} noValidate>
        {step === 1 ? (
          <fieldset className="space-y-4" disabled={pending}>
            <legend className="text-lg font-bold text-ink">Địa chỉ kho gửi và lấy hàng</legend>
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
            <Field label="Email nhận thông báo" id="pickup-email" required={false} error={errors.pickupEmail}>
              <Input id="pickup-email" type="email" value={form.pickupEmail} onChange={(event) => update("pickupEmail", event.target.value)} aria-invalid={errors.pickupEmail !== undefined} />
            </Field>
            <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Ngày lấy hàng" id="pickup-date" error={errors.pickupDate} hint={form.pickupDate ? civil(form.pickupDate) : undefined}>
              <Input id="pickup-date" lang="vi" type="date" value={form.pickupDate} onChange={(event) => update("pickupDate", event.target.value)} aria-invalid={errors.pickupDate !== undefined} />
            </Field>
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
            <Field label="Email kho nhận" id="delivery-email" required={false} error={errors.deliveryEmail}>
              <Input id="delivery-email" type="email" value={form.deliveryEmail} onChange={(event) => update("deliveryEmail", event.target.value)} aria-invalid={errors.deliveryEmail !== undefined} />
            </Field>
            <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Ngày giao hàng muộn nhất" id="delivery-date" error={errors.deliveryDate} hint={form.deliveryDate ? civil(form.deliveryDate) : undefined}>
              <Input id="delivery-date" lang="vi" type="date" value={form.deliveryDate} onChange={(event) => update("deliveryDate", event.target.value)} aria-invalid={errors.deliveryDate !== undefined} />
            </Field>
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
            <p className="text-sm leading-relaxed text-muted">Nhập mô tả hàng, nhóm nhiệt, khối lượng và giá niêm yết. Giá do chủ hàng nhập.</p>
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
            <fieldset className="space-y-2">
              <legend id="temperature-group" tabIndex={-1} className="text-sm font-semibold text-ink outline-none">
                Nhóm nhiệt <span className="text-danger">*</span>
              </legend>
              <div role="radiogroup" aria-labelledby="temperature-group" aria-invalid={errors.temperatureGroup !== undefined} className="flex flex-wrap gap-2">
                {temperatures.map((item) => {
                  const selected = form.temperatureGroup === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${selected ? "bg-navy text-white" : "border border-line text-ink"}`}
                      onClick={() => update("temperatureGroup", item.value)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted">Lạnh mát, Đông hoặc Cực lạnh. Không tự quy ra độ C.</p>
              {errors.temperatureGroup ? <p className="text-sm text-ink">{errors.temperatureGroup}</p> : null}
            </fieldset>
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
            <div className={`space-y-3 rounded-2xl border p-4 ${errors.cargoImages ? "border-danger" : "border-line"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label htmlFor="cargo-images" className="text-sm font-semibold text-ink">
                    Ảnh hàng hóa <span className="text-danger">*</span>
                  </label>
                  <p id="cargo-images-hint" className="mt-1 text-sm text-muted">Đã chọn {images.length}/5. Giới hạn kỹ thuật tạm thời: JPG, PNG hoặc WebP, tối đa 2 MB mỗi ảnh.</p>
                </div>
                <input
                  id="cargo-images"
                  aria-invalid={errors.cargoImages !== undefined}
                  aria-describedby={errors.cargoImages ? "cargo-images-error" : "cargo-images-hint"}
                  className="block max-w-full text-sm"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={pending || uploading || images.length >= 5}
                  onChange={(event) => {
                    void addImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>
              {uploading ? <p className="text-sm text-muted">Đang tải ảnh lên.</p> : null}
              {errors.cargoImages ? <p id="cargo-images-error" className="text-sm text-ink">{errors.cargoImages}</p> : null}
              {images.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {images.map((image) => (
                    <li key={image.id} className="space-y-2">
                      <img src={image.previewUrl} alt={image.name} className="h-24 w-full rounded-xl border border-line object-cover" />
                      <button type="button" className="text-sm font-semibold text-navy underline-offset-4 hover:underline" onClick={() => void removeImage(image.id)}>
                        Xóa ảnh
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
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
            <Button type="button" variant="outline" disabled={pending} onClick={() => setStep((current) => {
              const previous = (current === 1 ? 1 : current - 1) as Step;
              const allowed = new Set(stepFields[previous]);
              setErrors((existing) => Object.fromEntries(Object.entries(existing).filter(([name]) => allowed.has(name as FieldName))) as Partial<Record<FieldName, string>>);
              return previous;
            })}>
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
        </div>
        {formError ? (
          <p role="alert" className="text-sm leading-relaxed text-ink">
            {formError}
          </p>
        ) : null}
      </form>

      {published ? (
        <div role="status" className="mt-8 rounded-2xl border border-success-line bg-success-bg p-5">
          <p className="text-sm font-semibold text-success">Đăng đơn thành công. Đơn đang tìm xe.</p>
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
          <Link to={`${paths.shipperShipments}/${published.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Xem đơn
          </Link>
        </div>
      ) : null}
      </div>
      <aside className="rounded-2xl border border-line bg-surface p-5 xl:sticky xl:top-24">
        <h2 className="text-sm font-bold text-navy">Thông tin đã nhập</h2>
        <ol className="mt-4 space-y-3 text-sm">
          {steps.map((label, index) => (
            <li key={label} className={step === index + 1 ? "font-semibold text-navy" : "text-muted"}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        <dl className="mt-5 space-y-3 text-sm">
          {summaryRows(form).map((row) => (
            <div key={row.label}>
              <dt className="text-muted">{row.label}</dt>
              <dd className="font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
        {summaryRows(form).length === 0 ? <p className="mt-5 text-sm text-muted">Chưa nhập thông tin.</p> : null}
      </aside>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  required = true,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean; className?: string }>, {
        "aria-describedby": error ? errorId : undefined,
        "aria-invalid": error ? true : undefined,
        className: error ? `${(children.props as { className?: string }).className ?? ""} border-danger`.trim() : (children.props as { className?: string }).className,
      })
    : children;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-danger"> *</span> : <span className="font-normal text-muted"> (không bắt buộc)</span>}
      </Label>
      {control}
      {error ? (
        <p id={errorId} className="text-sm text-ink">
          {error}
        </p>
      ) : null}
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
