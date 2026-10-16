import { useAuth } from "@/features/auth/useAuth";
import { EmptyPanel, PageHeader } from "@/features/workspace/ui";
import { usePageTitle } from "@/hooks/usePageTitle";

export function DriverHome() {
  usePageTitle("Tài xế");
  const { snapshot } = useAuth();
  const email = snapshot.status === "authenticated" ? snapshot.user.email : "";

  return (
    <section className="space-y-6">
      <PageHeader title="Chuyến được phân công" summary={`${email} đăng nhập với vai trò Tài xế. Tài xế không mở sàn và không nhận chuyến.`} />
      <EmptyPanel
        title="Chưa có danh sách chuyến"
        body="Nhà xe nhận chuyến trước, rồi chọn xe và tài xế. Xác nhận lấy hàng, xác nhận giao hàng và vị trí chuyến chưa mở, nên trang này chưa hiện tuyến hay số chuyến."
      />
    </section>
  );
}
