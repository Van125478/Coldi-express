import { useEffect, useRef, useState } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import { phaseRange } from "@/features/transition-lab/phases";

const DOOR_VIDEO = "/cinematic/phase-2/coldi-doors-closing.mp4";
const PUSH_SCALE = 1.08;
const FRAME_STEP = 1 / 24;

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

function writeProgress(root: HTMLElement, timeline: number, span: number) {
  const label = root.querySelector<HTMLElement>("[data-timeline-label]");
  const bar = root.querySelector<HTMLElement>("[data-timeline-bar]");
  if (label) label.textContent = `${Math.round(timeline * 100)}%`;
  if (bar) bar.style.transform = `scaleX(${span === 0 ? 0 : timeline / span})`;
}

function attachDoorScrub(video: HTMLVideoElement) {
  let pending: number | null = null;
  let seeking = false;

  const apply = (time: number) => {
    if (!Number.isFinite(video.duration) || video.readyState < 1) return;
    const lastFrame = Math.max(0, video.duration - FRAME_STEP);
    const next = Math.min(Math.max(time, 0), lastFrame);
    if (seeking) {
      pending = next;
      return;
    }
    if (Math.abs(video.currentTime - next) < FRAME_STEP / 2) return;
    seeking = true;
    video.currentTime = next;
  };

  const onSeeked = () => {
    seeking = false;
    if (pending === null) return;
    const next = pending;
    pending = null;
    apply(next);
  };

  video.addEventListener("seeked", onSeeked);
  return {
    seek: apply,
    stop() {
      video.removeEventListener("seeked", onSeeked);
      video.pause();
    },
  };
}

export function PhaseOnePreview() {
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const image = imageRef.current;
    const video = videoRef.current;
    if (!root || !pin || !image || !video || reduce) return;

    let active = true;
    let revertMedia: (() => void) | undefined;
    const interior = phaseRange("interior");
    const doors = phaseRange("doors");
    const scrub = attachDoorScrub(video);
    video.muted = true;
    video.pause();

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!active) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.set(image, { scale: 1, transformOrigin: "50% 50%" });
      writeProgress(root, 0, doors.end);

      let primed = video.readyState >= 2;
      const showVideo = (timeline: number) => {
        const playing = timeline >= doors.start && primed;
        image.style.opacity = playing ? "0" : "1";
        video.style.opacity = playing ? "1" : "0";
      };

      let latest = 0;
      const sync = (timeline: number) => {
        latest = timeline;
        writeProgress(root, timeline, doors.end);
        showVideo(timeline);
        if (!Number.isFinite(video.duration)) return;
        if (timeline <= doors.start) {
          scrub.seek(0);
          return;
        }
        const local = Math.min(1, (timeline - doors.start) / (doors.end - doors.start));
        scrub.seek(local * video.duration);
      };
      const onReady = () => {
        primed = true;
        sync(latest);
      };
      const keepPaused = () => {
        video.pause();
      };
      video.addEventListener("loadeddata", onReady);
      video.addEventListener("play", keepPaused);
      if (video.readyState >= 2) onReady();

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
            onUpdate: (self) => sync(self.progress * doors.end),
          },
        });
        timeline.fromTo(
          image,
          { scale: 1 },
          { scale: PUSH_SCALE, duration: interior.end - interior.start },
          interior.start,
        );
        timeline.to(image, { scale: PUSH_SCALE, duration: doors.end - doors.start }, doors.start);
      };

      media.add("(min-width: 768px)", () => {
        bind("+=280%");
      });
      media.add("(max-width: 767px)", () => {
        bind("+=220%");
      });
      revertMedia = () => {
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("play", keepPaused);
        media.revert();
      };
    })();

    return () => {
      active = false;
      scrub.stop();
      revertMedia?.();
    };
  }, [reduce]);

  return (
    <section ref={rootRef} id="phase-one" className="bg-[#050914]" aria-labelledby="phase-one-title">
      <div ref={pinRef} className="flex min-h-svh flex-col justify-center px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/45 uppercase">Xem trước cuộn · Nhịp 1–2</p>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 id="phase-one-title" className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              Khoang lạnh và cửa đóng, 0–30%
            </h2>
            <p className="shrink-0 text-sm text-white/55">
              Dòng thời gian <span data-timeline-label>0%</span>
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            {reduce
              ? "Trình duyệt đang giảm chuyển động, nên khung mở đầu đứng yên."
              : "Kéo trang để máy tiến vào khoang, rồi cửa sau khép theo cuộn. Kéo ngược để mở lại. Sau 30% chưa chạy."}
          </p>
          <div className="relative mx-auto mt-6 aspect-video w-[min(100%,calc(68svh*16/9))] max-w-full overflow-hidden bg-[#050914]">
            <img
              ref={imageRef}
              src={interiorStill}
              alt="Khoang lạnh nhìn từ ngoài cửa sau đang mở, hàng đã xếp."
              className="h-full w-full object-cover"
            />
            {reduce ? null : (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover opacity-0"
                src={DOOR_VIDEO}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-hidden="true"
              />
            )}
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
