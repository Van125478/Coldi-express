import { FuelMarketPanel } from "@/features/market/FuelMarketPanel";
import { PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";

export function FuelMarketPage() {
  usePageTitle("Thị trường nhiên liệu");
  return (
    <section className="space-y-6">
      <PageHeader title="Thị trường nhiên liệu" summary="Diesel Việt Nam trước, Brent và WTI sau. Trang này chỉ đọc, không đổi giá cước." />
      <FuelMarketPanel variant="page" />
    </section>
  );
}
