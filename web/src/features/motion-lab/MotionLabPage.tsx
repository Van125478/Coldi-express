import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { LiftWorld } from "@/features/motion-lab/LiftWorld";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function MotionLabPage() {
  const progress = useRef(0);
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [webgl] = useState(canUseWebGL);
  const [shadows] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    if (!root || !pin || reduced || !webgl) return;

    let alive = true;
    let revert = () => {};

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!alive) return;
      gsap.registerPlugin(ScrollTrigger);
      const trigger = ScrollTrigger.create({
        trigger: root,
        pin,
        start: "top top",
        end: "+=400%",
        scrub: 0.45,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          if (labelRef.current) labelRef.current.textContent = `${Math.round(self.progress * 100)}%`;
        },
      });
      revert = () => trigger.kill();
    })();

    return () => {
      alive = false;
      revert();
    };
  }, [reduced, webgl]);

  useEffect(() => {
    if (!reduced) return;
    progress.current = 1;
    if (labelRef.current) labelRef.current.textContent = "100%";
  }, [reduced]);

  return (
    <section ref={rootRef} className="bg-[#f4f6f8] text-[#102033]">
      <div ref={pinRef} className="relative h-[100svh] overflow-hidden">
        {webgl ? (
          <Suspense fallback={<div className="absolute inset-0 bg-[#f4f6f8]" />}>
            <Canvas
              className="absolute inset-0"
              shadows={shadows}
              camera={{ position: [-4, 5.6, 34], fov: 38, near: 0.1, far: 140 }}
              dpr={shadows ? [1, 1.5] : [1, 1.15]}
              gl={{ antialias: true, powerPreference: "high-performance" }}
            >
              <LiftWorld progress={progress} shadows={shadows} />
            </Canvas>
          </Suspense>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <p>Trình duyệt không dựng được WebGL. Không có cảnh thay thế bằng hình phẳng.</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-6">
          <div className="pointer-events-auto max-w-md rounded-2xl bg-white/88 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-bold tracking-[0.16em] text-[#1e3a8a] uppercase">Motion lab</p>
            <p ref={labelRef} className="mt-1 text-3xl font-extrabold">
              0%
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              Mẫu hình ảnh: xe nâng container đưa thùng lạnh lên rơ-moóc. Đây không phải nghiệp vụ đã chốt của Coldi.
            </p>
            <Link to={paths.home} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#1e3a8a]">
              Về trang khách
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
