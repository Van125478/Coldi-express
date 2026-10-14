/**
 * Original reach-stacker storyboard. Not a United Carriers model.
 *
 * World axes: X is travel and boom reach, Y is up, Z is toward the camera.
 * Container length, spreader beam, and trailer bed all run along X.
 * The mount sits `tipLocal` meters along the slide. Slide travel is
 * `extension - tipLocal`, so the mount lands on the solved boom tip.
 */

export const box = {
  length: 12.19,
  width: 2.44,
  height: 2.59,
} as const;

/** Boom pin, in machine-local meters. */
export const pivot = { x: 2.15, y: 4.55, z: 0 } as const;

/** Distance from the boom pin to the spreader mount when the slide is fully home. */
export const tipLocal = 6.7;

/** Twistlocks hang this far below the mount. The container roof meets them while carried. */
export const lockDrop = 0.62;

export const groundX = 0;
export const trailerX = 15.4;
export const deckTop = 1.5;

const boomMin = 7.4;
const boomMax = 14.5;

export type Vec3 = [number, number, number];

export type RigPose = {
  machineX: number;
  pitch: number;
  extension: number;
  carry: boolean;
  container: Vec3;
  camera: Vec3;
  look: Vec3;
};

type Key = { t: number; mountX: number; mountY: number; machineX: number; cx: number; cy: number; cz: number; lx: number; ly: number };

const keys: readonly Key[] = [
  { t: 0, mountX: 0.4, mountY: 8.6, machineX: -12.4, cx: -4.2, cy: 5.6, cz: 34, lx: -4.2, ly: 2.8 },
  { t: 0.2, mountX: groundX, mountY: 5.6, machineX: -11.2, cx: -3.4, cy: 5.2, cz: 32, lx: -3.2, ly: 2.8 },
  { t: 0.4, mountX: groundX, mountY: box.height + lockDrop, machineX: -10.2, cx: -2.6, cy: 4.8, cz: 30, lx: -2.4, ly: 2.6 },
  { t: 0.58, mountX: 0.3, mountY: 8.8, machineX: -10.0, cx: -2.2, cy: 6.2, cz: 30, lx: -1.6, ly: 4.2 },
  { t: 0.78, mountX: trailerX, mountY: 8.2, machineX: trailerX - 10.2, cx: 10, cy: 6.4, cz: 36, lx: 12, ly: 3.4 },
  { t: 0.9, mountX: trailerX, mountY: deckTop + box.height + lockDrop, machineX: trailerX - 10.2, cx: 12, cy: 5.4, cz: 32, lx: 15, ly: 3 },
  { t: 1, mountX: trailerX, mountY: deckTop + box.height + lockDrop + 2.5, machineX: trailerX - 10.2, cx: 13, cy: 5.2, cz: 30, lx: 16.2, ly: 2.8 },
];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sample(progress: number) {
  const p = clamp01(progress);
  let index = 0;
  while (index < keys.length - 2 && keys[index + 1].t < p) index += 1;
  const from = keys[index] ?? keys[0];
  const to = keys[Math.min(index + 1, keys.length - 1)] ?? from;
  const span = Math.max(0.0001, to.t - from.t);
  const t = clamp01((p - from.t) / span);
  return {
    mountX: lerp(from.mountX, to.mountX, t),
    mountY: lerp(from.mountY, to.mountY, t),
    machineX: lerp(from.machineX, to.machineX, t),
    cx: lerp(from.cx, to.cx, t),
    cy: lerp(from.cy, to.cy, t),
    cz: lerp(from.cz, to.cz, t),
    lx: lerp(from.lx, to.lx, t),
    ly: lerp(from.ly, to.ly, t),
  };
}

export function poseAt(progress: number): RigPose {
  const p = clamp01(progress);
  const frame = sample(p);
  const pivotX = frame.machineX + pivot.x;
  const dx = frame.mountX - pivotX;
  const dy = frame.mountY - pivot.y;
  const extension = Math.min(boomMax, Math.max(boomMin, Math.hypot(dx, dy)));
  const carry = p >= 0.4 && p <= 0.9;
  const containerX = carry ? frame.mountX : p > 0.9 ? trailerX : groundX;
  const containerY = carry ? frame.mountY - lockDrop - box.height / 2 : p > 0.9 ? deckTop + box.height / 2 : box.height / 2;

  return {
    machineX: frame.machineX,
    pitch: Math.atan2(dy, dx),
    extension,
    carry,
    container: [containerX, containerY, 0],
    camera: [frame.cx, frame.cy, frame.cz],
    look: [frame.lx, frame.ly, 0],
  };
}
