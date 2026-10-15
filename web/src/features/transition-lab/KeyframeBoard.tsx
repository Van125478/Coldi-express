import type { ReactNode } from "react";
import { storyboard, type PhaseId } from "@/features/transition-lab/phases";
import { DoorsFrame, InteriorFrame, MapFrame, OverheadFrame, RearFrame, RiseFrame } from "@/features/transition-lab/keyframes";

const scenes: Record<PhaseId, () => ReactNode> = {
  interior: InteriorFrame,
  doors: DoorsFrame,
  rear: RearFrame,
  rise: RiseFrame,
  overhead: OverheadFrame,
  map: MapFrame,
};

export function KeyframeBoard() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-8 sm:py-12">
      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-white/45 uppercase">Transition lab · Phase 1</p>
        <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Sáu nhịp, một chiếc xe lạnh.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
          Bảng khóa tĩnh để duyệt ngôn ngữ hình. Chưa gắn cuộn trang. Mỗi khung giữ cùng thùng xe, sọc navy và ánh lạnh.
        </p>
      </header>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Chọn khung hình">
        {storyboard.map((phase, index) => (
          <a
            key={phase.id}
            href={`#beat-${phase.id}`}
            className="inline-flex min-h-11 items-center border border-white/15 px-3 text-sm text-white/80"
          >
            {index + 1} · {phase.from}–{phase.to}%
          </a>
        ))}
      </nav>
      <ol className="mt-10 space-y-16">
        {storyboard.map((phase, index) => {
          const Scene = scenes[phase.id];
          return (
            <li key={phase.id} id={`beat-${phase.id}`} className="scroll-mt-6">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  <span className="mr-3 text-white/40">{String(index + 1).padStart(2, "0")}</span>
                  {phase.title}
                </h2>
                <p className="shrink-0 text-sm text-white/45">
                  {phase.from}–{phase.to}%
                </p>
              </div>
              <Scene />
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
                <span className="font-semibold text-white/80">Chuyển tiếp. </span>
                {phase.transition}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
