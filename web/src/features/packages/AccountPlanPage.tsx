import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { formatRate, formatVnd, formatWhen } from "@/features/packages/formatPlan";
import { activeVehicleText, annualComparisonNote, billingChoiceLabel, commissionText, isProPlan, planTitle, priceBlock, termCopy, vehicleCapText, visualTiers } from "@/features/packages/planPresentation";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/cn";
import { ApiError } from "@/services/apiClient";
import { activateDemoPlan, endDemoPlan, getMyPlan, listPackageCatalog, scheduleDowngrade, type Entitlements, type PackagePlan, type PlanView } from "@/services/packageService";

type Notice = { tone: "status" | "alert"; text: string };

export function AccountPlanPage() {
  usePageTitle("Gói dịch vụ");
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const [current, setCurrent] = useState<{ plan: PlanView; entitlements: Entitlements } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [proChoice, setProChoice] = useState<"MONTH" | "YEAR" | null>(null);

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
  }, [reloadKey]);

  async function activate(plan: { code: string; quoteRequired: boolean }) {
    setNotice(null);
    if (plan.quoteRequired) {
      setNotice({ tone: "alert", text: "Gói theo hợp đồng cần điều khoản đã được máy chủ phê duyệt. Tài khoản không tự nhập giá, tỷ lệ hay trần xe." });
      return;
    }
    setPendingCode(plan.code);
    try {
      const result = await activateDemoPlan({
        planCode: plan.code,
        idempotencyKey: crypto.randomUUID(),
      });
      setNotice({ tone: "status", text: result.label });
      await load();
    } catch (error) {
      setNotice({ tone: "alert", text: error instanceof ApiError ? error.message : "Không kích hoạt được gói." });
    } finally {
      setPendingCode(null);
    }
  }

  async function endDemo() {
    setNotice(null);
    setPendingCode("end-demo");
    try {
      const result = await endDemoPlan(crypto.randomUUID());
      setConfirmEnd(false);
      setNotice({ tone: "status", text: `Đã kết thúc gói Demo và về Free. ${result.label}.` });
      await load();
    } catch (error) {
      setNotice({ tone: "alert", text: error instanceof ApiError ? error.message : "Không kết thúc được gói Demo." });
    } finally {
      setPendingCode(null);
    }
  }

  async function downgrade() {
    setNotice(null);
    setPendingCode("downgrade");
    try {
      const result = await scheduleDowngrade(crypto.randomUUID());
      setNotice({ tone: "status", text: `Đã đặt lịch về Free vào cuối kỳ. ${result.label}.` });
      await load();
    } catch (error) {
      setNotice({ tone: "alert", text: error instanceof ApiError ? error.message : "Không đặt lịch hạ gói." });
    } finally {
      setPendingCode(null);
    }
  }

  const entitlements = current?.entitlements;
  const carrier = entitlements?.role === "CARRIER";
  const [viewedAt] = useState(() => Date.now());
  const term = current ? termCopy(current.plan.endsAt, new Date(viewedAt)) : null;
  const paidInTerm = Boolean(current?.plan.demo) && term?.tone === "open";
  const downgradeScheduled = Boolean(current?.plan.scheduledDowngradeAt);
  const currentCatalog = plans.find((plan) => plan.code === current?.plan.code);
  const proCycle = proChoice ?? (currentCatalog?.billingCycle === "YEAR" ? "YEAR" : "MONTH");
  const offerTiers = visualTiers(plans).filter((tier) => tier.id !== "free");

  return (
    <section className="space-y-6">
      <PageHeader title="Gói dịch vụ" summary="Gói gắn với tài khoản đang đăng nhập. Kích hoạt Demo không tạo giao dịch thanh toán." />
      {state === "loading" ? <p className="text-sm text-muted" aria-live="polite">Đang tải gói.</p> : null}
      {state === "error" ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-sm font-semibold text-ink">Không tải được gói.</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => {
            setState("loading");
            setReloadKey((value) => value + 1);
          }}>
            Tải lại
          </Button>
        </div>
      ) : null}
      {notice ? (
        <p role={notice.tone === "alert" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", notice.tone === "alert" ? "border-warning-line bg-warning-bg text-ink" : "border-line bg-surface text-ink")}>
          {notice.text}
        </p>
      ) : null}
      {entitlements && current && term ? (
        <article className={cn("rounded-3xl border p-5 sm:p-7", entitlements.overLimit || term.tone === "expired" ? "border-warning-line bg-warning-bg" : "border-navy bg-navy text-white")}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-xs font-semibold tracking-[0.14em] uppercase", entitlements.overLimit || term.tone === "expired" ? "text-warning" : "text-white/70")}>Gói hiện tại</p>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", entitlements.overLimit || term.tone === "expired" ? "bg-surface text-warning" : "bg-white/15 text-white")}>{term.label}</span>
            {entitlements.overLimit ? <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-warning">OVER_LIMIT</span> : null}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{currentCatalog && isProPlan(currentCatalog) ? "Pro" : currentCatalog ? planTitle(currentCatalog) : current.plan.name ?? "Gói hiện tại"}</h2>
          {currentCatalog && isProPlan(currentCatalog) ? <p className={cn("mt-1 text-sm font-semibold", entitlements.overLimit || term.tone === "expired" ? "text-ink" : "text-white/80")}>{billingChoiceLabel(currentCatalog)} · {priceBlock(currentCatalog).cycle}. Tài khoản giữ đúng lựa chọn thanh toán này.</p> : null}
          <p className={cn("mt-4 text-sm", entitlements.overLimit || term.tone === "expired" ? "text-muted" : "text-white/70")}>Hoa hồng</p>
          <p className="text-4xl font-extrabold tracking-tight">{current.plan.rateBps == null ? "Theo hợp đồng" : formatRate(current.plan.rateBps)}</p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <Fact muted={entitlements.overLimit || term.tone === "expired"} term="Giá gói" value={current.plan.priceVnd == null ? "Chưa có số cố định" : `${formatVnd(current.plan.priceVnd)}${currentCatalog ? ` · ${priceBlock(currentCatalog).cycle}` : ""}`} />
            <Fact muted={entitlements.overLimit || term.tone === "expired"} term="Hiệu lực đến" value={term.until} />
            <Fact muted={entitlements.overLimit || term.tone === "expired"} term="Bắt đầu" value={formatWhen(current.plan.startsAt)} />
            <Fact muted={entitlements.overLimit || term.tone === "expired"} term="Về Free" value={current.plan.scheduledDowngradeAt ? formatWhen(current.plan.scheduledDowngradeAt) : "Chưa đặt lịch"} />
            {carrier ? <Fact muted={entitlements.overLimit || term.tone === "expired"} term="Xe ACTIVE" value={activeVehicleText(entitlements.activeVehicleCount, entitlements.vehicleCap)} /> : null}
          </dl>
          {carrier && entitlements.overLimit ? (
            <p role="alert" className="mt-5 text-sm font-semibold text-ink">
              Đang vượt trần xe. Không nhận chuyến mới và không thêm xe hoạt động. Chuyến đã nhận, phân công, lấy hàng, GPS và giao hàng vẫn tiếp tục. Hãy lưu trữ xe không dùng.
            </p>
          ) : null}
          {term.tone === "expired" ? <p className="mt-5 text-sm font-semibold">Kỳ sử dụng đã kết thúc. Hiệu lực thương mại trở về Free khi máy chủ ghi nhận hết hạn.</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {carrier ? (
              <Link to={paths.carrierFleet} className={cn("inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold", entitlements.overLimit || term.tone === "expired" ? "border border-line bg-surface text-navy" : "bg-white text-navy")}>
                Xem đội xe
              </Link>
            ) : null}
            <Link to={paths.packages} className={cn("inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline", entitlements.overLimit || term.tone === "expired" ? "text-navy" : "text-white")}>
              Bảng giá công khai
            </Link>
            {paidInTerm && downgradeScheduled ? (
              <p className={cn("inline-flex min-h-11 items-center text-sm font-semibold", entitlements.overLimit ? "text-ink" : "text-white")}>
                Đã đặt lịch về Free · {formatWhen(current.plan.scheduledDowngradeAt ?? "")}
              </p>
            ) : null}
            {paidInTerm && !downgradeScheduled ? (
              <Button type="button" variant="outline" className={entitlements.overLimit || term.tone === "expired" ? "" : "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"} disabled={pendingCode !== null} onClick={() => void downgrade()}>
                Đặt lịch về Free cuối kỳ
              </Button>
            ) : null}
            {entitlements.demoActivationAvailable && paidInTerm ? (
              <Button type="button" variant="outline" className={entitlements.overLimit ? "" : "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"} disabled={pendingCode !== null} onClick={() => setConfirmEnd(true)}>
                Kết thúc gói Demo và về Free ngay
              </Button>
            ) : null}
          </div>
        </article>
      ) : null}
      {entitlements?.demoActivationAvailable ? (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-ink">Kích hoạt Demo</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">Demo — không phát sinh thanh toán. Đổi gói trả phí giữa kỳ chưa được hỗ trợ. Pro theo tháng và Pro theo năm là hai lựa chọn của cùng bậc Pro. Nút kích hoạt vẫn chọn đúng lựa chọn đó.</p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {offerTiers.map((tier) => {
              const selected = tier.id === "pro" ? (tier.plans.find((plan) => plan.billingCycle === proCycle) ?? tier.plans[0]) : tier.plans[0];
              const active = current?.plan.code === selected.code && paidInTerm;
              const blocked = paidInTerm && current?.plan.code !== selected.code;
              const price = priceBlock(selected);
              const vehicles = vehicleCapText(selected);
              const comparison = annualComparisonNote(selected);
              return (
                <li key={tier.id} className={cn("rounded-2xl border bg-surface p-4", active ? "border-navy" : "border-line")}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-ink">{tier.title}</h3>
                    {active ? <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">Đang sử dụng</span> : null}
                    {blocked ? <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink">Chưa hỗ trợ đổi giữa kỳ</span> : null}
                  </div>
                  {tier.id === "pro" && tier.plans.length > 1 ? (
                    <div className="mt-3 inline-flex rounded-full border border-line bg-canvas p-1" role="radiogroup" aria-label="Chu kỳ thanh toán của Pro">
                      {tier.plans.map((plan) => {
                        const checked = plan.code === selected.code;
                        const using = current?.plan.code === plan.code && paidInTerm;
                        return (
                          <button
                            key={plan.code}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            className={cn("min-h-11 rounded-full px-4 text-sm font-semibold", checked ? "bg-navy text-white" : "text-ink")}
                            onClick={() => setProChoice(plan.billingCycle === "YEAR" ? "YEAR" : "MONTH")}
                          >
                            {billingChoiceLabel(plan)}{using ? " · đang dùng" : ""}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  <p className="mt-2 text-lg font-extrabold text-navy">{price.amount}</p>
                  <p className="text-sm font-semibold text-ink">{price.cycle}</p>
                  {comparison ? <p className="mt-1 text-sm leading-relaxed text-muted">{comparison}</p> : null}
                  <p className="mt-2 text-sm font-semibold text-ink">Hoa hồng {commissionText(selected)}</p>
                  {vehicles ? <p className="text-sm text-ink">{vehicles}</p> : null}
                  {selected.quoteRequired ? <p className="mt-3 text-sm leading-relaxed text-ink">Liên hệ báo giá. Điều khoản hợp đồng không nhập từ màn hình này.</p> : null}
                  {blocked ? <p className="mt-3 text-sm leading-relaxed text-ink">Đổi giữa hai gói trả phí trong kỳ hạn chưa được duyệt. Có thể đặt lịch về Free khi hết kỳ.</p> : null}
                  {selected.quoteRequired || active || blocked ? null : (
                    <Button type="button" className="mt-3" disabled={pendingCode !== null} onClick={() => void activate(selected)}>
                      Kích hoạt bản Demo
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : state === "ready" ? (
        <p className="text-sm text-muted">Môi trường này không mở tự kích hoạt gói trả phí.</p>
      ) : null}
      {confirmEnd ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1E293B]/40 p-4 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="end-demo-title" className="w-full max-w-md rounded-2xl border border-line bg-surface p-5">
            <h2 id="end-demo-title" className="text-lg font-bold text-ink">Kết thúc gói Demo và về Free ngay</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">Thao tác chỉ có trên môi trường Demo được máy chủ cho phép. Lịch sử gói được giữ. Chuyến đang chạy và xe không bị xóa. Nếu số xe hoạt động vượt trần Free, tài khoản chuyển OVER_LIMIT.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={pendingCode !== null} onClick={() => setConfirmEnd(false)}>Huỷ</Button>
              <Button type="button" disabled={pendingCode !== null} onClick={() => void endDemo()}>{pendingCode === "end-demo" ? "Đang xử lý" : "Xác nhận về Free"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Fact({ term, value, muted }: { term: string; value: string; muted: boolean }) {
  return (
    <div>
      <dt className={muted ? "text-muted" : "text-white/70"}>{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
