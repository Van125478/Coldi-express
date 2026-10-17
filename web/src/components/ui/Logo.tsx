import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { cn } from "@/lib/cn";
import logo from "../../../../Asset/logo coldi 5.png";

type LogoProps = {
  tone?: "default" | "inverse";
  to?: string;
};

/** Opaque ink inside the square asset. Padding stays transparent; it is not part of the mark. */
const ink = { x: 43, y: 226, width: 925, height: 555 };
const inkHeight = "1.75rem";
const pad = "4px";

export function Logo({ tone = "default", to = paths.home }: LogoProps) {
  const inverse = tone === "inverse";

  return (
    <Link to={to} className="inline-flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
      <span
        className="relative inline-block shrink-0 overflow-hidden"
        style={{
          width: `calc(${inkHeight} * ${ink.width} / ${ink.height} + ${pad} * 2)`,
          height: `calc(${inkHeight} + ${pad} * 2)`,
        }}
      >
        <img
          src={logo}
          alt=""
          width={1000}
          height={1000}
          className="absolute max-w-none"
          style={{
            width: `calc(${inkHeight} * 1000 / ${ink.height})`,
            height: `calc(${inkHeight} * 1000 / ${ink.height})`,
            left: `calc(${pad} - ${inkHeight} * ${ink.x} / ${ink.height})`,
            top: `calc(${pad} - ${inkHeight} * ${ink.y} / ${ink.height})`,
          }}
        />
      </span>
      <span className={cn("text-sm font-extrabold tracking-[0.16em]", inverse ? "text-white" : "text-navy")}>COLDI</span>
    </Link>
  );
}
