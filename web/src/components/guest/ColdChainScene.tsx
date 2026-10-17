import { cn } from "@/lib/cn";

const steps = [
  "Chuẩn bị hàng lạnh tại kho",
  "Xe lạnh đi theo tuyến",
  "Hàng đến điểm giao",
  "COLDI kết nối chủ hàng và nhà xe",
] as const;

type ColdChainSceneProps = {
  tone?: "light" | "inverse";
  className?: string;
};

export function ColdChainScene({ tone = "light", className }: ColdChainSceneProps) {
  const inverse = tone === "inverse";

  return (
    <figure className={cn("min-w-0", className)}>
      <div
        role="img"
        aria-label="Minh họa chuỗi lạnh: hàng được chuẩn bị tại kho lạnh, xe lạnh đi theo tuyến, đến điểm giao, rồi COLDI kết nối chủ hàng với nhà xe. Đây không phải hành trình GPS thật."
        className={cn("overflow-hidden rounded-2xl", inverse ? "bg-white/10" : "bg-[#f8fafc]")}
      >
        <svg viewBox="0 0 640 228" className={cn("h-auto w-full font-sans", inverse ? "text-white" : "text-navy")} aria-hidden="true">
          <path d="M132 176 H508" className={inverse ? "stroke-white/30" : "stroke-[#cbd5e1]"} strokeWidth="6" strokeLinecap="round" />
          <path
            d="M132 176 H508"
            pathLength="100"
            className="cold-route stroke-current"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          <Warehouse x={28} label="Kho lạnh" inverse={inverse} />
          <Warehouse x={516} label="Điểm giao" inverse={inverse} />

          <g className="cold-link">
            <circle cx="72" cy="28" r="7" className="fill-current" />
            <circle cx="568" cy="28" r="7" className={inverse ? "fill-white" : "fill-[#2563eb]"} />
            <path
              d="M86 28 H548"
              pathLength="100"
              className="cold-link-line stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <text x="72" y="16" textAnchor="middle" fontSize="12" className="fill-current font-semibold">
              Chủ hàng
            </text>
            <text x="568" y="16" textAnchor="middle" fontSize="12" className="fill-current font-semibold">
              Nhà xe
            </text>
          </g>

          <g className="cold-truck">
            <rect x="0" y="8" width="58" height="30" rx="4" className={inverse ? "fill-white" : "fill-white"} stroke="currentColor" strokeWidth="2" />
            <path d="M29 16 v14 M22 23 h14 M25 19 l4 4 4-4 M33 19 l-4 4-4-4" className={inverse ? "stroke-navy" : "stroke-current"} strokeWidth="1.6" fill="none" />
            <rect x="58" y="14" width="22" height="24" rx="3" className="fill-current" />
            <rect x="62" y="18" width="10" height="7" rx="1" className={inverse ? "fill-navy/30" : "fill-white/80"} />
            <circle cx="16" cy="40" r="5" className="fill-[#1e293b]" />
            <circle cx="48" cy="40" r="5" className="fill-[#1e293b]" />
            <circle cx="70" cy="40" r="5" className="fill-[#1e293b]" />
          </g>
        </svg>
      </div>
      <figcaption className="mt-3">
        <ol className={cn("grid grid-cols-2 gap-2 text-xs font-semibold leading-snug sm:grid-cols-4", inverse ? "text-white/90" : "text-navy")} aria-hidden="true">
          {steps.map((step, index) => (
            <li key={step} className={cn("cold-step rounded-lg px-2 py-1.5", inverse ? "bg-white/10" : "bg-white")} style={{ animationDelay: `${index * 4}s` }}>
              {step}
            </li>
          ))}
        </ol>
        <p className={cn("mt-2 text-sm leading-relaxed", inverse ? "text-white/80" : "text-muted")}>
          Minh họa chuỗi lạnh. Không phải chuyến đang chạy và không phải tín hiệu GPS.
        </p>
      </figcaption>
    </figure>
  );
}

function Warehouse({ x, label, inverse }: { x: number; label: string; inverse: boolean }) {
  return (
    <g transform={`translate(${x} 48)`}>
      <path d="M8 42 48 16 88 42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <rect x="14" y="42" width="68" height="62" rx="4" className="fill-current" />
      <rect x="38" y="68" width="20" height="36" className={inverse ? "fill-navy/40" : "fill-[#dbeafe]"} />
      <rect x="22" y="78" width="12" height="10" rx="1" className={cn("cold-crate", inverse ? "fill-navy" : "fill-white")} />
      <rect
        x="62"
        y="78"
        width="12"
        height="10"
        rx="1"
        className={cn("cold-crate", inverse ? "fill-navy" : "fill-white")}
        style={{ animationDelay: "0.4s" }}
      />
      <text x="48" y="122" textAnchor="middle" fontSize="12" className="fill-current font-semibold">
        {label}
      </text>
    </g>
  );
}
