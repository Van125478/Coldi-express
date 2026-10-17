import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/workspace/carrier/fleet/FleetNav";
import { DetailBlock, FactLine, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { CarrierDriver } from "@/models/publishedShipment";
import { ApiError } from "@/services/apiClient";
import { getCarrierDriver, updateCarrierDriverName } from "@/services/shipmentService";

export function CarrierDriverProfile() {
  usePageTitle("Hồ sơ tài xế");
  const { id } = useParams();
  const [driver, setDriver] = useState<CarrierDriver | null>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
          <PageHeader title={driver.displayName ?? "Chưa có tên"} summary="Tài xế đã liên kết. Màn hình này không tạo tài khoản và không hiện mật khẩu." />
          <DetailBlock title="Hồ sơ">
            <FactLine term="Vai trò" value="Tài xế" />
            <FactLine term="Có thể phân công" value="Có, sau khi nhà xe đã nhận chuyến." />
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
            {notice ? <p className="text-sm text-ink">{notice}</p> : null}
          </DetailBlock>
        </>
      ) : null}
    </section>
  );
}
