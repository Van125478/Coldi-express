import { Link } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { BusinessClose } from "@/features/guest/cinematic/BusinessClose";
import { LogisticsSketch } from "@/features/guest/sketch/LogisticsSketch";

export function CinematicLanding() {
  return (
    <>
      <section className="bg-[#070d1f] text-white" aria-labelledby="cinematic-hero-title">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-24 pb-16 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:pt-28 lg:pb-24">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.22em] text-white/70 uppercase">Coldi Freight</p>
            <h1 id="cinematic-hero-title" className="mt-3 text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
              Kết nối vận tải lạnh, minh bạch từng hành trình.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/78 sm:text-lg">
              Chủ hàng niêm yết đơn. Nhà xe tự nhận chuyến. Một hành trình lạnh, từ kho đến điểm giao.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-auto rounded-full bg-white px-6 text-navy hover:bg-white/90">
                <Link to={paths.shipments}>Tìm chuyến ngay</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-auto rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={authPath("publish", paths.publish)}>Đăng đơn hàng</Link>
              </Button>
            </div>
          </div>
          <figure className="min-w-0">
            <div className="aspect-[880/500] overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <LogisticsSketch play className="h-full" />
            </div>
            <figcaption className="mt-3 text-sm leading-relaxed text-white/60">
              Minh họa: hàng lạnh tại kho, xe lạnh nhận hàng, chạy trên tuyến, tới điểm giao, rồi chủ hàng và nhà xe được nối
              với nhau. Không phải GPS đang chạy. GPS không xác nhận lấy hàng hay giao hàng.
            </figcaption>
          </figure>
        </div>
      </section>
      <BusinessClose />
    </>
  );
}
