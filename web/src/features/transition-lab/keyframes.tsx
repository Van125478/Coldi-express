import type { ReactNode } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";

const interiorWall = "#d7e0ea";
const interiorShade = "#b7c3d0";
const floor = "#8e9bab";
const cartonA = "#c6a37a";
const cartonB = "#ad8660";
const cartonC = "#d8c09a";
const wood = "#8d6240";
const fruit = "#d4533a";
const body = "#e7eef6";
const navy = "#1e3a8a";
const chassis = "#141a22";

function Atmosphere({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-air`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#f4f7fb" />
        <stop offset="0.55" stopColor="#d5dee8" />
        <stop offset="1" stopColor="#9eacbc" />
      </linearGradient>
      <linearGradient id={`${id}-shaft`} x1="0.5" y1="1" x2="0.5" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-vignette`} cx="50%" cy="46%" r="68%">
        <stop offset="0.55" stopColor="#050914" stopOpacity="0" />
        <stop offset="1" stopColor="#050914" stopOpacity="0.72" />
      </radialGradient>
      <linearGradient id={`${id}-road`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#243044" />
        <stop offset="1" stopColor="#121820" />
      </linearGradient>
    </defs>
  );
}

function Carton({
  x,
  y,
  w,
  h,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={tone} />
      <rect x={x} y={y + h * 0.42} width={w} height={h * 0.08} fill="#efe6d6" opacity="0.85" />
      <rect x={x + w * 0.08} y={y + 4} width={w * 0.84} height="2" fill="#6d5438" opacity="0.35" />
    </g>
  );
}

