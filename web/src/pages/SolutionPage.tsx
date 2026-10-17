import { Link, useParams } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { solutions, type SolutionId } from "@/content/publicCopy";
import { BenefitList, ClosingBand, Journey, PublicHero } from "@/features/guest/public/PublicStory";
import cargoStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import doorsStill from "@/features/transition-lab/keyframe-02-doors-closing.jpg";
import rearStill from "@/features/transition-lab/keyframe-03-closed-rear.jpg";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";
import { usePageTitle } from "@/hooks/usePageTitle";

function isSolutionId(value: string | undefined): value is SolutionId {
  return value === "chu-hang" || value === "nha-xe";
}

const scenes = {
  "chu-hang": {
    hero: cargoStill,
    heroAlt: "Khoang lạnh mở, hàng rau quả đã xếp trong thùng xe.",
    aside: doorsStill,
    asideAlt: "Cửa xe lạnh đang khép lại sau khi xếp hàng.",
  },
  "nha-xe": {
    hero: roadStill,
    heroAlt: "Xe lạnh trên đường đêm, nhìn từ phía trên.",
    aside: rearStill,
    asideAlt: "Đuôi xe lạnh đã đóng cửa, sẵn sàng lên đường.",
  },
} as const;

export function SolutionPage() {
  const { audience } = useParams();
  const known = isSolutionId(audience);
  const solution = known ? solutions[audience] : null;
  usePageTitle(solution?.pageTitle ?? "Giải pháp đối tác");

  if (!solution || !known) {
    return (
      <div className="guest-frame py-16">
        <h1 className="text-3xl font-extrabold text-navy">Không có giải pháp này</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink">Trang đối tác chỉ mô tả Chủ hàng và Nhà xe.</p>
        <Link to={paths.home} className="mt-6 inline-flex min-h-11 items-center font-semibold text-navy">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const scene = scenes[audience];
  return (
    <>
      <PublicHero
        eyebrow={solution.eyebrow}
        title={solution.title}
        lede={solution.lede}
        image={scene.hero}
        imageAlt={scene.heroAlt}
        href={authPath(solution.action, solution.action === "publish" ? paths.publish : paths.carrierFind)}
        cta={solution.cta}
      />
      <BenefitList title={solution.benefitsTitle} items={solution.benefits} />
      <Journey title={solution.journeyTitle} steps={solution.journey} aside={{ image: scene.aside, imageAlt: scene.asideAlt }} />
      {"fleetTitle" in solution ? (
        <section className="border-t border-line bg-canvas text-ink">
          <div className="guest-frame grid items-center gap-8 py-16 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-6">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{solution.fleetTitle}</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{solution.fleet}</p>
            </div>
            <p className="border-t-2 border-navy pt-4 text-lg leading-relaxed font-semibold text-ink lg:col-span-5 lg:col-start-8">
              Xe và tài xế được chọn sau khi nhà xe đã nhận chuyến.
            </p>
          </div>
        </section>
      ) : null}
      <ClosingBand
        title={solution.cta}
        body={known === true && audience === "nha-xe" ? "Sàn chuyến mở trong khu nhà xe sau khi đăng nhập." : "Đăng đơn mở trong khu chủ hàng sau khi đăng nhập."}
        links={[{ href: authPath(solution.action, solution.action === "publish" ? paths.publish : paths.carrierFind), label: solution.cta }]}
      />
    </>
  );
}
