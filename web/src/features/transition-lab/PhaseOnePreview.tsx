import { useEffect, useRef, useState } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import { phaseRange, toTimelineProgress } from "@/features/transition-lab/phases";

const PHASE_ID = "interior" as const;
const PUSH_SCALE = 1.08;

function usePrefersReducedMotion() {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setMatches(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return matches;
}

function writeProgress(root: HTMLElement, local: number) {
  const timeline = toTimelineProgress(PHASE_ID, local);
  const label = root.querySelector<HTMLElement>("[data-timeline-label]");
  const bar = root.querySelector<HTMLElement>("[data-timeline-bar]");
  if (label) label.textContent = `${Math.round(timeline * 100)}%`;
  if (bar) bar.style.transform = `scaleX(${local})`;
}

export function PhaseOnePreview() {
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const image = imageRef.current;
    if (!root || !pin || !image || reduce) return;

    let active = true;
    let revertMedia: (() => void) | undefined;
    const range = phaseRange(PHASE_ID);

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!active) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.set(image, { scale: 1, transformOrigin: "50% 50%" });
      writeProgress(root, 0);

      const media = gsap.matchMedia();
      const bind = (end: string) => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            pin,
            start: "top top",
            end,
            scrub: 0.45,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => writeProgress(root, self.progress),
          },
        });
        timeline.fromTo(image, { scale: 1 }, { scale: PUSH_SCALE, duration: range.end - range.start }, range.start);
      };

      media.add("(min-width: 768px)", () => {
        bind("+=140%");
      });
      media.add("(max-width: 767px)", () => {
        bind("+=110%");
      });
      revertMedia = () => media.revert();
    })();

    return () => {
      active = false;
      revertMedia?.();
    };
  }, [reduce]);

  return (
    <section ref={rootRef} id="phase-one" className="bg-[#050914]" aria-labelledby="phase-one-title">
      <div ref={pinRef} className="flex min-h-svh flex-col justify-center px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/45 uppercase">Xem trước cuộn · Nhịp 1</p>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 id="phase-one-title" className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              Khoang lạnh, 0–15%
            </h2>
            <p className="shrink-0 text-sm text-white/55">
              Dòng thời gian <span data-timeline-label>0%</span>
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            {reduce
              ? "Trình duyệt đang giảm chuyển động, nên khung mở đầu đứng yên."
              : "Kéo trang để máy tiến nhẹ vào khoang. Kéo ngược để lùi lại. Các nhịp sau chưa chạy."}
          </p>
          <div className="mx-auto mt-6 aspect-video w-[min(100%,calc(68svh*16/9))] max-w-full overflow-hidden bg-[#050914]">
            <img
              ref={imageRef}
              src={interiorStill}
              alt="Khoang lạnh nhìn từ ngoài cửa sau đang mở, hàng đã xếp."
              className="h-full w-full object-cover"
            />
          </div>
          {reduce ? null : (
            <div className="mt-4 h-1 overflow-hidden bg-white/15" aria-hidden="true">
              <div data-timeline-bar className="h-full origin-left bg-[#7dd3fc]" style={{ transform: "scaleX(0)" }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