function Stack({
  x,
  base,
  columns,
}: {
  x: number;
  base: number;
  columns: { w: number; h: number; layers: number; tone: string }[];
}) {
  const placed = columns.map((column, index) => ({
    ...column,
    x: x + columns.slice(0, index).reduce((sum, item) => sum + item.w + 6, 0),
  }));
  return (
    <g>
      {placed.map((column) => (
        <g key={column.x}>
          {Array.from({ length: column.layers }, (_, layer) => (
            <Carton
              key={layer}
              x={column.x}
              y={base - (layer + 1) * (column.h + 3)}
              w={column.w}
              h={column.h}
              tone={layer % 2 === 0 ? column.tone : cartonC}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

function Interior({ shut, pull, id }: { shut: number; pull: number; id: string }) {
  const hingeL = 250;
  const hingeR = 1350;
  const scale = 1 - pull * 0.18;
  return (
    <g transform={`translate(800 470) scale(${scale}) translate(-800 -470)`}>
      <polygon points="250,90 1350,90 1180,250 420,250" fill="#eef3f8" />
      <polygon points="250,90 420,250 420,640 250,820" fill={interiorWall} />
      <polygon points="1350,90 1180,250 1180,640 1350,820" fill={interiorShade} />
      <polygon points="420,250 1180,250 1180,640 420,640" fill={`url(#${id}-air)`} />
      <polygon points="250,820 1350,820 1180,640 420,640" fill={floor} />
      {Array.from({ length: 14 }, (_, index) => {
        const t = (index + 1) / 15;
        const near = 280 + t * 1040;
        const far = 460 + t * 680;
        return <line key={index} x1={near} y1="820" x2={far} y2="640" stroke="#6e7c8b" strokeWidth="3" />;
      })}
      <rect x="690" y="268" width="220" height="36" fill="#8ea0b3" />
      <rect x="720" y="300" width="160" height="8" fill="#5e7084" />
      <g transform="translate(0 8)">
        <rect x="500" y="612" width="250" height="16" fill={wood} />
        <Stack
          x={508}
          base={612}
          columns={[
            { w: 72, h: 46, layers: 4, tone: cartonA },
            { w: 64, h: 50, layers: 5, tone: cartonB },
            { w: 78, h: 42, layers: 3, tone: cartonA },
          ]}
        />
        <rect x="860" y="626" width="230" height="14" fill="#a97848" />
        <g>
          {[0, 1, 2].map((layer) => (
            <g key={layer} transform={`translate(868 ${590 - layer * 58})`}>
              <rect width="214" height="52" fill={layer === 2 ? "#c49262" : wood} />
              <rect y="8" width="214" height="6" fill="#6b4428" opacity="0.35" />
              <rect y="28" width="214" height="6" fill="#6b4428" opacity="0.35" />
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((fruitIndex) => (
            <circle key={fruitIndex} cx={912 + fruitIndex * 34} cy="500" r="13" fill={fruit} />
          ))}
        </g>
      </g>
      {shut < 0.3 ? (
        <>
          <polygon points="0,40 230,108 230,792 0,748" fill={body} />
          <polygon points="230,108 276,128 276,808 230,792" fill={chassis} />
          <polygon points="1600,40 1370,108 1370,792 1600,748" fill="#d5dee8" />
          <polygon points="1370,108 1324,128 1324,808 1370,792" fill={chassis} />
        </>
      ) : (
        <>
          <polygon points="120,70 690,160 670,760 100,830" fill={body} />
          <polygon points="670,160 704,172 684,772 670,760" fill={chassis} />
          <polygon points="1480,70 910,160 930,760 1500,830" fill="#d5dee8" />
          <polygon points="910,160 876,172 896,772 930,760" fill={chassis} />
        </>
      )}
      <rect x={hingeL - 8} y="180" width="16" height="36" fill="#0b0e14" />
      <rect x={hingeL - 8} y="430" width="16" height="36" fill="#0b0e14" />
      <rect x={hingeL - 8} y="680" width="16" height="36" fill="#0b0e14" />
      <rect x={hingeR - 8} y="180" width="16" height="36" fill="#0b0e14" />
      <rect x={hingeR - 8} y="430" width="16" height="36" fill="#0b0e14" />
      <rect x={hingeR - 8} y="680" width="16" height="36" fill="#0b0e14" />
      <polygon points="300,780 1300,780 1340,860 260,860" fill={`url(#${id}-shaft)`} opacity={1 - shut} />
    </g>
  );
}

export function InteriorFrame() {
  return (
    <Stage label="Khoang lạnh nhìn từ ngoài cửa sau đang mở, hàng đã xếp.">
      <img src={interiorStill} alt="" className="h-full w-full object-cover" />
    </Stage>
  );
}

export function DoorsFrame() {
  return (
    <Stage label="Cùng khoang, cửa đang khép và camera đã lùi nhẹ.">
      <svg viewBox="0 0 1600 900" className="h-full w-full" role="presentation">
        <Atmosphere id="doors" />
        <rect width="1600" height="900" fill="#050914" />
        <Interior shut={0.42} pull={1} id="doors" />
        <rect width="1600" height="900" fill="url(#doors-vignette)" />
      </svg>
    </Stage>
  );
}

export function RearFrame() {
  return (
    <Stage label="Mặt sau xe lạnh đã đóng cửa, cùng khung cửa và sọc navy.">
      <svg viewBox="0 0 1600 900" className="h-full w-full" role="presentation">
        <Atmosphere id="rear" />
        <rect width="1600" height="900" fill="#07101c" />
        <ellipse cx="800" cy="800" rx="640" ry="48" fill="#101820" />
        <rect x="250" y="360" width="150" height="210" rx="8" fill="#1a222e" />
        <rect x="1200" y="360" width="150" height="210" rx="8" fill="#1a222e" />
        <rect x="390" y="180" width="820" height="560" fill={body} />
        <rect x="390" y="180" width="36" height="560" fill={navy} />
        <rect x="1174" y="180" width="36" height="560" fill={navy} />
        <rect x="426" y="210" width="360" height="470" fill="#f4f8fb" />
        <rect x="814" y="210" width="360" height="470" fill="#e3ebf3" />
        <rect x="786" y="210" width="28" height="470" fill={chassis} />
        <rect x="500" y="250" width="250" height="8" fill="#c5d0dc" />
        <rect x="850" y="250" width="250" height="8" fill="#c5d0dc" />
        <rect x="455" y="248" width="14" height="400" fill="#9aa8b8" />
        <rect x="1131" y="248" width="14" height="400" fill="#9aa8b8" />
        <rect x="470" y="600" width="280" height="16" fill={chassis} />
        <rect x="850" y="600" width="280" height="16" fill={chassis} />
        <rect x="340" y="720" width="920" height="36" fill="#2c3644" />
        <rect x="300" y="756" width="1000" height="22" fill={chassis} />
        <circle cx="450" cy="230" r="12" fill="#ef4444" />
        <circle cx="1150" cy="230" r="12" fill="#ef4444" />
        <rect x="470" y="778" width="70" height="46" fill="#0c1016" />
        <rect x="1060" y="778" width="70" height="46" fill="#0c1016" />
        <rect width="1600" height="900" fill="url(#rear-vignette)" />
      </svg>
    </Stage>
  );
}

export function OverheadFrame() {
  return (
    <Stage label="Cùng chiếc xe, nhìn từ trên cao khi đang đi trên đường.">
      <svg viewBox="0 0 1600 900" className="h-full w-full" role="presentation">
        <Atmosphere id="overhead" />
        <rect width="1600" height="900" fill="#07101c" />
        <path
          d="M 120 760 C 420 700, 620 520, 860 430 S 1280 180, 1500 150"
          fill="none"
          stroke="url(#overhead-road)"
          strokeWidth="210"
          strokeLinecap="round"
        />
        <path
          d="M 120 760 C 420 700, 620 520, 860 430 S 1280 180, 1500 150"
          fill="none"
          stroke="#dbe7f5"
          strokeWidth="3"
          strokeDasharray="18 28"
          opacity="0.45"
        />
        <g transform="translate(820 470) rotate(-32) scale(1.35)">
          <ellipse cx="30" cy="36" rx="170" ry="52" fill="#05080f" opacity="0.5" />
          <rect x="-120" y="-48" width="280" height="96" fill={body} />
          <rect x="-120" y="-48" width="280" height="18" fill={navy} />
          <rect x="160" y="-40" width="72" height="80" fill="#243044" />
          <rect x="-132" y="-10" width="18" height="24" fill={chassis} />
          <rect x="148" y="18" width="22" height="16" fill="#9aa8b8" />
        </g>
        <rect width="1600" height="900" fill="url(#overhead-vignette)" />
      </svg>
    </Stage>
  );
}

export function MapFrame() {
  return (
    <Stage label="Lộ trình tối giản từ điểm đi đến điểm đến.">
      <svg viewBox="0 0 1600 900" className="h-full w-full" role="presentation">
        <Atmosphere id="map" />
        <rect width="1600" height="900" fill="#07101c" />
        <path
          d="M 340 640 C 560 610, 700 470, 860 420 S 1180 250, 1260 280"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="340" cy="640" r="14" fill="#07101c" stroke="#e7eef6" strokeWidth="3" />
        <circle cx="1260" cy="280" r="14" fill={navy} stroke="#7dd3fc" strokeWidth="3" />
        <text x="370" y="628" fill="#e7eef6" fontSize="28" fontFamily="Be Vietnam Pro, sans-serif">
          A · Điểm đi
        </text>
        <text x="980" y="250" fill="#e7eef6" fontSize="28" fontFamily="Be Vietnam Pro, sans-serif">
          B · Điểm đến
        </text>
        <rect width="1600" height="900" fill="url(#map-vignette)" />
      </svg>
    </Stage>
  );
}

function Stage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="relative aspect-video overflow-hidden bg-[#050914]">
      {children}
    </div>
  );
}
