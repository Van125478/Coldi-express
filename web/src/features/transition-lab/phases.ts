/** Scroll ranges for the later pinned timeline. The board still shows five stills. */
export const TIMELINE_UNITS = 100;

/**
 * Six-phase scroll contract. The camera rise is its own beat and has no still yet.
 * Stills cover interior, doors, rear, travel, and map.
 */
export const scrollTiming = [
  { id: "interior", from: 0, to: 15 },
  { id: "doors", from: 15, to: 30 },
  { id: "rear", from: 30, to: 45 },
  { id: "rise", from: 45, to: 65 },
  { id: "travel", from: 65, to: 85 },
  { id: "map", from: 85, to: 100 },
] as const;

export const storyboard = [
  {
    id: "interior",
    from: 0,
    to: 15,
    title: "Khoang lạnh, nhìn từ cửa sau",
    transition:
      "Hai cánh cửa quay quanh bản lề ở trụ sau, từ mở rộng về phía khép. Khoang và ánh sáng giữ nguyên; cả khung thu nhỏ và hạ xuống một chút để cảm giác camera lùi.",
  },
  {
    id: "doors",
    from: 15,
    to: 30,
    title: "Cửa đóng, camera lùi nhẹ",
    transition:
      "Khi hai cánh gặp nhau, ánh sáng trong khoang bị che. Khung đuôi, đèn và bậc chống va — vốn đã nằm ở rìa hình — phóng lớn thành mặt sau của cùng một xe.",
  },
  {
    id: "rear",
    from: 30,
    to: 45,
    title: "Đuôi xe lạnh",
    transition:
      "45–65% là nhịp nâng camera, tách riêng khỏi lúc xe chạy. Mặt sau ngả thành hình chiếu từ trên: đường chỉ cửa thành cạnh sau thùng, sọc navy chạy từ khung đuôi sang thành xe. Vệt dưới gầm kéo dài thành mặt đường.",
  },
  {
    id: "overhead",
    from: 65,
    to: 85,
    title: "Góc cao, xe trên đường",
    transition:
      "Dải đường mảnh dần thành nét lộ trình. Xe mờ đi khi đường tuyến chiếm khung hình. Hai đầu con đường thành điểm đi và điểm đến.",
  },
  {
    id: "map",
    from: 85,
    to: 100,
    title: "Lộ trình từ điểm đi đến điểm đến",
    transition: "Hết chuỗi. Phần sau khung ghim trả lại trang bình thường.",
  },
] as const;

export type PhaseId = (typeof storyboard)[number]["id"];

export function phaseSpan(id: PhaseId) {
  const phase = storyboard.find((item) => item.id === id);
  if (!phase) {
    throw new Error(`Missing phase ${id}`);
  }
  return { start: phase.from, duration: phase.to - phase.from };
}
