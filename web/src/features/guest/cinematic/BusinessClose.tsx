import { Link } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";

const columns = [
  {
    title: "Chủ hàng",
    body: "Đăng đơn với điểm lấy, điểm giao, nhóm nhiệt độ và giá niêm yết. Đơn đã đăng ở trạng thái đang tìm xe.",
    to: paths.shipperSolution,
    label: "Xem giải pháp chủ hàng",
  },
  {
    title: "Nhà xe tự nhận",
    body: "Nhà xe tự mở sàn và tự bấm nhận. Máy chủ chỉ cho một nhà xe thành công. Sau đó nhà xe tự gán xe và tài xế. Tài xế không tự nhận chuyến.",
    to: paths.carrierSolution,
    label: "Xem giải pháp nhà xe",
  },
  {
    title: "Nhìn thấy chuyến",
    body: "Khi đã có quyền trên chuyến, vị trí GPS giúp theo dõi. Lấy hàng và giao hàng là thao tác của tài xế được giao. GPS không tự xác nhận hai mốc đó.",
    to: paths.about,
    label: "Cách Coldi vận hành",
  },
] as const;

export function BusinessClose() {
  return (
    <section className="bg-[#f8fafc] text-[#1e293b]" aria-labelledby="business-title">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-xs font-bold tracking-[0.2em] text-[#1e3a8a] uppercase">Năng lực đã chốt</p>
        <h2 id="business-title" className="mt-3 max-w-3xl text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl">
          Minh bạch trên đơn, không tự điều xe.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#475569]">
          Coldi nối chủ hàng và nhà xe cho vận tải lạnh đường bộ. Không tự ghép đơn, không tự điều phối, không tự gán xe.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {columns.map((column) => (
            <article key={column.title} className="flex flex-col rounded-3xl border border-[#e2e8f0] bg-white p-6">
              <h3 className="text-2xl font-extrabold">{column.title}</h3>
              <p className="mt-3 flex-1 text-base leading-relaxed text-[#475569]">{column.body}</p>
              <Link to={column.to} className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-[#1e3a8a]">
                {column.label}
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-16 rounded-[2rem] bg-[#1e3a8a] px-6 py-12 text-white sm:px-12">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">Sẵn sàng xem sàn, hoặc đăng đơn.</h2>
          <p className="mt-4 max-w-xl text-white/80">
            Khách xem thông tin công khai. Đăng đơn và nhận chuyến yêu cầu đăng nhập. Xác thực chưa được nối ở bản này.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-auto rounded-full bg-white px-6 text-[#1e3a8a] hover:bg-white/90">
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
      </div>
    </section>
  );
}
