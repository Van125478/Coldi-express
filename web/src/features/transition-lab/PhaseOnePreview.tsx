import { useEffect, useRef, useState } from "react";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import { phaseRange } from "@/features/transition-lab/phases";

const DOOR_VIDEO = "/cinematic/phase-2/coldi-doors-closing.mp4";
const PULL_VIDEO = "/cinematic/phase-3/coldi-phase-3-pullback.mp4";
const RISE_VIDEO = "/cinematic/phase-4/coldi-phase-4-camera-rise.mp4";
const PUSH_SCALE = 1.08;
const FRAME_STEP = 1 / 24;
/** Scroll distance of the approved 0–15% push. Later phases lengthen the same pin by this ratio. */
const PHASE_ONE_PIN = { desktop: 140, mobile: 110 };

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

function attachScrub(video: HTMLVideoElement) {
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
    const atEnd = next >= lastFrame - 0.001;
    if (atEnd ? video.currentTime >= lastFrame - 0.001 : Math.abs(video.currentTime - next) < FRAME_STEP / 2) return;
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
  const doorRef = useRef<HTMLVideoElement>(null);
  const pullRef = useRef<HTMLVideoElement>(null);
  const riseRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const image = imageRef.current;
    const door = doorRef.current;
    const pull = pullRef.current;
    const rise = riseRef.current;
    if (!root || !pin || !image || !door || !pull || !rise || reduce) return;

    let active = true;
    let revertMedia: (() => void) | undefined;
    const interior = phaseRange("interior");
    const doors = phaseRange("doors");
    const rearPhase = phaseRange("rear");
    const risePhase = phaseRange("rise");
    const doorScrub = attachScrub(door);
    const pullScrub = attachScrub(pull);
    const riseScrub = attachScrub(rise);
    door.muted = true;
    pull.muted = true;
    rise.muted = true;
    door.pause();
    pull.pause();
    rise.pause();

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!active) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.set(image, { scale: 1, transformOrigin: "50% 50%" });
      writeProgress(root, 0, risePhase.end);

      let doorReady = door.readyState >= 2;
      let pullReady = pull.readyState >= 2;
      let riseReady = rise.readyState >= 2;
      const paint = (timeline: number) => {
        const showRise = riseReady && timeline >= rearPhase.end;
        const showPull = pullReady && timeline >= doors.end && !showRise;
        const showDoor = doorReady && timeline >= doors.start && !showPull && !showRise;
        image.style.opacity = showDoor || showPull || showRise ? "0" : "1";
        door.style.opacity = showDoor ? "1" : "0";
        pull.style.opacity = showPull ? "1" : "0";
        rise.style.opacity = showRise ? "1" : "0";
      };

      let latest = 0;
      const sync = (timeline: number) => {
        latest = timeline;
        writeProgress(root, timeline, risePhase.end);
        paint(timeline);
        if (Number.isFinite(door.duration)) {
          if (timeline <= doors.start) doorScrub.seek(0);
          else if (timeline >= doors.end) doorScrub.seek(door.duration);
          else doorScrub.seek(((timeline - doors.start) / (doors.end - doors.start)) * door.duration);
        }
        if (Number.isFinite(pull.duration)) {
          if (timeline <= doors.end) pullScrub.seek(0);
          else if (timeline >= rearPhase.end) pullScrub.seek(pull.duration);
          else pullScrub.seek(((timeline - doors.end) / (rearPhase.end - doors.end)) * pull.duration);
        }
        if (Number.isFinite(rise.duration)) {
          if (timeline <= rearPhase.end) riseScrub.seek(0);
          else if (timeline >= risePhase.end) riseScrub.seek(rise.duration);
          else riseScrub.seek(((timeline - rearPhase.end) / (risePhase.end - rearPhase.end)) * rise.duration);
        }
      };
      const onDoorReady = () => {
        doorReady = true;
        sync(latest);
      };
      const onPullReady = () => {
        pullReady = true;
        sync(latest);
      };
      const onRiseReady = () => {
        riseReady = true;
        sync(latest);
      };
      const keepDoorPaused = () => {
        door.pause();
      };
      const keepPullPaused = () => {
        pull.pause();
      };
      const keepRisePaused = () => {
        rise.pause();
      };
      door.addEventListener("loadeddata", onDoorReady);
      pull.addEventListener("loadeddata", onPullReady);
      rise.addEventListener("loadeddata", onRiseReady);
      door.addEventListener("play", keepDoorPaused);
      pull.addEventListener("play", keepPullPaused);
      rise.addEventListener("play", keepRisePaused);
      if (door.readyState >= 2) onDoorReady();
      if (pull.readyState >= 2) onPullReady();
      if (rise.readyState >= 2) onRiseReady();

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
            onUpdate: (self) => sync(self.progress * risePhase.end),
          },
        });
        timeline.fromTo(
          image,
          { scale: 1 },
          { scale: PUSH_SCALE, duration: interior.end - interior.start },
          interior.start,
        );
        timeline.to(image, { scale: PUSH_SCALE, duration: doors.end - doors.start }, doors.start);
        timeline.to(image, { scale: PUSH_SCALE, duration: rearPhase.end - doors.end }, doors.end);
        timeline.to(image, { scale: PUSH_SCALE, duration: risePhase.end - rearPhase.end }, rearPhase.end);
      };

      const pinEnd = (phaseOneDistance: number) => `+=${((phaseOneDistance * risePhase.end) / interior.end).toFixed(4)}%`;
      media.add("(min-width: 768px)", () => {
        bind(pinEnd(PHASE_ONE_PIN.desktop));
      });
      media.add("(max-width: 767px)", () => {
        bind(pinEnd(PHASE_ONE_PIN.mobile));
      });
      revertMedia = () => {
        door.removeEventListener("loadeddata", onDoorReady);
        pull.removeEventListener("loadeddata", onPullReady);
        rise.removeEventListener("loadeddata", onRiseReady);
        door.removeEventListener("play", keepDoorPaused);
        pull.removeEventListener("play", keepPullPaused);
        rise.removeEventListener("play", keepRisePaused);
        media.revert();
      };
    })();

    return () => {
      active = false;
      doorScrub.stop();
      pullScrub.stop();
      riseScrub.stop();
      revertMedia?.();
    };
  }, [reduce]);

  return (
    <section ref={rootRef} id="phase-one" className="bg-[#050914]" aria-labelledby="phase-one-title">
      <div ref={pinRef} className="flex min-h-svh flex-col justify-center px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/45 uppercase">Xem trước cuộn · Nhịp 1–4</p>
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <h2 id="phase-one-title" className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              Khoang lạnh đến góc cao, 0–65%
            </h2>
            <p className="shrink-0 text-sm text-white/55">
              Dòng thời gian <span data-timeline-label>0%</span>
            </p>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            {reduce
              ? "Trình duyệt đang giảm chuyển động, nên khung mở đầu đứng yên."
              : "Kéo trang để máy tiến vào khoang, cửa sau khép, máy lùi sang góc 3/4 đuôi xe, rồi nâng lên nhìn mái thùng. Kéo ngược để quay lại. Sau 65% chưa chạy."}
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
                ref={doorRef}
                className="absolute inset-0 h-full w-full object-cover opacity-0"
                src={DOOR_VIDEO}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-hidden="true"
              />
            )}
            {reduce ? null : (
              <video
                ref={pullRef}
                className="absolute inset-0 h-full w-full object-cover opacity-0"
                src={PULL_VIDEO}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-hidden="true"
              />
            )}
            {reduce ? null : (
              <video
                ref={riseRef}
                className="absolute inset-0 h-full w-full object-cover opacity-0"
                src={RISE_VIDEO}
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
