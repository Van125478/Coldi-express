export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Readonly<Record<string, string>>;

  constructor(status: number, code: string, message: string, fields?: Readonly<Record<string, string>>) {
    super(message);
    this.status = status;
    this.code = code;
    if (fields) this.fields = fields;
  }
}

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? "http://127.0.0.1:4000";

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiOrigin}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, "network_error", "Không kết nối được máy chủ. Hãy thử lại.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = typeof body === "object" && body !== null ? (body as ErrorBody).error : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? "request_failed",
      error?.message ?? "Yêu cầu không thành công.",
      error?.fields,
    );
  }
  return body as T;
}
