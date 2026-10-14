import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "chevron"
  | "menu"
  | "close"
  | "user"
  | "shield"
  | "file"
  | "receipt"
  | "star"
  | "lock"
  | "check"
  | "eye"
  | "eye-off"
  | "windows"
  | "apple"
  | "android"
  | "device"
  | "laptop"
  | "spark";

const glyphs: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19.25c1.4-2.7 3.9-4 7-4s5.6 1.3 7 4" />
    </>
  ),
  shield: <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 6.8-7 8.8-4.2-2-7-4.6-7-8.8V6.5L12 3.5Z" />,
  file: (
    <>
      <path d="M7 3.5h7l4 4V20.5H7V3.5Z" />
      <path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5" />
    </>
  ),
  receipt: (
    <>
      <path d="M7 3.5h10v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V3.5Z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </>
  ),
  star: <path d="m12 3.8 2.1 4.4 4.8.7-3.5 3.4.8 4.8L12 15.8 7.8 17.1l.8-4.8L5.1 8.9l4.8-.7L12 3.8Z" />,
  lock: (
    <>
      <rect x="6" y="10.5" width="12" height="9" rx="2" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
    </>
  ),
  check: <path d="m5.5 12.5 4 4 9-9" />,
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M4 5.5 19 18.5" />
      <path d="M9.2 9.4A3.2 3.2 0 0 0 12 15.2c.6 0 1.1-.1 1.6-.4M6.2 7.8C4.2 9 2.8 12 2.8 12S6.2 17.5 12 17.5c1.3 0 2.5-.3 3.5-.8M10.2 6.7C10.8 6.6 11.4 6.5 12 6.5c6 0 9.2 5.5 9.2 5.5s-.7 1.2-2 2.4" />
    </>
  ),
  windows: <path d="M4 6.5 11 5.5v6H4V6.5ZM12.5 5.3 20 4.2v7.3h-7.5V5.3ZM4 13h7v6L4 17.8V13Zm8.5 0H20v8.2l-7.5-1.1V13Z" />,
  apple: (
    <path d="M15.2 8.2c.7-.9 1.2-2.1 1.1-3.3-1.1.1-2.4.7-3.1 1.6-.7.8-1.3 2.1-1.1 3.2 1.2.1 2.4-.6 3.1-1.5ZM16.4 9.4c-1.7-.1-3.1 1-3.9 1-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3 0 1.8-.8 3.4-.8s2 .8 3.4.8 2.2-1.2 3.1-2.5c1-.1 2-1.2 2.7-2.4-7.1-2.7-6-9.8.3-11.5-.8-1.2-2-1.9-3-1.9-.8 0-1.6.3-2 0Z" />
  ),
  android: (
    <>
      <path d="M8 10.5h8v6.2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6.2Z" />
      <path d="M9 10.5V9a3 3 0 0 1 6 0v1.5M7 12.5H5.5v4M18.5 12.5H17v4M9.5 7.2 8 5M14.5 7.2 16 5" />
    </>
  ),
  device: (
    <>
      <rect x="7" y="3.5" width="10" height="17" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="9" rx="1.5" />
      <path d="M3.5 18h17" />
    </>
  ),
  spark: <path d="M12 3.5 13.4 9 19 10.5 13.4 12 12 17.5 10.6 12 5 10.5 10.6 9 12 3.5Z" />,
};

const filledIcons = new Set<IconName>(["star"]);

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className }: IconProps) {
  const filled = filledIcons.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphs[name]}
    </svg>
  );
}
