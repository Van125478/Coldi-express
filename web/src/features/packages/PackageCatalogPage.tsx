import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { formatRate, formatVnd } from "@/features/packages/formatPlan";
import { usePageTitle } from "@/hooks/usePageTitle";
import { listPackageCatalog, type PackagePlan } from "@/services/packageService";

export function PackageCatalogPage() {
  usePageTitle("Gói dịch vụ");
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    listPackageCatalog()
      .then((body) => {
        if (!active) return;
        setPlans(body.plans);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 px-5 py-10 sm:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-navy uppercase">Bảng giá</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Gói dịch vụ COLDI</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Giá niêm yết và tỷ lệ hoa hồng là baseline thương mại. Gói theo hợp đồng chưa có số cuối cùng thì ghi liên hệ báo giá. Website chưa thu tiền.
        </p>
      </div>
      {state === "loading" ? <p className="text-sm text-muted">Đang tải bảng giá.</p> : null}
      {state === "error" ? (
        <p role="alert" className="text-sm text-ink">
          Không tải được bảng giá. Hãy tải lại trang.
        </p>
      ) : null}
      {state === "ready" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <PlanColumn title="Chủ hàng" plans={plans.filter((plan) => plan.audience === "SHIPPER")} />
          <PlanColumn title="Nhà xe" plans={plans.filter((plan) => plan.audience === "CARRIER")} />
        </div>
      ) : null}
      <p className="text-sm text-muted">
        Đã có tài khoản? <Link to={paths.login} className="font-semibold text-navy underline-offset-4 hover:underline">Đăng nhập</Link> để xem gói đang dùng.
      </p>
    </section>
  );
}

function PlanColumn({ title, plans }: { title: string; plans: PackagePlan[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-ink">{title}</h2>
      <ul className="space-y-3">
        {plans.map((plan) => (
          <li key={plan.code} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
              <p className="text-sm font-semibold text-navy">{plan.quoteRequired ? "Liên hệ báo giá" : plan.priceVnd == null ? plan.listPriceLabel : formatVnd(plan.priceVnd)}</p>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Hoa hồng</dt>
                <dd className="font-semibold text-ink">{plan.rateBps == null ? plan.rateLabel : formatRate(plan.rateBps)}</dd>
              </div>
              <div>
                <dt className="text-muted">Xe hoạt động tối đa</dt>
                <dd className="font-semibold text-ink">{plan.vehicleCap == null ? "Không áp trần xe" : `${plan.vehicleCap} xe`}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
