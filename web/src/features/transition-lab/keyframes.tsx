import type { ReactNode } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import doorsStill from "@/features/transition-lab/keyframe-02-doors-closing.jpg";
import rearStill from "@/features/transition-lab/keyframe-03-closed-rear.jpg";
import riseStill from "@/features/transition-lab/keyframe-rise-midpoint.jpg";
import roadStill from "@/features/transition-lab/keyframe-04-high-angle-road.jpg";
import routeStill from "@/features/transition-lab/keyframe-05-route.jpg";

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
    <Stage label="Lộ trình tối giản từ điểm đi đến điểm đến.">
      <img src={routeStill} alt="" className="h-full w-full object-cover" />
      <p className="pointer-events-none absolute bottom-[28%] left-[9%] text-sm font-medium tracking-wide text-[#e7eef6] sm:text-base">
        A · Điểm đi
      </p>
      <p className="pointer-events-none absolute top-[6%] right-[18%] text-sm font-medium tracking-wide text-[#e7eef6] sm:text-base">
        B · Điểm đến
      </p>
    </Stage>
  );
}
