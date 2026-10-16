export function EditorialBridge() {
  return (
    <section
      id="sau-hanh-trinh"
      tabIndex={-1}
      className="scroll-mt-20 bg-[#f8fafc] text-[#1e293b] outline-none"
      aria-labelledby="bridge-title"
    >
      <div className="h-8 bg-gradient-to-b from-[#050914] to-[#f8fafc] sm:h-10" aria-hidden="true" />
      <div className="guest-frame grid gap-6 pt-8 pb-14 sm:pt-10 sm:pb-16 lg:grid-cols-12 lg:items-end lg:gap-16 lg:pt-12 lg:pb-20">
        <div className="lg:col-span-7">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1e3a8a]">COLDI · VẬN TẢI LẠNH</p>
          <h2 id="bridge-title" className="mt-4 max-w-xl text-[1.75rem] leading-[1.2] font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]">
            Từ một nhu cầu vận chuyển đến hành trình rõ ràng.
          </h2>
        </div>
        <p className="max-w-md text-base leading-relaxed text-[#475569] lg:col-span-5 lg:text-lg">
          COLDI kết nối chủ hàng và nhà xe vận tải lạnh trong một quy trình có các bước và trách nhiệm cụ thể.
        </p>
      </div>
    </section>
  );
}
