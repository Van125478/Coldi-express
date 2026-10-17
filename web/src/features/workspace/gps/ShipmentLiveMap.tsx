import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { bindLiveMap, type LngLat } from "./mapPresentation";
import "mapbox-gl/dist/mapbox-gl.css";

const mapClass = "h-72 w-full overflow-hidden rounded-2xl border border-line sm:h-96";

export function ShipmentLiveMap({ token, position, bearingDeg }: { token: string; position: LngLat; bearingDeg: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const bearingRef = useRef(bearingDeg);
  const sessionRef = useRef<ReturnType<typeof bindLiveMap> | null>(null);
  const [failure, setFailure] = useState<"webgl" | "load_failed" | null>(null);

  useEffect(() => {
    if (failure) return;
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let session: ReturnType<typeof bindLiveMap> | null = null;

    void import("mapbox-gl/esm")
      .then((mapboxgl) => {
        if (cancelled) return;
        if (!mapboxgl.supported()) {
          setFailure("webgl");
          return;
        }
        session = bindLiveMap((initial) => {
          const map = new mapboxgl.Map({
            accessToken: token,
            container,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [initial[0], initial[1]],
            zoom: 13,
            cooperativeGestures: true,
            attributionControl: true,
          });
          map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), "top-right");
          const marker = new mapboxgl.Marker({ element: truckMarker(), anchor: "center" }).setLngLat([initial[0], initial[1]]).addTo(map);
          const bearing = bearingRef.current;
          if (bearing !== null) marker.setRotation(bearing);
          let reported = false;
          map.on("error", (event) => {
            if (cancelled || reported) return;
            const status = "status" in event.error && typeof event.error.status === "number" ? event.error.status : null;
            if (status === 401 || status === 403) {
              reported = true;
              setFailure("load_failed");
            }
          });
          map.once("load", () => {
            if (!cancelled) map.resize();
          });
          const observer = new ResizeObserver(() => map.resize());
          observer.observe(container);
          return {
            setPosition(next) {
              marker.setLngLat([next[0], next[1]]);
              const nextBearing = bearingRef.current;
              if (nextBearing !== null) marker.setRotation(nextBearing);
            },
            recenter(next) {
              map.easeTo({ center: [next[0], next[1]] });
            },
            remove() {
              observer.disconnect();
              marker.remove();
              map.remove();
            },
          };
        });
        sessionRef.current = session;
        session.sync(positionRef.current);
      })
      .catch(() => {
        if (!cancelled) setFailure("load_failed");
      });

    return () => {
      cancelled = true;
      session?.destroy();
      sessionRef.current = null;
    };
  }, [token, failure]);

  useEffect(() => {
    positionRef.current = position;
    bearingRef.current = bearingDeg;
    sessionRef.current?.sync(position);
  }, [position, bearingDeg]);

  if (failure === "webgl") {
    return <p className="text-sm leading-relaxed text-ink">Trình duyệt không chạy được bản đồ WebGL. Tọa độ và thời điểm phía trên vẫn là vị trí đã ghi.</p>;
  }
  if (failure === "load_failed") {
    return (
      <p role="alert" className="text-sm leading-relaxed text-ink">
        Không tải được bản đồ Mapbox. Tọa độ và thời điểm phía trên vẫn là vị trí đã ghi.
      </p>
    );
  }

  return (
    <div className="relative max-w-full">
      <div ref={containerRef} className={mapClass} role="region" aria-label="Bản đồ vị trí xe" />
      <Button
        type="button"
        variant="outline"
        className="absolute bottom-3 left-3 z-10 bg-white"
        onClick={() => sessionRef.current?.recenter(positionRef.current)}
      >
        Về vị trí xe
      </Button>
    </div>
  );
}

function truckMarker(): HTMLElement {
  const element = document.createElement("div");
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", "Vị trí xe");
  element.style.cssText = "width:36px;height:36px;border-radius:9999px;background:#1e3a8a;color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
  body.setAttribute("d", "M3 7h11v8H3zM14 10h4l3 3v2h-7z");
  const leftWheel = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  leftWheel.setAttribute("cx", "7");
  leftWheel.setAttribute("cy", "17");
  leftWheel.setAttribute("r", "1.5");
  const rightWheel = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  rightWheel.setAttribute("cx", "18");
  rightWheel.setAttribute("cy", "17");
  rightWheel.setAttribute("r", "1.5");
  svg.append(body, leftWheel, rightWheel);
  element.append(svg);
  return element;
}
