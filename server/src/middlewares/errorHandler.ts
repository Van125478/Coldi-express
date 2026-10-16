import type { ErrorRequestHandler, RequestHandler } from "express";

export class HttpError extends Error {
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

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: "not_found",
      message: "Route not found.",
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const known = error instanceof HttpError;
  const status = known ? error.status : 500;
  const code = known ? error.code : "internal_error";
  const production = process.env.NODE_ENV === "production";
  const message =
    known || !production
      ? error instanceof Error
        ? error.message
        : "Internal server error."
      : "Internal server error.";

  if (!known) {
    console.error(error);
  }

  const body: { code: string; message: string; fields?: Readonly<Record<string, string>> } = { code, message };
  if (known && error.fields) body.fields = error.fields;

  response.status(status).json({ error: body });
};
