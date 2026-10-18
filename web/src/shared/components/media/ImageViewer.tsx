import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";

export type ViewerImage = { src: string; alt: string };

export function ImageViewer({
  title,
  images,
  index,
  onClose,
}: {
  title: string;
  images: ViewerImage[];
  index: number;
  onClose: () => void;
}) {
  const labelId = useId();
  const [current, setCurrent] = useState(index);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setCurrent((value) => (value - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setCurrent((value) => (value + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, onClose]);

  const image = images[current];
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" role="presentation">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Đóng ảnh" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col gap-3 rounded-2xl bg-surface p-4 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <p id={labelId} className="text-sm font-semibold text-ink">
            {title} · {current + 1}/{images.length}
          </p>
          <Button type="button" variant="outline" autoFocus onClick={onClose}>
            Đóng
          </Button>
        </div>
        <img src={image.src} alt={image.alt} className="max-h-[72vh] w-full object-contain" />
        {images.length > 1 ? (
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setCurrent((value) => (value - 1 + images.length) % images.length)}>
              Ảnh trước
            </Button>
            <Button type="button" variant="outline" onClick={() => setCurrent((value) => (value + 1) % images.length)}>
              Ảnh sau
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
