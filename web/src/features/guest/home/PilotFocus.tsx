const origins = ["Tiền Giang", "Long An"] as const;

const hubs = ["TP. Hồ Chí Minh", "Bình Dương", "Đồng Nai"] as const;

const cargo = [
  {
    group: "Lạnh mát",
    title: "Trái cây và nông sản tươi",
    note: "Ưu tiên cho hàng tươi cần giữ mát.",
    rule: "border-[#1e3a8a]",
  },
  {
    group: "Đông",
    title: "Thủy hải sản",
    note: "Ưu tiên cho hàng đông lạnh.",
    rule: "border-[#1e293b]",
  },
] as const;

function PlaceList({ places }: { places: readonly string[] }) {
  return (
    <ul className="mt-3">
      {places.map((place) => (
        <li key={place} className="text-xl leading-tight font-extrabold tracking-tight sm:text-2xl">
          {place}
        </li>
      ))}
    </ul>
  );
}

export function PilotFocus() {
  return (
    <section className="border-t border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b]" aria-labelledby="pilot-title">
      <div className="guest-frame py-12 sm:py-14">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">PHẠM VI ƯU TIÊN</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h2 id="pilot-title" className="max-w-xl text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:col-span-7">
            Bắt đầu từ những tuyến vận tải lạnh thiết thực.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-[#475569] lg:col-span-5">
            Phạm vi pilot dự kiến, chưa phải mạng lưới đang khai thác. Tuyến Bắc–Nam và xuất khẩu qua cửa khẩu là hướng mở rộng sau.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)_minmax(0,1.15fr)] lg:items-start lg:gap-x-10">
          <div className="border-t-2 border-[#1e3a8a] pt-4">
            <h3 className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">ĐIỂM ĐI</h3>
            <PlaceList places={origins} />
          </div>

          <div className="flex flex-col gap-3 lg:items-stretch lg:pt-9">
            <div className="flex w-fit flex-col items-center text-[#1e3a8a] lg:w-full lg:flex-row" aria-hidden="true">
              <span className="h-6 w-px bg-[#1e3a8a]/45 lg:h-px lg:flex-1" />
              <span className="size-2 rotate-[135deg] border-t-2 border-r-2 border-[#1e3a8a] lg:size-1.5 lg:rotate-45 lg:border-t lg:border-r" />
            </div>
            <div className="min-w-0 lg:text-center">
              <p className="text-sm font-extrabold tracking-tight sm:text-base">Phạm vi pilot dự kiến</p>
              <p className="mt-1 text-sm leading-snug text-[#475569]">Từ điểm đi tới hub phân phối.</p>
            </div>
          </div>

          <div className="border-t-2 border-[#1e3a8a] pt-4">
            <h3 className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">HUB PHÂN PHỐI</h3>
            <PlaceList places={hubs} />
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">HÀNG ƯU TIÊN</p>
          <ul className="mt-5 grid gap-8 sm:grid-cols-2 sm:gap-0">
            {cargo.map((item, index) => (
              <li key={item.group} className={index === 0 ? `border-t-2 pt-4 sm:pr-10 ${item.rule}` : `border-t-2 pt-4 sm:border-l sm:border-l-[#e2e8f0] sm:pl-10 ${item.rule}`}>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[#1e3a8a] uppercase">{item.group}</p>
                <h3 className="mt-2 text-2xl leading-tight font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">{item.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#475569]">COLDI còn ghi nhận nhóm Cực lạnh. Ưu tiên ban đầu của pilot là Lạnh mát và Đông.</p>
        </div>
      </div>
    </section>
  );
}
