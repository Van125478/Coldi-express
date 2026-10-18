export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export async function withRequiredCargoImage(baseUrl: string, cookie: string | null | undefined, body: unknown): Promise<unknown> {
  if (!cookie || typeof body !== "object" || body === null || Array.isArray(body)) return body;
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.cargoImageIds) && record.cargoImageIds.length > 0) return body;
  const response = await fetch(`${baseUrl}/api/cargo-images`, {
    method: "POST",
    headers: { origin: "http://127.0.0.1:5173", cookie, "content-type": "image/png" },
    body: TINY_PNG,
  });
  if (response.status === 401 || response.status === 403) return body;
  if (!response.ok) {
    throw new Error(`Cargo image upload failed with ${response.status}: ${await response.text()}`);
  }
  const uploaded = (await response.json()) as { image?: { id?: string } };
  if (!uploaded.image?.id) throw new Error("Cargo image upload did not return an id.");
  return { ...record, cargoImageIds: [uploaded.image.id] };
}
