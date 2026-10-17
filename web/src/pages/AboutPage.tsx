import { authPath, paths } from "@/app/paths";
import { aboutStory } from "@/content/publicCopy";
import { ClosingBand, PublicHero } from "@/features/guest/public/PublicStory";
import riseStill from "@/features/transition-lab/keyframe-rise-midpoint.jpg";
import { usePageTitle } from "@/hooks/usePageTitle";

export function AboutPage() {
  usePageTitle("Về chúng tôi");

  return (
    <>
      <PublicHero
        eyebrow={aboutStory.eyebrow}
        title={aboutStory.title}
        lede={aboutStory.lede}
        image={riseStill}
        imageAlt="Xe lạnh trên đường, nhìn từ trên cao giữa hành trình."
        href={paths.shipperSolution}
        cta="Xem giải pháp cho chủ hàng"
      />
      <section className="bg-canvas text-ink">
        <div className="guest-frame grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-navy uppercase">Vấn đề</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{aboutStory.problemTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">{aboutStory.problem}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-navy uppercase">Cách COLDI làm</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{aboutStory.approachTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">{aboutStory.approach}</p>
          </div>
        </div>
      </section>
      <section className="bg-surface text-ink">
        <div className="guest-frame py-16 sm:py-20">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ai dùng COLDI</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {aboutStory.audiences.map((item, index) => (
              <li key={item.label} className="border-t-2 border-navy pt-4">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-navy">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{item.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="bg-canvas text-ink">
        <div className="guest-frame py-16 sm:py-20">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-navy uppercase">Phạm vi ưu tiên</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{aboutStory.pilotTitle}</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{aboutStory.pilotNote}</p>
          <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-2">
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.18em] text-navy">ĐIỂM ĐI</h3>
              <ul className="mt-3">
                {aboutStory.origins.map((place) => (
                  <li key={place} className="text-2xl font-extrabold tracking-tight">
                    {place}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.18em] text-navy">HUB PHÂN PHỐI</h3>
              <ul className="mt-3">
                {aboutStory.hubs.map((place) => (
                  <li key={place} className="text-2xl font-extrabold tracking-tight">
                    {place}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {aboutStory.cargo.map((item) => (
              <li key={item.label} className="border-t-2 border-navy pt-4">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-navy uppercase">{item.label}</p>
                <p className="mt-2 text-xl font-extrabold tracking-tight">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">{aboutStory.cargoNote}</p>
        </div>
      </section>
      <ClosingBand
        title="Chọn phía bạn đang đứng."
        body="Xem giải pháp cho chủ hàng hoặc nhà xe, hoặc đăng nhập bằng tài khoản đã được cấp."
        links={[
          { href: paths.shipperSolution, label: "Giải pháp cho chủ hàng" },
          { href: paths.carrierSolution, label: "Giải pháp cho nhà xe" },
          { href: authPath("general"), label: "Đăng nhập" },
        ]}
      />
      <p className="guest-frame py-6 text-sm leading-relaxed text-muted">{aboutStory.qualification}</p>
    </>
  );
}
