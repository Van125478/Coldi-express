import { fetchCargoObjectUrl } from "@/services/cargoImageClient";
import { AuthenticatedImageGallery } from "@/shared/components/media/AuthenticatedImageGallery";

export function CargoImageGallery({ images, compact = false }: { images?: { id: string }[]; compact?: boolean }) {
  return (
    <AuthenticatedImageGallery
      images={images}
      fetchUrl={fetchCargoObjectUrl}
      label="Ảnh hàng hóa"
      altPrefix="Ảnh hàng hóa"
      compact={compact}
    />
  );
}
