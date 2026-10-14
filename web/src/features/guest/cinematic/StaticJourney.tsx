import { Link } from "react-router-dom";
import { authPath, paths } from "@/app/paths";
import { Button } from "@/components/ui/button";

const frames = [
  {
    index: "01",
    title: "Kết nối vận tải lạnh, minh bạch từng hành trình.",
    body: "Chủ hàng niêm yết đơn. Nhà xe tự nhận chuyến.",
  },
  {
    index: "02",
    title: "Kho lạnh xuất phát",
    body: "Rau quả lạnh và thủy sản đông được chuẩn bị tại dock.",
  },
  {
    index: "03",
    title: "Xe lạnh trên đường bộ",
    body: "Hình tĩnh thay cho cảnh ba chiều khi máy không dựng chuyển động.",
  },
  {
    index: "04",
    title: "Tuyến pilot",
    body: "Tiền Giang, Long An, TP. Hồ Chí Minh, Bình Dương, Đồng Nai. GPS không xác nhận lấy hàng hay giao hàng.",
  },
  {
    index: "05",
    title: "Kho nhận",
    body: "Tài xế được giao xác nhận khi hàng tới.",
  },
] as const;

export function StaticJourney({ reason }: { reason: "reduced" | "webgl" }) {
  return (
    <section className="bg-[#070d1f] text-white" aria-labelledby="static-journey-title">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-white/60 uppercase">Coldi Freight</p>
          <h2 id="static-journey-title" className="mt-3 text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
            Kết nối vận tải lạnh, minh bạch từng hành trình.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
            {reason === "webgl"
              ? "Trình duyệt không dựng được cảnh ba chiều. Nội dung và lối đi vẫn đầy đủ."
              : "Chuyển động đã được tắt theo cài đặt của máy. Nội dung hành trình vẫn nằm bên dưới."}
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
        <div className="relative h-72 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_30%_40%,#1d4ed8,transparent_55%),linear-gradient(160deg,#0f172a,#1e3a8a)] sm:h-96">
          <div className="absolute top-[38%] right-[12%] left-[10%] h-16 rounded-2xl bg-white/90 shadow-2xl" />
          <div className="absolute top-[34%] right-[8%] h-20 w-16 rounded-xl bg-[#1e3a8a]" />
          <div className="absolute right-[18%] bottom-[22%] left-[8%] h-3 rounded-full bg-[#020617]" />
          <p className="absolute bottom-4 left-5 text-sm text-white/80">Khung tĩnh của xe lạnh. Không phải chuyến đang chạy.</p>
        </div>
      </div>
      <ol className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-2 sm:px-8">
        {frames.map((frame) => (
          <li key={frame.index} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-white/50">{frame.index}</p>
            <h3 className="mt-2 text-xl font-extrabold">{frame.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{frame.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
