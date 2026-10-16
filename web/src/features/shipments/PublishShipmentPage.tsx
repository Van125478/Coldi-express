import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublishedShipment, TemperatureGroup } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { listMyShipments, publishShipment } from "@/services/shipmentService";

const temperatures: readonly { value: TemperatureGroup; label: string }[] = [
  { value: "COOL", label: "Lạnh mát" },
  { value: "FROZEN", label: "Đông" },
  { value: "DEEP_FROZEN", label: "Cực lạnh" },
];

type FieldName = "cargoDescription" | "pickupLocation" | "deliveryLocation" | "temperatureGroup" | "vehicleRequirement" | "listedPriceVnd";

type FormState = {
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
  temperatureGroup: TemperatureGroup | "";
  vehicleRequirement: string;
  listedPriceVnd: string;
};

const emptyForm: FormState = {
  cargoDescription: "",
  pickupLocation: "",
  deliveryLocation: "",
  temperatureGroup: "",
  vehicleRequirement: "",
  listedPriceVnd: "",
};

function money(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

function localErrors(form: FormState): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (form.cargoDescription.trim().length === 0) errors.cargoDescription = "Nhập mô tả hàng hóa.";
  if (form.pickupLocation.trim().length === 0) errors.pickupLocation = "Nhập điểm lấy hàng.";
  if (form.deliveryLocation.trim().length === 0) errors.deliveryLocation = "Nhập điểm giao hàng.";
  if (form.temperatureGroup === "") errors.temperatureGroup = "Chọn nhóm nhiệt.";
  if (form.vehicleRequirement.trim().length === 0) errors.vehicleRequirement = "Nhập yêu cầu xe.";
  if (!/^[1-9]\d*$/.test(form.listedPriceVnd)) errors.listedPriceVnd = "Nhập giá cước bằng số nguyên đồng, lớn hơn 0.";
  return errors;
}

export function PublishShipmentPage({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = localErrors(form);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || form.temperatureGroup === "") return;

    setPending(true);
    try {
      const body = await publishShipment({
        cargoDescription: form.cargoDescription.trim(),
        pickupLocation: form.pickupLocation.trim(),
        deliveryLocation: form.deliveryLocation.trim(),
        temperatureGroup: form.temperatureGroup,
        vehicleRequirement: form.vehicleRequirement.trim(),
        listedPriceVnd: Number(form.listedPriceVnd),
      });
      setPublished(body.shipment);
      setShipments((current) => [body.shipment, ...current.filter((item) => item.id !== body.shipment.id)]);
      setListState("ready");
      setForm(emptyForm);
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields) {
        setErrors(caught.fields as Partial<Record<FieldName, string>>);
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

      <form className="mt-8 space-y-8" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <fieldset className="space-y-4" disabled={pending}>
          <legend className="text-lg font-bold text-ink">Hàng hóa</legend>
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
          <Field label="Yêu cầu xe" id="vehicle-requirement" error={errors.vehicleRequirement}>
            <Input
              id="vehicle-requirement"
              value={form.vehicleRequirement}
              onChange={(event) => update("vehicleRequirement", event.target.value)}
              aria-invalid={errors.vehicleRequirement !== undefined}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4" disabled={pending}>
          <legend className="text-lg font-bold text-ink">Lộ trình</legend>
          <Field label="Điểm lấy hàng" id="pickup-location" error={errors.pickupLocation}>
            <Input
              id="pickup-location"
              value={form.pickupLocation}
              onChange={(event) => update("pickupLocation", event.target.value)}
              aria-invalid={errors.pickupLocation !== undefined}
            />
          </Field>
          <Field label="Điểm giao hàng" id="delivery-location" error={errors.deliveryLocation}>
            <Input
              id="delivery-location"
              value={form.deliveryLocation}
              onChange={(event) => update("deliveryLocation", event.target.value)}
              aria-invalid={errors.deliveryLocation !== undefined}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4" disabled={pending}>
          <legend className="text-lg font-bold text-ink">Cước niêm yết</legend>
          <Field label="Giá cước (đồng)" id="listed-price" error={errors.listedPriceVnd}>
            <Input
              id="listed-price"
              inputMode="numeric"
              value={form.listedPriceVnd}
              onChange={(event) => update("listedPriceVnd", event.target.value.replace(/\D/g, ""))}
              aria-invalid={errors.listedPriceVnd !== undefined}
            />
          </Field>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={pending}>
            {pending ? "Đang đăng đơn" : "Đăng đơn"}
          </Button>
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
            <div>Nhóm nhiệt: {published.temperatureLabel}</div>
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
        {listState === "ready" && shipments.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Chưa có đơn nào.</p>
        ) : null}
        {listState === "ready" && shipments.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {shipments.map((shipment) => (
              <li key={shipment.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{shipment.cargoDescription}</p>
                  <p className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-navy">{shipment.statusLabel}</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {shipment.pickupLocation} → {shipment.deliveryLocation}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {shipment.temperatureLabel} · {shipment.vehicleRequirement} · {money(shipment.listedPriceVnd)}
                </p>
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
