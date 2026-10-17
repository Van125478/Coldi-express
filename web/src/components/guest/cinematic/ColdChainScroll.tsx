import { useEffect, useRef, useState } from "react";
import { applyScrollProgress, scrollChapters } from "@/components/guest/cinematic/applyScrollProgress";
import { ColdChainWorld } from "@/components/guest/cinematic/ColdChainWorld";

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

export function ColdChainScroll() {
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    if (!root || !pin || reduce) return;

    let active = true;
    let revertMedia: (() => void) | undefined;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!active) return;
      gsap.registerPlugin(ScrollTrigger);

      const media = gsap.matchMedia();
      const bind = (end: string) => {
        ScrollTrigger.create({
          trigger: root,
          pin,
          start: "top top",
          end,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => applyScrollProgress(pin, self.progress),
        });
      };

      media.add("(min-width: 1024px)", () => bind("+=240%"));
      media.add("(max-width: 1023px)", () => bind("+=140%"));
      applyScrollProgress(pin, 0);
      revertMedia = () => media.revert();
    })();

    return () => {
      active = false;
      revertMedia?.();
    };
  }, [reduce]);

  useEffect(() => {
    if (!reduce || !pinRef.current) return;
    applyScrollProgress(pinRef.current, 1);
  }, [reduce]);

  return (
    <section ref={rootRef} className="bg-navy text-white" aria-labelledby="cinematic-title">
      <div ref={pinRef} className="relative z-0 flex min-h-[100svh] flex-col px-4 pt-24 pb-8 sm:px-8">
        <p className="sr-only">
          Bốn cảnh minh họa: chuẩn bị hàng tại kho lạnh, lên xe lạnh, di chuyển trên đường bộ, rồi đến điểm giao nơi chủ hàng
          và nhà xe được kết nối. Không phải chuyến đang chạy và không phải GPS.
        </p>
        {reduce ? <StaticChapters /> : <ChapterCopy />}
        <div className="relative mt-6 h-[min(52svh,64vw)] min-h-44 w-full overflow-hidden rounded-3xl border border-white/15 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
          <ColdChainWorld />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75">
          Kéo trang để đi từ kho lạnh tới điểm giao. Chuỗi này là minh họa thương hiệu, không phải hành trình hay định vị thật.
        </p>
        {reduce ? null : (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
            <div data-progress-bar className="h-full origin-left scale-x-0 bg-white" />
          </div>
        )}
      </div>
    </section>
  );
}

function ChapterCopy() {
  const first = scrollChapters[0];
  return (
    <div className="max-w-3xl">
      <p data-chapter-index className="text-sm font-bold tracking-[0.18em] text-white/70">
        {first?.index}
      </p>
      <h2 data-chapter-title id="cinematic-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
        {first?.title}
      </h2>
      <p data-chapter-body className="mt-3 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
        {first?.body}
      </p>
    </div>
  );
}

function StaticChapters() {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold tracking-[0.18em] text-white/70">Minh họa tĩnh</p>
      <h2 id="cinematic-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
        Từ kho lạnh đến điểm giao
      </h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {scrollChapters.map((chapter) => (
          <li key={chapter.index} className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-bold text-white/70">{chapter.index}</p>
            <p className="mt-1 font-bold">{chapter.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">{chapter.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
