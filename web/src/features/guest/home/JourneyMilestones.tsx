const milestones = [
  {
    index: "01",
    actor: "Chủ hàng",
    title: "Đăng nhu cầu vận chuyển",
    description:
      "Chủ hàng cung cấp thông tin hàng hóa, tuyến đường, thời gian, nhóm nhiệt độ và giá cước niêm yết.",
    marker: "Trạng thái",
    label: "Đang tìm xe",
    note: "Đơn hiện trên sàn cho nhà xe được cấp quyền.",
  },
  {
    index: "02",
    actor: "Nhà xe",
    title: "Chủ động nhận chuyến",
    description:
      "Nhà xe xem đơn phù hợp, có thể gọi điện hoặc trao đổi qua chat theo đơn, sau đó chủ động xác nhận nhận chuyến.",
    marker: "Trạng thái",
    label: "Đã có xe nhận chuyến",
    note: "Liên hệ không giữ chỗ. Chỉ một nhà xe nhận được. Lúc này chưa gán xe hay tài xế.",
  },
  {
    index: "03",
    actor: "Nhà xe",
    title: "Phân công phương tiện",
    description:
      "Sau khi nhận chuyến thành công, nhà xe lựa chọn phương tiện và phân công tài xế trực thuộc để thực hiện.",
    marker: "Tiến độ",
    label: "Chờ lấy hàng",
    note: "Nhà xe tự phân công. Tài xế không tự nhận đơn.",
  },
  {
    index: "04",
    actor: "Tài xế được phân công",
    title: "Bắt đầu vận chuyển",
    description:
      "Tài xế được phân công xác nhận đã lấy hàng tại điểm nhận. Chủ hàng có thể theo dõi hành trình qua các mốc nghiệp vụ và vị trí GPS.",
    marker: "Tiến độ",
    label: "Đang vận chuyển",
    note: "Chỉ sau khi tài xế xác nhận lấy hàng. GPS bổ sung vị trí, không tự xác nhận mốc này.",
  },
  {
    index: "05",
    actor: "Tài xế được phân công",
    title: "Xác nhận giao hàng",
    description:
      "Tài xế xác nhận đã giao hàng tại điểm đến. Hệ thống ghi nhận mốc giao hàng để các bên theo dõi tiến độ hoàn tất chuyến.",
    marker: "Mốc giao",
    label: "Đã xác nhận giao hàng",
    note: "Hoàn tất chuyến là trạng thái hoàn thành riêng. Mốc này không có nghĩa là đã thanh toán.",
  },
] as const;

export function JourneyMilestones() {
  return (
    <section className="bg-[#f8fafc] text-[#1e293b]" aria-labelledby="milestones-title">
      <div className="guest-frame pb-12 sm:pb-16">
        <div className="h-px bg-[#1e3a8a]/25" />
        <p className="mt-12 text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a] sm:mt-14">QUY TRÌNH VẬN HÀNH</p>
        <h2 id="milestones-title" className="mt-4 max-w-2xl text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
          Từ đơn niêm yết đến chuyến hàng hoàn tất.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[#475569] sm:text-lg">
          Năm bước kết nối chủ hàng, nhà xe và tài xế trong một quy trình có trách nhiệm rõ ràng.
        </p>

        <ol className="mt-12 sm:mt-16">
          {milestones.map((step, index) => {
            const last = index === milestones.length - 1;
            return (
              <li
                key={step.index}
                className={
                  last
                    ? "grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[1.5rem_minmax(0,36rem)_16rem] lg:justify-start lg:gap-x-10"
                    : "grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 pb-12 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-x-6 sm:pb-16 lg:grid-cols-[1.5rem_minmax(0,36rem)_16rem] lg:justify-start lg:gap-x-10"
                }
              >
                <div className="relative row-span-2 lg:row-span-1" aria-hidden="true">
                  {last ? (
                    <>
                      <span className="absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-[#1e3a8a]/50 sm:h-[1.625rem]" />
                      <span className="absolute top-2.5 left-1/2 size-1.5 -translate-x-1/2 bg-[#1e3a8a] sm:top-5" />
                    </>
                  ) : (
                    <span
                      className={
                        index === 0
                          ? "absolute top-2.5 -bottom-12 left-1/2 w-px -translate-x-1/2 bg-[#1e3a8a]/50 sm:top-5 sm:-bottom-16"
                          : "absolute top-0 -bottom-12 left-1/2 w-px -translate-x-1/2 bg-[#1e3a8a]/50 sm:-bottom-16"
                      }
                    />
                  )}
                </div>
                <div>
                  <p className="text-[2rem] leading-none font-extrabold tracking-tight text-[#1e3a8a] sm:text-5xl">{step.index}</p>
                  <p className="mt-4 text-[11px] font-semibold tracking-[0.18em] text-[#1e3a8a] uppercase">{step.actor}</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{step.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-[#475569]">{step.description}</p>
                </div>
                <div className="col-start-2 mt-4 border-t border-[#e2e8f0] pt-3 lg:col-start-3 lg:mt-16 lg:border-t-0 lg:pt-0">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-[#475569] uppercase">{step.marker}</p>
                  <p className="mt-1 text-lg leading-snug font-extrabold text-[#1e293b]">{step.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569]">{step.note}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
