export type Vec3 = [number, number, number];

export type Shot = {
  t: number;
  p: Vec3;
  l: Vec3;
};

export const shots: readonly Shot[] = [
  { t: 0, p: [0.4, 1.85, 8.4], l: [2.1, 1.05, 0] },
  { t: 0.18, p: [-1.6, 2.15, -2.2], l: [-6.2, 1.35, -10] },
  { t: 0.36, p: [-3.4, 1.45, -6.4], l: [-6.2, 1.15, -10] },
  { t: 0.56, p: [3.2, 1.25, -14.6], l: [7.2, 0.95, -18] },
  { t: 0.74, p: [7.4, 4.6, -11.2], l: [9.5, 0.3, -18] },
  { t: 0.9, p: [14.2, 1.7, -14.2], l: [18.2, 1.15, -18] },
  { t: 1, p: [15.6, 2.05, -12.8], l: [18.4, 1.05, -18] },
];

export function smoothstep(start: number, end: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function sampleShot(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  let index = 0;
  while (index < shots.length - 2 && shots[index + 1].t < p) index += 1;
  const from = shots[index] ?? shots[0];
  const to = shots[Math.min(index + 1, shots.length - 1)] ?? from;
  const span = Math.max(0.0001, to.t - from.t);
  const t = (p - from.t) / span;
  return { position: lerp3(from.p, to.p, t), look: lerp3(from.l, to.l, t) };
}
