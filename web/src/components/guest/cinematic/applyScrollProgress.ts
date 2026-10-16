export type ScrollChapter = {
  until: number;
  index: string;
  title: string;
  body: string;
};

export const scrollChapters: readonly ScrollChapter[] = [
  {
    until: 0.24,
    index: "01",
    title: "Chuẩn bị tại kho lạnh",
    body: "Hàng được xếp trong kho lạnh, sẵn sàng đưa ra dock.",
  },
  {
    until: 0.42,
    index: "02",
    title: "Lên xe lạnh",
    body: "Cửa kho mở. Xe lạnh nhận hàng tại điểm bốc.",
  },
  {
    until: 0.74,
    index: "03",
    title: "Trên tuyến đường bộ",
    body: "Xe lạnh rời kho và đi theo tuyến. Đây là minh họa, không phải tín hiệu GPS.",
  },
  {
    until: 1,
    index: "04",
    title: "Đến điểm giao",
    body: "Hàng tới kho nhận. COLDI là nơi chủ hàng và nhà xe gặp nhau trên đơn.",
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function applyScrollProgress(root: HTMLElement, progress: number) {
  const p = clamp(progress);
  const toRoad = smoothstep(0.22, 0.4, p);
  const toDestination = smoothstep(0.68, 0.86, p);
  const camera = toRoad * 0.5 + toDestination * 0.5;
  const doorOpen = smoothstep(0.08, 0.22, p);
  const truckTravel = smoothstep(0.4, 0.72, p);
  const link = smoothstep(0.86, 0.98, p);

  const cameraNode = root.querySelector<HTMLElement>("[data-camera]");
  if (cameraNode) {
    cameraNode.style.transform = `translate3d(${-camera * 66.6667}%, 0, 0)`;
  }

  const door = root.querySelector<SVGElement>("[data-door]");
  if (door) {
    door.style.transform = `scaleY(${1 - doorOpen * 0.84})`;
    door.style.transformOrigin = "center bottom";
  }

  const truck = root.querySelector<HTMLElement>("[data-truck]");
  if (truck) {
    truck.style.left = `${8 + truckTravel * 54}%`;
  }

  const lane = root.querySelector<SVGGeometryElement>("[data-lane]");
  if (lane) {
    lane.style.strokeDashoffset = `${-truckTravel * 280}`;
  }

  const linkLine = root.querySelector<SVGGeometryElement>("[data-link]");
  if (linkLine) {
    linkLine.style.strokeDashoffset = `${(1 - link) * 100}`;
  }

  const bar = root.querySelector<HTMLElement>("[data-progress-bar]");
  if (bar) {
    bar.style.transform = `scaleX(${p})`;
  }

  const chapter = scrollChapters.find((item) => p <= item.until) ?? scrollChapters[scrollChapters.length - 1];
  if (!chapter) return;
  if (root.dataset.chapter === chapter.index) return;
  root.dataset.chapter = chapter.index;

  const indexNode = root.querySelector("[data-chapter-index]");
  const titleNode = root.querySelector("[data-chapter-title]");
  const bodyNode = root.querySelector("[data-chapter-body]");
  if (indexNode) indexNode.textContent = chapter.index;
  if (titleNode) titleNode.textContent = chapter.title;
  if (bodyNode) bodyNode.textContent = chapter.body;
}
