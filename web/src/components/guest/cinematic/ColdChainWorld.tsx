function Truck() {
  return (
    <svg viewBox="0 0 220 96" className="h-auto w-full overflow-visible" aria-hidden="true">
      <ellipse cx="108" cy="86" rx="78" ry="8" className="fill-navy/15" />
      <rect x="8" y="18" width="132" height="58" rx="8" fill="#ffffff" stroke="#1e3a8a" strokeWidth="3" />
      <path d="M74 32v30M62 47h24M66 39l8 8 8-8M82 39l-8 8-8-8" fill="none" stroke="#1e3a8a" strokeWidth="2.4" />
      <rect x="138" y="30" width="58" height="46" rx="8" fill="#1e3a8a" />
      <rect x="150" y="38" width="28" height="16" rx="3" fill="#dbeafe" />
      <circle cx="48" cy="78" r="10" fill="#1e293b" />
      <circle cx="48" cy="78" r="4" fill="#e2e8f0" />
      <circle cx="118" cy="78" r="10" fill="#1e293b" />
      <circle cx="118" cy="78" r="4" fill="#e2e8f0" />
      <circle cx="176" cy="78" r="10" fill="#1e293b" />
      <circle cx="176" cy="78" r="4" fill="#e2e8f0" />
    </svg>
  );
}

export function ColdChainWorld() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f8fafc]">
      <div data-camera className="flex h-full w-[300%] will-change-transform">
        <WarehousePanel />
        <RoadPanel />
        <DestinationPanel />
      </div>
    </div>
  );
}

function WarehousePanel() {
  return (
    <div className="relative h-full w-1/3 shrink-0">
      <svg viewBox="0 0 1400 520" className="h-full w-full font-sans" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect width="1400" height="520" fill="#f8fafc" />
        <rect x="180" y="48" width="1040" height="380" rx="28" fill="#1e3a8a" />
        <path d="M180 118 H1220" stroke="#93c5fd" strokeWidth="10" />
        <rect x="250" y="160" width="110" height="78" rx="8" fill="#ffffff" />
        <rect x="384" y="160" width="110" height="78" rx="8" fill="#ffffff" />
        <rect x="250" y="262" width="110" height="78" rx="8" fill="#dbeafe" />
        <rect x="384" y="262" width="110" height="78" rx="8" fill="#ffffff" />
        <circle cx="650" cy="250" r="42" fill="none" stroke="#dbeafe" strokeWidth="5" />
        <path d="M650 220 v60 M620 250 h60 M632 232 l18 18 18-18 M668 232 l-18 18-18-18" fill="none" stroke="#dbeafe" strokeWidth="4" />
        <rect x="860" y="160" width="250" height="268" fill="#0f2654" />
        <rect
          data-door
          x="884"
          y="176"
          width="202"
          height="236"
          fill="#dbeafe"
          style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
        />
        <text x="700" y="478" textAnchor="middle" fill="#1e3a8a" fontSize="36" fontWeight="700">
          Kho lạnh
        </text>
      </svg>
    </div>
  );
}

function RoadPanel() {
  return (
    <div className="relative h-full w-1/3 shrink-0 overflow-hidden bg-[#f8fafc]">
      <svg viewBox="0 0 1400 220" className="absolute inset-x-0 bottom-[34%] h-[34%] w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 150 C 220 40, 420 190, 700 90 S 1120 20, 1400 110 V220 H0 Z" fill="#e2e8f0" />
      </svg>
      <svg viewBox="0 0 1400 120" className="absolute inset-x-0 bottom-[14%] h-[22%] w-full" preserveAspectRatio="none" aria-hidden="true">
        <rect width="1400" height="120" fill="#1e293b" />
        <path data-lane d="M40 60 H1360" stroke="#f8fafc" strokeWidth="8" strokeDasharray="36 28" strokeLinecap="butt" />
      </svg>
      <div data-truck className="absolute bottom-[20%] left-[8%] w-[30%] max-w-72">
        <Truck />
      </div>
    </div>
  );
}

function DestinationPanel() {
  return (
    <div className="relative h-full w-1/3 shrink-0">
      <svg viewBox="0 0 1400 520" className="h-full w-full font-sans" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect width="1400" height="520" fill="#f8fafc" />
        <text x="470" y="58" textAnchor="middle" fill="#1e3a8a" fontSize="28" fontWeight="700">
          Chủ hàng
        </text>
        <text x="930" y="58" textAnchor="middle" fill="#1e3a8a" fontSize="28" fontWeight="700">
          Nhà xe
        </text>
        <circle cx="470" cy="96" r="18" fill="#1e3a8a" />
        <circle cx="930" cy="96" r="18" fill="#2563eb" />
        <path
          data-link
          d="M496 96 H904"
          pathLength="100"
          stroke="#1e3a8a"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="100"
          strokeDashoffset="100"
        />
        <rect x="300" y="150" width="800" height="280" rx="28" fill="#1e3a8a" />
        <rect x="360" y="210" width="180" height="180" rx="8" fill="#dbeafe" />
        <rect x="580" y="210" width="130" height="86" rx="8" fill="#ffffff" />
        <rect x="736" y="210" width="130" height="86" rx="8" fill="#ffffff" />
        <rect x="580" y="314" width="130" height="76" rx="8" fill="#dbeafe" />
        <text x="700" y="478" textAnchor="middle" fill="#1e3a8a" fontSize="36" fontWeight="700">
          Điểm giao
        </text>
      </svg>
    </div>
  );
}
