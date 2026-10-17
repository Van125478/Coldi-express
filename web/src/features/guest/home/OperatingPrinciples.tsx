const principles = [
  {
    index: "01",
    title: "Không tự động ghép chuyến",
    description: "Nhà xe tự xem sàn và tự nhận chuyến. Không tự ghép, không tự điều phối, không tự gán tài xế.",
  },
  {
    index: "02",
    title: "Mỗi đơn chỉ một nhà xe nhận thành công",
    description: "Mỗi đơn đang mở chỉ có một nhà xe nhận chuyến thành công.",
  },
  {
    index: "03",
    title: "GPS không thay thế xác nhận giao nhận",
    description: "Tài xế được phân công xác nhận lấy hàng và giao hàng. GPS chỉ bổ sung vị trí và thời điểm.",
  },
] as const;

export function OperatingPrinciples() {
  return (
    <section className="border-t border-[#e2e8f0] bg-white text-[#1e293b]" aria-labelledby="principles-title">
      <div className="guest-frame py-12 sm:py-14">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">NGUYÊN TẮC VẬN HÀNH</p>
        <h2 id="principles-title" className="mt-3 max-w-xl text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
          Chủ động kết nối. Minh bạch từng bước.
        </h2>

        <ol className="mt-8 border-t border-[#e2e8f0] sm:mt-10">
          {principles.map((principle) => (
            <li
              key={principle.index}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b border-[#e2e8f0] py-5 sm:gap-x-4 sm:py-6 lg:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.05fr)] lg:items-baseline lg:gap-x-8"
            >
              <p className="text-lg leading-none font-extrabold tracking-tight text-[#1e3a8a] sm:text-xl">{principle.index}</p>
              <h3 className="text-lg leading-snug font-extrabold tracking-tight sm:text-xl">{principle.title}</h3>
              <p className="col-start-2 text-sm leading-relaxed text-[#475569] sm:text-base lg:col-start-3">{principle.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
