import { cn } from "@/lib/cn";

type LogisticsSketchProps = {
  /** Plays the five-step story. Without it, the finished drawing stays still. */
  play?: boolean;
  className?: string;
};

const ink = "currentColor";
const blue = "#2563eb";

/**
 * Decorative line drawing of a cold-chain handoff.
 * Not a live trip, a map, or a GPS trace.
 */
export function LogisticsSketch({ play = false, className }: LogisticsSketchProps) {
  return (
    <svg
      viewBox="0 0 880 500"
      className={cn("sketch w-full text-navy", play && "sketch-play", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect width="880" height="500" fill="#f8fafc" />
      <g stroke="#e2e8f0" strokeWidth="1">
        {Array.from({ length: 8 }, (_, index) => (
          <line key={`v-${index}`} x1={80 + index * 100} y1="28" x2={80 + index * 100} y2="472" />
        ))}
        {Array.from({ length: 4 }, (_, index) => (
          <line key={`h-${index}`} x1="28" y1={80 + index * 110} x2="852" y2={80 + index * 110} />
        ))}
      </g>

      <path className="sketch-draw sketch-route" d="M250 422 C390 422 520 422 760 422" stroke={blue} strokeWidth="1.75" strokeLinecap="round" pathLength={1} />
      <circle cx="250" cy="422" r="3.5" fill={blue} />
      <circle className="sketch-destination" cx="760" cy="422" r="3.5" fill={blue} />

      <g className="sketch-warehouse" stroke={ink} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round">
        <path className="sketch-draw" d="M48 404 V228 H188 V404" pathLength={1} />
        <path className="sketch-draw" d="M36 228 L118 168 L200 228" pathLength={1} />
        <path className="sketch-draw" d="M100 404 V318 H156 V404" pathLength={1} />
        <g className="sketch-detail">
          <path d="M64 262 H88 M76 250 V274" />
          <path d="M76 254 L84 262 L76 270 L68 262 Z" />
          <path d="M64 292 H180" stroke="#cbd5e1" />
        </g>
      </g>

      <g className="sketch-cargo" stroke={ink} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M210 404 V378 H244 V404 Z" />
        <path d="M216 378 V354 H250 V378 Z" />
        <path d="M222 354 V334 H256 V354 Z" />
        <path d="M222 344 H256" stroke={blue} />
      </g>

      <g className="sketch-truck" stroke={ink} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round">
        <path d="M0 372 H168 V292 H0 Z" />
        <path d="M0 332 H168" stroke={blue} />
        <path d="M148 292 V272 H168 V292" />
        <path d="M154 280 H162" stroke={blue} />
        <path d="M168 372 V310 H222 L248 342 V372 Z" />
        <path d="M186 310 V342 H232" />
        <path d="M198 318 H220 V334 H198 Z" />
        <circle cx="46" cy="388" r="16" />
        <circle cx="46" cy="388" r="5.5" />
        <circle cx="132" cy="388" r="16" />
        <circle cx="132" cy="388" r="5.5" />
        <circle cx="214" cy="388" r="16" />
        <circle cx="214" cy="388" r="5.5" />
        <g className="sketch-load" stroke={blue}>
          <path d="M48 354 H108 V314 H48 Z" />
          <path d="M68 354 V314 M88 354 V314" />
        </g>
      </g>

      <g className="sketch-destination" stroke={ink} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round">
        <path className="sketch-draw" d="M742 404 V312 H832 V404" pathLength={1} />
        <path className="sketch-draw" d="M732 312 H842" pathLength={1} />
        <path d="M772 404 V356 H808 V404" />
        <g className="sketch-pin" stroke={blue}>
          <path d="M786 250 a16 16 0 0 1 16 20 c0 14 -16 28 -16 28 s-16 -14 -16 -28 a16 16 0 0 1 16 -20 z" />
          <circle cx="786" cy="268" r="4.5" />
        </g>
      </g>

      <g className="sketch-link" stroke={ink} strokeWidth="1.6" strokeLinecap="round">
        <circle cx="548" cy="78" r="16" />
        <circle cx="700" cy="78" r="16" />
        <path className="sketch-draw" d="M564 78 H684" stroke={blue} pathLength={1} />
        <path d="M540 84 a10 7 0 0 1 16 0 M540 76 h16 M548 68 v8" />
        <path d="M692 84 a10 7 0 0 1 16 0 M696 70 h10 v12" />
        <text x="548" y="116" textAnchor="middle" fill="#475569" stroke="none" fontSize="13" fontFamily="inherit">
          Chủ hàng
        </text>
        <text x="700" y="116" textAnchor="middle" fill="#475569" stroke="none" fontSize="13" fontFamily="inherit">
          Nhà xe
        </text>
      </g>
    </svg>
  );
}
