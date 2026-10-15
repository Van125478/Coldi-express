import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import interiorStill from "@/features/transition-lab/keyframe-01-open-reefer.jpg";
import { hanoi, hcmc, hcmcToHanoi, phuQuoc, roadApproach, vietnamCoast } from "@/features/transition-lab/mapArt";
import { phaseRange } from "@/features/transition-lab/phases";

const DOOR_VIDEO = "/cinematic/phase-2/coldi-doors-closing.mp4";
const PULL_VIDEO = "/cinematic/phase-3/coldi-phase-3-pullback.mp4";
const RISE_VIDEO = "/cinematic/phase-4/coldi-phase-4-camera-rise.mp4";
const DRIVE_VIDEO = "/cinematic/phase-5/coldi-phase-5-driving.mp4";
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

export function CinematicJourney() {
  return <PhaseOnePreview mode="guest" />;
}

export function PhaseOnePreview({ mode = "lab" }: { mode?: "lab" | "guest" }) {
  const reduce = usePrefersReducedMotion();
  const guest = mode === "guest";
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const doorRef = useRef<HTMLVideoElement>(null);
  const pullRef = useRef<HTMLVideoElement>(null);
  const riseRef = useRef<HTMLVideoElement>(null);
  const driveRef = useRef<HTMLVideoElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const routeGlowRef = useRef<SVGPathElement>(null);
  const routeCoreRef = useRef<SVGPathElement>(null);
  const travelerRef = useRef<SVGCircleElement>(null);
  const originRef = useRef<SVGGElement>(null);
  const destRef = useRef<SVGGElement>(null);
  const destLabelRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const image = imageRef.current;
    const door = doorRef.current;
    const pull = pullRef.current;
    const rise = riseRef.current;
    const drive = driveRef.current;
    if (!root || !pin || !image || !door || !pull || !rise || !drive || reduce) return;

    let active = true;
    let revertMedia: (() => void) | undefined;
    const interior = phaseRange("interior");
    const doors = phaseRange("doors");
    const rearPhase = phaseRange("rear");
    const risePhase = phaseRange("rise");
    const drivePhase = phaseRange("overhead");
    const mapPhase = phaseRange("map");
    const doorScrub = attachScrub(door);
    const pullScrub = attachScrub(pull);
    const riseScrub = attachScrub(rise);
    const driveScrub = attachScrub(drive);
    door.muted = true;
    pull.muted = true;
    rise.muted = true;
    drive.muted = true;
    door.pause();
    pull.pause();
    rise.pause();
    drive.pause();

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!active) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.set(image, { scale: 1, transformOrigin: "50% 50%" });
      writeProgress(root, 0, mapPhase.end);

      let doorReady = door.readyState >= 2;
      let pullReady = pull.readyState >= 2;
      let riseReady = rise.readyState >= 2;
      let driveReady = drive.readyState >= 2;
      const paint = (timeline: number) => {
        const showDrive = driveReady && timeline >= risePhase.end;
        const showRise = riseReady && timeline >= rearPhase.end && !showDrive;
        const showPull = pullReady && timeline >= doors.end && !showRise && !showDrive;
        const showDoor = doorReady && timeline >= doors.start && !showPull && !showRise && !showDrive;
        image.style.opacity = showDoor || showPull || showRise || showDrive ? "0" : "1";
        door.style.opacity = showDoor ? "1" : "0";
        pull.style.opacity = showPull ? "1" : "0";
        rise.style.opacity = showRise ? "1" : "0";
        drive.style.opacity = showDrive ? "1" : "0";
      };

      let latest = 0;
      const sync = (timeline: number) => {
        latest = timeline;
        writeProgress(root, timeline, mapPhase.end);
        paint(timeline);
        paintRoute(timeline);
        const hero = heroRef.current;
        if (hero) {
          const shown = timeline <= 0.1 ? 1 - timeline / 0.1 : 0;
          hero.style.opacity = String(shown);
          if (shown < 0.05) hero.setAttribute("inert", "");
          else hero.removeAttribute("inert");
        }
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
        if (Number.isFinite(drive.duration)) {
          if (timeline <= risePhase.end) driveScrub.seek(0);
          else if (timeline >= drivePhase.end) driveScrub.seek(drive.duration);
          else driveScrub.seek(((timeline - risePhase.end) / (drivePhase.end - risePhase.end)) * drive.duration);
        }
      };
      let routeLength = 0;
      const paintRoute = (timeline: number) => {
        const veil = veilRef.current;
        const lane = laneRef.current;
        const map = mapRef.current;
        const glow = routeGlowRef.current;
        const core = routeCoreRef.current;
        const traveler = travelerRef.current;
        const origin = originRef.current;
        const dest = destRef.current;
        const destLabel = destLabelRef.current;
        if (!veil || !lane || !map || !glow || !core || !traveler || !origin || !dest || !destLabel) return;
        const span = mapPhase.end - drivePhase.end;
        const local = timeline <= drivePhase.end ? 0 : timeline >= mapPhase.end ? 1 : (timeline - drivePhase.end) / span;
        const fade = (from: number, to: number) => Math.min(1, Math.max(0, (local - from) / (to - from)));
        const laneIn = fade(0.04, 0.2);
        const laneOut = fade(0.28, 0.48);
        const mapIn = fade(0.22, 0.52);
        const draw = fade(0.4, 0.94);
        veil.style.opacity = String(fade(0, 0.32) * 0.72);
        lane.style.opacity = String(laneIn * (1 - laneOut));
        map.style.opacity = String(mapIn);
        if (routeLength === 0) routeLength = core.getTotalLength();
        const offset = routeLength * (1 - draw);
        glow.style.strokeDasharray = `${routeLength}`;
        glow.style.strokeDashoffset = `${offset}`;
        core.style.strokeDasharray = `${routeLength}`;
        core.style.strokeDashoffset = `${offset}`;
        if (draw <= 0.008) {
          traveler.style.opacity = "0";
        } else {
          const point = core.getPointAtLength(routeLength * Math.min(draw, 1));
          traveler.setAttribute("cx", String(point.x));
          traveler.setAttribute("cy", String(point.y));
          traveler.style.opacity = draw >= 0.985 ? "0" : "1";
        }
        origin.style.opacity = String(fade(0.46, 0.62));
        dest.style.opacity = String(mapIn * (0.28 + 0.72 * fade(0.86, 1)));
        destLabel.style.opacity = String(fade(0.86, 1));
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
      const onDriveReady = () => {
        driveReady = true;
        sync(latest);
      };
      const keepRisePaused = () => {
        rise.pause();
      };
      const keepDrivePaused = () => {
        drive.pause();
      };
      door.addEventListener("loadeddata", onDoorReady);
      pull.addEventListener("loadeddata", onPullReady);
      rise.addEventListener("loadeddata", onRiseReady);
      drive.addEventListener("loadeddata", onDriveReady);
      door.addEventListener("play", keepDoorPaused);
      pull.addEventListener("play", keepPullPaused);
      rise.addEventListener("play", keepRisePaused);
      drive.addEventListener("play", keepDrivePaused);
      if (door.readyState >= 2) onDoorReady();
      if (pull.readyState >= 2) onPullReady();
      if (rise.readyState >= 2) onRiseReady();
      if (drive.readyState >= 2) onDriveReady();

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
            onUpdate: (self) => sync(self.progress * mapPhase.end),
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
        timeline.to(image, { scale: PUSH_SCALE, duration: drivePhase.end - risePhase.end }, risePhase.end);
        timeline.to(image, { scale: PUSH_SCALE, duration: mapPhase.end - drivePhase.end }, drivePhase.end);
      };

      const pinEnd = (phaseOneDistance: number) => `+=${((phaseOneDistance * mapPhase.end) / interior.end).toFixed(4)}%`;
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
        drive.removeEventListener("loadeddata", onDriveReady);
        door.removeEventListener("play", keepDoorPaused);
        pull.removeEventListener("play", keepPullPaused);
        rise.removeEventListener("play", keepRisePaused);
        drive.removeEventListener("play", keepDrivePaused);
        media.revert();
      };
    })();

    return () => {
      active = false;
      doorScrub.stop();
      pullScrub.stop();
      riseScrub.stop();
      driveScrub.stop();
      revertMedia?.();
    };
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      id={guest ? "hanh-trinh" : "phase-one"}
      className="bg-[#050914] text-white"
      aria-labelledby={guest ? "guest-hero-title" : "phase-one-title"}
    >
      <div ref={pinRef} className="relative flex min-h-svh flex-col justify-center px-4 py-8 sm:px-8">
        {guest ? (
          <div ref={heroRef} className="absolute inset-x-0 top-0 z-10 px-4 pt-20 sm:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#050914] via-[#050914]/88 to-transparent" />
            <div className="relative mx-auto max-w-5xl">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-white/70 uppercase">Coldi · Giải pháp vận tải lạnh</p>
              <h1 id="guest-hero-title" className="mt-3 max-w-xl text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
                Kết nối vận tải lạnh, xuyên suốt hành trình.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                Từ đăng nhu cầu vận chuyển, nhận chuyến đến cập nhật giao nhận — một quy trình rõ ràng hơn cho chủ hàng và nhà vận tải.
              </p>
              {reduce ? (
                <p className="mt-3 max-w-lg text-sm text-white/70">Trình duyệt đang giảm chuyển động, nên khung mở đầu đứng yên.</p>
              ) : null}
              <p className="sr-only">
                Phần hình kết thúc bằng lộ trình minh họa từ TP. Hồ Chí Minh đến Hà Nội. Đây không phải vị trí GPS đang chạy.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-auto rounded-full bg-white px-6 text-navy hover:bg-white/90">
                  <a href="#sau-hanh-trinh">Khám phá COLDI</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-auto rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to={paths.login}>Đăng nhập</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-white/60">
                <a href="#sau-hanh-trinh" className="inline-flex min-h-11 items-center font-semibold text-white/80 underline-offset-4 hover:underline">
                  Bỏ qua hành trình
                </a>
                {reduce ? null : <span className="ml-4">Cuộn để khám phá</span>}
              </p>
            </div>
          </div>
        ) : null}
        <div className="mx-auto w-full max-w-5xl">
          {guest ? null : (
            <>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-white/45 uppercase">Xem trước cuộn · Nhịp 1–6</p>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <h2 id="phase-one-title" className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                  Khoang lạnh đến lộ trình, 0–100%
                </h2>
                <p className="shrink-0 text-sm text-white/55">
                  Dòng thời gian <span data-timeline-label>0%</span>
                </p>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                {reduce
                  ? "Trình duyệt đang giảm chuyển động, nên khung mở đầu đứng yên."
                  : "Kéo trang để máy tiến vào khoang, cửa sau khép, máy lùi sang góc 3/4 đuôi xe, nâng lên nhìn mái thùng, xe chạy trên đường đêm, rồi đường nhập vào lộ trình từ TP. Hồ Chí Minh đến Hà Nội. Kéo ngược để quay lại."}
              </p>
            </>
          )}
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
            {reduce ? null : (
              <video
                ref={driveRef}
                className="absolute inset-0 h-full w-full object-cover opacity-0"
                src={DRIVE_VIDEO}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                aria-hidden="true"
              />
            )}
            {reduce ? null : (
              <div ref={veilRef} className="pointer-events-none absolute inset-0 bg-[#050914] opacity-0" aria-hidden="true" />
            )}
            {reduce ? null : (
              <svg
                ref={laneRef}
                viewBox="0 0 1600 900"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                aria-hidden="true"
              >
                <defs>
                  <filter id="cine-lane-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </defs>
                <path
                  d="M1240 860 C 1140 760, 1040 680, 960 610"
                  fill="none"
                  stroke="#7dd3fc"
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="url(#cine-lane-glow)"
                  opacity="0.85"
                />
                <path d="M1240 860 C 1140 760, 1040 680, 960 610" fill="none" stroke="#f4fbff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {reduce ? null : (
              <div ref={mapRef} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
                <svg viewBox="0 0 1600 900" className="h-full w-full">
                  <defs>
                    <radialGradient id="cine-map-night" cx="58%" cy="46%" r="62%">
                      <stop offset="0" stopColor="#122448" />
                      <stop offset="1" stopColor="#050914" />
                    </radialGradient>
                    <linearGradient id="cine-map-land" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#1a3d78" />
                      <stop offset="1" stopColor="#0c1c38" />
                    </linearGradient>
                    <linearGradient id="cine-map-road" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0" stopColor="#7dd3fc" stopOpacity="0" />
                      <stop offset="0.45" stopColor="#7dd3fc" stopOpacity="0.28" />
                      <stop offset="1" stopColor="#e0f2fe" stopOpacity="0.85" />
                    </linearGradient>
                    <filter id="cine-map-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="7" />
                    </filter>
                  </defs>
                  <rect width="1600" height="900" fill="#050914" />
                  <rect width="1600" height="900" fill="url(#cine-map-night)" />
                  <path
                    d={roadApproach}
                    fill="none"
                    stroke="url(#cine-map-road)"
                    strokeWidth="22"
                    strokeLinecap="round"
                    filter="url(#cine-map-glow)"
                    opacity="0.7"
                  />
                  <path d={vietnamCoast} fill="#12305f" filter="url(#cine-map-glow)" opacity="0.45" />
                  <path d={vietnamCoast} fill="url(#cine-map-land)" stroke="#9bd8f5" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d={phuQuoc} fill="url(#cine-map-land)" stroke="#9bd8f5" strokeWidth="1.2" strokeLinejoin="round" />
                  <path
                    ref={routeGlowRef}
                    d={hcmcToHanoi}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="16"
                    strokeLinecap="round"
                    filter="url(#cine-map-glow)"
                    opacity="0.9"
                    strokeDasharray="4000"
                    strokeDashoffset="4000"
                  />
                  <path
                    ref={routeCoreRef}
                    d={hcmcToHanoi}
                    fill="none"
                    stroke="#f4fbff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray="4000"
                    strokeDashoffset="4000"
                  />
                  <circle ref={travelerRef} cx={hcmc.x} cy={hcmc.y} r="5" fill="#f4fbff" opacity="0" />
                  <g ref={originRef} opacity="0">
                    <circle cx={hcmc.x} cy={hcmc.y} r="7" fill="#050914" stroke="#e7eef6" strokeWidth="2.5" />
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
                  </g>
                  <g ref={destRef} opacity="0">
                    <circle cx={hanoi.x} cy={hanoi.y} r="8" fill="#1e3a8a" stroke="#7dd3fc" strokeWidth="2.5" />
                  </g>
                  <text
                    ref={destLabelRef}
                    x="908"
                    y="178"
                    fill="#e7eef6"
                    stroke="#050914"
                    strokeWidth="5"
                    fontSize="26"
                    fontFamily="Be Vietnam Pro, sans-serif"
                    opacity="0"
                    style={{ paintOrder: "stroke" }}
                  >
                    Hà Nội
                  </text>
                </svg>
              </div>
            )}
          </div>
          {reduce || guest ? null : (
            <div className="mt-4 h-1 overflow-hidden bg-white/15" aria-hidden="true">
              <div data-timeline-bar className="h-full origin-left bg-[#7dd3fc]" style={{ transform: "scaleX(0)" }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
