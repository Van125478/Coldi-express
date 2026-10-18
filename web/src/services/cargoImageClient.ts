import { ApiError } from "@/services/apiClient";

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "http://127.0.0.1:4000";

type UploadedImage = { id: string; contentType: string; sizeBytes: number };

export async function uploadCargoImage(file: File): Promise<UploadedImage> {
  const response = await fetch(`${apiOrigin}/api/cargo-images`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": file.type },
    body: file,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw errorFrom(response.status, body, "Không tải được ảnh hàng hóa.");
  const image = (body as { image?: UploadedImage }).image;
  if (!image?.id) throw new ApiError(response.status, "invalid_response", "Máy chủ không trả về ảnh hàng hóa.");
  return image;
}

export async function deleteCargoImage(id: string): Promise<void> {
  const response = await fetch(`${apiOrigin}/api/cargo-images/${id}`, { method: "DELETE", credentials: "include" });
  if (response.status === 204) return;
  const body: unknown = await response.json().catch(() => null);
  throw errorFrom(response.status, body, "Không xóa được ảnh hàng hóa.");
}

export async function fetchCargoObjectUrl(id: string): Promise<string> {
  const response = await fetch(`${apiOrigin}/api/cargo-images/${id}`, { credentials: "include" });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw errorFrom(response.status, body, "Không xem được ảnh hàng hóa.");
  }
  return URL.createObjectURL(await response.blob());
}

function errorFrom(status: number, body: unknown, fallback: string): ApiError {
  const error = (body as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null)?.error;
  return new ApiError(status, error?.code ?? "request_failed", error?.message ?? fallback, error?.fields);
}
