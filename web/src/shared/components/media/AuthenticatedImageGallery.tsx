import { useEffect, useState } from "react";
import { ImageViewer } from "@/shared/components/media/ImageViewer";

export function AuthenticatedImageGallery({
  images,
  fetchUrl,
  label,
  altPrefix,
  compact = false,
  emptyText,
}: {
  images?: { id: string }[];
  fetchUrl: (id: string) => Promise<string>;
  label: string;
  altPrefix: string;
  compact?: boolean;
  emptyText?: string;
}) {
  const ids = (images ?? []).map((image) => image.id).join(",");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = ids.length === 0 ? [] : ids.split(",");
    let cancelled = false;
    const created: string[] = [];
    for (const id of list) {
      void fetchUrl(id)
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
  }, [fetchUrl, ids]);

  if (!images || images.length === 0) {
    return emptyText ? <p className="text-sm leading-relaxed text-muted">{emptyText}</p> : null;
  }

  const viewerImages = images.flatMap((image, index) => {
    const src = urls[image.id];
    return src ? [{ src, alt: `${altPrefix} ${index + 1}` }] : [];
  });

  return (
    <>
      <ul className={compact ? "block" : "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"} aria-label={label}>
        {images.map((image, index) => {
          const src = urls[image.id];
          const alt = `${altPrefix} ${index + 1}`;
          if (compact) {
            if (index > 0) return null;
            return (
              <li key={image.id}>
                {src ? (
                  <button
                    type="button"
                    className="block w-full overflow-hidden rounded-xl border border-line bg-canvas text-left hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                    onClick={() => setOpenIndex(0)}
                  >
                    <img src={src} alt={alt} className="aspect-[16/10] w-full object-cover" />
                    {images.length > 1 ? <span className="block px-3 py-2 text-sm font-semibold text-navy">Xem {images.length} ảnh</span> : <span className="sr-only">Xem lớn</span>}
                  </button>
                ) : (
                  <div className="aspect-[16/10] w-full rounded-xl border border-line bg-canvas" />
                )}
              </li>
            );
          }
          return (
            <li key={image.id}>
              {src ? (
                <button
                  type="button"
                  className="block w-full rounded-xl border border-line bg-canvas p-2 text-left hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                  onClick={() => setOpenIndex(index)}
                >
                  <img src={src} alt={alt} className="h-40 w-full object-contain sm:h-52" />
                  <span className="mt-2 block text-sm font-semibold text-navy">Xem lớn</span>
                </button>
              ) : (
                <div className="h-40 rounded-xl border border-line bg-canvas sm:h-52" />
              )}
            </li>
          );
        })}
      </ul>
      {openIndex !== null && viewerImages.length > 0 ? (
        <ImageViewer title={label} images={viewerImages} index={Math.min(openIndex, viewerImages.length - 1)} onClose={() => setOpenIndex(null)} />
      ) : null}
    </>
  );
}
