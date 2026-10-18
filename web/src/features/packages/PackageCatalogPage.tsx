import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { catalogPrimaryCta } from "@/features/packages/packageNavigation";
import {
  commissionText,
  isProPlan,
  paymentNote,
  planTitle,
  priceBlock,
  vehicleCapText,
  type CatalogPlan,
  type PlanAudience,
} from "@/features/packages/planPresentation";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/cn";
import { listPackageCatalog, type PackagePlan } from "@/services/packageService";

const audiences = [
  { id: "SHIPPER" as const, label: "Chủ hàng" },
  { id: "CARRIER" as const, label: "Nhà xe" },
];

export function PackageCatalogPage() {
  usePageTitle("Gói dịch vụ");
  const { snapshot } = useAuth();
  const role = snapshot.status === "authenticated" ? snapshot.user.role : null;
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [audienceChoice, setAudienceChoice] = useState<PlanAudience | null>(null);
  const audience = audienceChoice ?? (role === "CARRIER" ? "CARRIER" : "SHIPPER");

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
  }, [reloadKey]);

  const visible = plans.filter((plan) => plan.audience === audience);
  const cta = catalogPrimaryCta(role);
  const note = paymentNote(plans);

  return (
    <section className="bg-canvas text-ink">
      <div className="guest-frame py-12 sm:py-16">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,24rem)] lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-navy">BẢNG GIÁ</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-balance text-navy-deep sm:text-5xl">Gói dịch vụ cho vận tải lạnh B2B</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Giá niêm yết, hoa hồng và trần xe lấy từ catalog đang công bố. Gói theo hợp đồng chưa có số cuối cùng thì ghi liên hệ báo giá. Tài xế không mua gói.
            </p>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-ink">Xem gói gắn với tài khoản</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Chủ hàng và nhà xe vào đúng trang gói của mình. Trang này không tạo thanh toán.</p>
            <Button asChild className="mt-4 w-full">
              <Link to={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4" role="tablist" aria-label="Đối tượng gói">
          <div className="inline-flex rounded-full border border-line bg-surface p-1">
            {audiences.map((item) => {
              const selected = audience === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn(
                    "min-h-11 rounded-full px-5 text-sm font-semibold",
                    selected ? "bg-navy text-white" : "text-ink hover:bg-canvas",
                  )}
                  onClick={() => setAudienceChoice(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted">{audience === "SHIPPER" ? "So sánh giá niêm yết và hoa hồng." : "So sánh giá niêm yết, hoa hồng và trần xe ACTIVE."}</p>
        </div>

        {state === "loading" ? <CatalogSkeleton /> : null}
        {state === "error" ? (
          <div role="alert" className="mt-8 rounded-3xl border border-line bg-surface px-6 py-8">
            <h2 className="text-xl font-extrabold text-ink">Không tải được bảng giá</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Kết nối tới catalog chưa thành công. Giá không được dựng tạm trên trang này.</p>
            <Button type="button" className="mt-5" onClick={() => {
              setState("loading");
              setReloadKey((value) => value + 1);
            }}>
              Tải lại bảng giá
            </Button>
          </div>
        ) : null}
        {state === "ready" && visible.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-line bg-surface px-6 py-10">
            <h2 className="text-xl font-extrabold text-ink">Chưa có gói cho nhóm này</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Catalog chưa công bố gói {audience === "SHIPPER" ? "chủ hàng" : "nhà xe"}.</p>
          </div>
        ) : null}
        {state === "ready" && visible.length > 0 ? (
          <>
            <ul className="mt-8 grid items-stretch gap-4 [grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))]">
              {visible.map((plan) => (
                <PlanCard key={plan.code} plan={plan} cta={cta} />
              ))}
            </ul>
            <ComparisonTable plans={visible} audience={audience} />
          </>
        ) : null}
        {note ? <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">{note}</p> : null}
      </div>
    </section>
  );
}

function PlanCard({ plan, cta }: { plan: PackagePlan; cta: { href: string; label: string } }) {
  const price = priceBlock(plan);
  const vehicles = vehicleCapText(plan);
  const pro = isProPlan(plan);
  return (
    <li
      data-emphasis={pro ? "pro" : "standard"}
      className={cn(
        "flex h-full flex-col rounded-3xl border bg-surface p-5",
        pro ? "border-navy shadow-[0_16px_40px_rgba(23,37,84,0.08)]" : "border-line",
      )}
    >
      <div className={cn("h-1.5 w-14 rounded-full", pro ? "bg-navy" : "bg-line")} aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{planTitle(plan)}</h2>
      <p className="mt-5 text-3xl font-extrabold tracking-tight text-navy-deep">{price.amount}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{price.cycle}</p>
      <dl className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-muted">Hoa hồng</dt>
          <dd className="font-semibold text-ink">{commissionText(plan)}</dd>
        </div>
        {vehicles ? (
          <div>
            <dt className="text-muted">Trần xe ACTIVE</dt>
            <dd className="font-semibold text-ink">{vehicles}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-auto pt-6">
        {price.quoted ? (
          <p className="text-sm leading-relaxed text-ink">Giá và hoa hồng chốt theo hợp đồng. Bảng giá không nhận số tự nhập.</p>
        ) : (
          <Link to={cta.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            {cta.label}
          </Link>
        )}
      </div>
    </li>
  );
}

function ComparisonTable({ plans, audience }: { plans: PackagePlan[]; audience: PlanAudience }) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-extrabold tracking-tight text-ink">So sánh gói {audience === "SHIPPER" ? "chủ hàng" : "nhà xe"}</h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Hạng mục</th>
              {plans.map((plan) => (
                <th key={plan.code} scope="col" className="px-4 py-3 font-semibold text-ink">
                  {planTitle(plan)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ComparisonRow label="Giá niêm yết" plans={plans} cell={(plan) => priceBlock(plan).amount} />
            <ComparisonRow label="Chu kỳ" plans={plans} cell={(plan) => priceBlock(plan).cycle} />
            <ComparisonRow label="Hoa hồng" plans={plans} cell={(plan) => commissionText(plan)} />
            {audience === "CARRIER" ? <ComparisonRow label="Trần xe ACTIVE" plans={plans} cell={(plan) => vehicleCapText(plan) ?? ""} /> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonRow({ label, plans, cell }: { label: string; plans: PackagePlan[]; cell: (plan: CatalogPlan) => string }) {
  return (
    <tr className="border-t border-line">
      <th scope="row" className="px-4 py-3 font-semibold text-muted">{label}</th>
      {plans.map((plan) => (
        <td key={plan.code} className="px-4 py-3 font-semibold text-ink">{cell(plan)}</td>
      ))}
    </tr>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-live="polite">
      <p className="sr-only">Đang tải bảng giá.</p>
      {["a", "b", "c", "d"].map((key) => (
        <div key={key} className="h-72 animate-pulse rounded-3xl bg-line/70" />
      ))}
    </div>
  );
}
