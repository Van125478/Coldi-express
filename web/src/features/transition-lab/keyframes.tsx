import type { ReactNode } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import doorsStill from "@/features/transition-lab/keyframe-02-doors-closing.jpg";
import rearStill from "@/features/transition-lab/keyframe-03-closed-rear.jpg";
import riseStill from "@/features/transition-lab/keyframe-rise-midpoint.jpg";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";
import { hcmc, hanoi, hcmcToHanoi, phuQuoc, roadApproach, vietnamCoast } from "@/features/transition-lab/mapArt";

function Stage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="relative aspect-video overflow-hidden bg-[#050914]">
      {children}
    </div>
  );
}

function Still({ src, label }: { src: string; label: string }) {
  return (
    <Stage label={label}>
      <img src={src} alt="" className="h-full w-full object-cover" />
    </Stage>
  );
}

export function InteriorFrame() {
  return <Still src={interiorStill} label="Khoang lạnh nhìn từ ngoài cửa sau đang mở, hàng đã xếp." />;
}

export function DoorsFrame() {
  return <Still src={doorsStill} label="Cùng khoang, cửa đang khép và camera đã lùi nhẹ." />;
}

export function RearFrame() {
  return <Still src={rearStill} label="Mặt sau xe lạnh đã đóng cửa, cùng khung cửa và sọc navy." />;
}

export function RiseFrame() {
  return (
    <Still
      src={riseStill}
      label="Cùng chiếc xe, camera đã lên phía sau: thấy mái thùng và mặt sau cùng lúc."
    />
  );
}

export function OverheadFrame() {
  return <Still src={roadStill} label="Cùng chiếc xe, nhìn từ trên cao khi đang đi trên đường." />;
}

export function MapFrame() {
  return (
    <Stage label="Lộ trình từ TP. Hồ Chí Minh đến Hà Nội trên bóng Việt Nam.">
      <svg viewBox="0 0 1600 900" className="h-full w-full" role="presentation">
        <defs>
          <radialGradient id="map-night" cx="58%" cy="46%" r="62%">
            <stop offset="0" stopColor="#122448" />
            <stop offset="1" stopColor="#050914" />
          </radialGradient>
          <linearGradient id="map-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a3d78" />
            <stop offset="1" stopColor="#0c1c38" />
          </linearGradient>
          <linearGradient id="map-road-fade" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
            <stop offset="0.45" stopColor="#7dd3fc" stopOpacity="0.28" />
            <stop offset="1" stopColor="#e0f2fe" stopOpacity="0.85" />
          </linearGradient>
          <filter id="map-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <rect width="1600" height="900" fill="#050914" />
        <rect width="1600" height="900" fill="url(#map-night)" />
        <path
          d={roadApproach}
          fill="none"
          stroke="url(#map-road-fade)"
          strokeWidth="22"
          strokeLinecap="round"
          filter="url(#map-glow)"
          opacity="0.7"
        />
        <path d={vietnamCoast} fill="#12305f" filter="url(#map-glow)" opacity="0.45" />
        <path d={vietnamCoast} fill="url(#map-land)" stroke="#9bd8f5" strokeWidth="1.6" strokeLinejoin="round" />
        <path d={phuQuoc} fill="url(#map-land)" stroke="#9bd8f5" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={hcmcToHanoi} fill="none" stroke="#7dd3fc" strokeWidth="16" strokeLinecap="round" filter="url(#map-glow)" opacity="0.9" />
        <path d={hcmcToHanoi} fill="none" stroke="#f4fbff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={hcmc.x} cy={hcmc.y} r="7" fill="#050914" stroke="#e7eef6" strokeWidth="2.5" />
        <circle cx={hanoi.x} cy={hanoi.y} r="8" fill="#1e3a8a" stroke="#7dd3fc" strokeWidth="2.5" />
        <text
          x="760"
          y="808"
          textAnchor="end"
          fill="#e7eef6"
          stroke="#050914"
          strokeWidth="5"
          fontSize="26"
          fontFamily="Be Vietnam Pro, sans-serif"
          style={{ paintOrder: "stroke" }}
        >
          TP. Hồ Chí Minh
        </text>
        <text
          x="908"
          y="178"
          fill="#e7eef6"
          stroke="#050914"
          strokeWidth="5"
          fontSize="26"
          fontFamily="Be Vietnam Pro, sans-serif"
          style={{ paintOrder: "stroke" }}
        >
          Hà Nội
        </text>
      </svg>
    </Stage>
  );
}
