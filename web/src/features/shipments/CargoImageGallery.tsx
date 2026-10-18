import { useEffect, useState } from "react";
import { fetchCargoObjectUrl } from "@/services/cargoImageClient";

export function CargoImageGallery({ images, compact = false }: { images?: { id: string }[]; compact?: boolean }) {
  const ids = (images ?? []).map((image) => image.id).join(",");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const list = ids.length === 0 ? [] : ids.split(",");
    let cancelled = false;
    const created: string[] = [];
    for (const id of list) {
      void fetchCargoObjectUrl(id)
        .then((url) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
            return;
          }
          created.push(url);
          setUrls((current) => ({ ...current, [id]: url }));
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [ids]);

  if (!images || images.length === 0) return null;
  return (
    <ul className={compact ? "flex gap-2" : "grid grid-cols-2 gap-3 sm:grid-cols-5"} aria-label="Ảnh hàng hóa">
      {images.map((image, index) => (
        <li key={image.id}>
          {urls[image.id] ? (
            <img src={urls[image.id]} alt={`Ảnh hàng hóa ${index + 1}`} className={compact ? "aspect-[4/3] h-20 w-28 rounded-lg border border-line object-cover" : "h-28 w-full rounded-xl border border-line object-cover"} />
          ) : (
            <div className={compact ? "aspect-[4/3] h-20 w-28 rounded-lg border border-line bg-canvas" : "h-28 rounded-xl border border-line bg-canvas"} />
          )}
        </li>
      ))}
    </ul>
  );
}
