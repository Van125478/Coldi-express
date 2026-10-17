export function nextComparison(current: readonly string[], id: string): { selected: string[]; note: string | null } {
  if (current.includes(id)) return { selected: current.filter((item) => item !== id), note: null };
  if (current.length >= 2) {
    return { selected: [...current], note: "Chỉ so sánh hai chuyến cùng lúc. Bỏ một chuyến đã chọn trước." };
  }
  return { selected: [...current, id], note: null };
}
