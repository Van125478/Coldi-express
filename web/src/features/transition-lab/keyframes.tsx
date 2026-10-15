import type { ReactNode } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import doorsStill from "@/features/transition-lab/keyframe-02-doors-closing.jpg";
import rearStill from "@/features/transition-lab/keyframe-03-closed-rear.jpg";
import riseStill from "@/features/transition-lab/keyframe-rise-midpoint.jpg";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";

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

const vietnamCoast =
  "M951.7,166.2 L920.2,177.6 L917,189.4 L906.4,194.9 L879.5,192.2 L883.4,205.8 L872,216.5 L870.2,228.7 L840.3,246.7 L820,296.6 L834.9,320.4 L869.1,348.9 L868,360.5 L861.9,359.1 L943.9,432.2 L954.8,431.7 L999.2,480.6 L1026.2,558.7 L1024.4,588.3 L1034.1,623.1 L1028,615.3 L1021.5,620.8 L1023.7,656.2 L1008.5,687.9 L911.8,736.1 L897.6,722.6 L894.3,736 L881.9,729 L875.1,732.6 L882.7,733.7 L883.6,741.3 L867.2,741.2 L885.2,750.5 L874.6,763.7 L848.8,745.1 L873.3,774.9 L862.4,779.3 L831.7,756.5 L850.1,777.3 L850.6,787.4 L813.3,803 L791.6,826.8 L772.3,828.4 L779.4,820.8 L776.5,776.7 L790.5,759.3 L753.1,735.4 L776.8,729.1 L787.8,720.5 L787.8,709.7 L802.8,713.1 L827.5,705.7 L850.4,715.7 L850.2,703.3 L833.1,690.1 L832.9,672.6 L841.5,666.3 L863.6,670 L864.4,656.5 L925.6,635.2 L923.8,601 L931.1,580.1 L915.8,544.8 L927.2,518 L924.1,501 L933.8,486.9 L906.5,458.8 L919.4,446.5 L888.9,422.3 L878,423.4 L869.3,399.8 L791.6,325.3 L793.4,312.7 L723.1,279.2 L732.7,270.1 L731,260.2 L762.1,263.1 L781.2,242.6 L776.7,233.2 L749.8,220.9 L761.9,210.4 L734.9,195 L708.8,207.8 L679.1,197.8 L664.9,178.6 L670.4,157.3 L662.9,150.8 L654.3,157.6 L624.3,121.5 L643.6,102.4 L672.2,118 L691.5,101.5 L700.8,110.8 L707.9,100.8 L725.9,113.2 L737.2,99.9 L750,104.8 L767.7,98.8 L777.6,82.7 L800.6,71.9 L832.4,93.6 L849.5,91.2 L884.9,101 L872,115.2 L878.4,142 L895.6,144.8 L916.9,161 L939.7,158.6 L948.1,163.5 Z";

const phuQuoc = "M732.8,736.4 L733.4,745 L730.2,755 L726.5,744 L720.8,737.5 L730.8,734.5 Z";

const hcmcToHanoi =
  "M880.5 716.6 C889.8 711.3, 917.8 700.3, 936.4 684.7 C955 669.1, 980.3 644.5, 992.4 623.1 C1004.5 601.7, 1012 582, 1009.2 556.4 C1006.4 530.8, 988.7 491.4, 975.6 469.2 C962.5 447, 947.6 439.3, 930.8 423.1 C914 406.9, 892.5 390.6, 874.8 371.8 C857.1 353, 833.7 329.9, 824.4 310.2 C815.1 290.5, 817.4 273.7, 818.8 253.8 C820.2 233.9, 830.6 201.3, 833 190.8";

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
          d="M160 830 C 420 790, 680 760, 868 724"
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
        <circle cx="880.5" cy="716.6" r="7" fill="#050914" stroke="#e7eef6" strokeWidth="2.5" />
        <circle cx="833" cy="190.8" r="8" fill="#1e3a8a" stroke="#7dd3fc" strokeWidth="2.5" />
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
