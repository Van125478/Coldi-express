import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { formatRate, formatVnd, formatWhen } from "@/features/packages/formatPlan";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError } from "@/services/apiClient";
import { activateDemoPlan, getMyPlan, listPackageCatalog, scheduleDowngrade, type Entitlements, type PackagePlan, type PlanView } from "@/services/packageService";

export function AccountPlanPage() {
  usePageTitle("Gói dịch vụ");
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [current, setCurrent] = useState<{ plan: PlanView; entitlements: Entitlements } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [contractPrice, setContractPrice] = useState("");
  const [contractRate, setContractRate] = useState("");
  const [contractCap, setContractCap] = useState("");

  function load() {
    return Promise.all([listPackageCatalog(), getMyPlan()]).then(([catalog, mine]) => {
      setPlans(catalog.plans.filter((plan) => plan.audience === mine.entitlements.role));
      setCurrent(mine);
      setState("ready");
    });
  }

  useEffect(() => {
    let active = true;
    load()
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function activate(plan: PackagePlan) {
    setNotice(null);
    setPendingCode(plan.code);
    try {
      const contract = plan.quoteRequired ? readContract(plan, contractPrice, contractRate, contractCap) : undefined;
      if (plan.quoteRequired && !contract) {
        setNotice("Nhập giá, tỷ lệ basis point và trần xe nếu gói yêu cầu. Không dùng mức giữa của khoảng giá.");
        return;
      }
      const result = await activateDemoPlan({
        planCode: plan.code,
        idempotencyKey: crypto.randomUUID(),
        ...(contract ? { contract } : {}),
      });
      setNotice(result.label);
      await load();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Không kích hoạt được gói.");
    } finally {
      setPendingCode(null);
    }
  }

  async function downgrade() {
    setNotice(null);
    setPendingCode("downgrade");
    try {
      const result = await scheduleDowngrade(crypto.randomUUID());
      setNotice(`${result.label} Lịch về Free có hiệu lực cuối kỳ.`);
      await load();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Không đặt lịch hạ gói.");
    } finally {
      setPendingCode(null);
    }
  }

  const entitlements = current?.entitlements;
  const carrier = entitlements?.role === "CARRIER";

  return (
    <section className="space-y-6">
      <PageHeader title="Gói dịch vụ" summary="Gói gắn với tài khoản đang đăng nhập. Kích hoạt trên môi trường Demo không tạo thanh toán." />
      {state === "loading" ? <p className="text-sm text-muted">Đang tải gói.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được gói. Hãy tải lại trang.
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
          {notice}
        </p>
      ) : null}
      {entitlements && current ? (
        <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-navy uppercase">Gói hiện tại</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">{current.plan.name}</h2>
          <p className="mt-2 text-sm font-semibold text-ink">{current.plan.label}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Fact term="Giá gói" value={current.plan.priceVnd == null ? "Chưa có số cố định" : formatVnd(current.plan.priceVnd)} />
            <Fact term="Hoa hồng" value={current.plan.rateBps == null ? "Theo hợp đồng" : formatRate(current.plan.rateBps)} />
            <Fact term="Hiệu lực đến" value={formatWhen(current.plan.endsAt)} />
            <Fact term="Về Free" value={current.plan.scheduledDowngradeAt ? formatWhen(current.plan.scheduledDowngradeAt) : "Chưa đặt lịch"} />
            {carrier ? <Fact term="Xe hoạt động" value={`${entitlements.activeVehicleCount} / ${entitlements.vehicleCap ?? "—"}`} /> : null}
          </dl>
          {carrier && entitlements.overLimit ? (
            <p role="alert" className="mt-4 text-sm font-semibold text-ink">
              Đang vượt trần xe. Không nhận chuyến mới và không thêm xe hoạt động. Chuyến đã nhận, phân công, lấy hàng, GPS và giao hàng vẫn tiếp tục. Hãy lưu trữ xe không dùng.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {carrier ? (
              <Link to={paths.carrierFleet} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold text-navy">
                Xem đội xe
              </Link>
            ) : null}
            <Link to={paths.packages} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
              Bảng giá công khai
            </Link>
            {current.plan.demo ? (
              <Button type="button" variant="outline" disabled={pendingCode !== null} onClick={() => void downgrade()}>
                Đặt lịch về Free cuối kỳ
              </Button>
            ) : null}
          </div>
        </article>
      ) : null}
      {entitlements?.demoActivationAvailable ? (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-ink">Kích hoạt Demo</h2>
          <p className="text-sm text-muted">Demo — không phát sinh thanh toán. Đổi gói trả phí giữa kỳ chưa được hỗ trợ.</p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {plans.filter((plan) => !plan.code.endsWith("-free")).map((plan) => (
              <li key={plan.code} className="rounded-2xl border border-line bg-surface p-4">
                <h3 className="font-bold text-ink">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.quoteRequired ? "Liên hệ báo giá" : plan.listPriceLabel}</p>
                <p className="text-sm text-ink">Hoa hồng {plan.rateBps == null ? plan.rateLabel : formatRate(plan.rateBps)}</p>
                {plan.vehicleCap != null ? <p className="text-sm text-ink">Tối đa {plan.vehicleCap} xe hoạt động</p> : null}
                {plan.quoteRequired ? (
                  <div className="mt-3 grid gap-2">
                    <label className="text-sm text-ink">
                      Giá hợp đồng (VND)
                      <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" inputMode="numeric" value={contractPrice} onChange={(event) => setContractPrice(event.target.value)} />
                    </label>
                    <label className="text-sm text-ink">
                      Tỷ lệ basis point
                      <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" inputMode="numeric" value={contractRate} onChange={(event) => setContractRate(event.target.value)} />
                    </label>
                    {plan.code === "carrier-enterprise" ? (
                      <label className="text-sm text-ink">
                        Trần xe hợp đồng
                        <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" inputMode="numeric" value={contractCap} onChange={(event) => setContractCap(event.target.value)} />
                      </label>
                    ) : null}
                  </div>
                ) : null}
                <Button type="button" className="mt-3" disabled={pendingCode !== null} onClick={() => void activate(plan)}>
                  Kích hoạt bản Demo
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : state === "ready" ? (
        <p className="text-sm text-muted">Môi trường này không mở tự kích hoạt gói trả phí.</p>
      ) : null}
    </section>
  );
}

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{term}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function readContract(plan: PackagePlan, price: string, rate: string, cap: string): { priceVnd: number; rateBps: number; vehicleCap?: number } | null {
  const priceVnd = Number(price);
  const rateBps = Number(rate);
  if (!Number.isInteger(priceVnd) || !Number.isInteger(rateBps)) return null;
  if (plan.code === "carrier-enterprise") {
    const vehicleCap = Number(cap);
    if (!Number.isInteger(vehicleCap)) return null;
    return { priceVnd, rateBps, vehicleCap };
  }
  return { priceVnd, rateBps };
}
