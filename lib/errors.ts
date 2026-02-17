export type AppErrorCode =
  | "invalid_input"
  | "forbidden"
  | "tenant_missing"
  | "not_found"
  | "rate_limited"
  | "conflict"
  | "db_error"
  | "unknown";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(params: { code: AppErrorCode; message: string; status?: number; details?: unknown }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.status = params.status ?? mapCodeToStatus(params.code);
    this.details = params.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function mapCodeToStatus(code: AppErrorCode) {
  switch (code) {
    case "invalid_input":
      return 400;
    case "forbidden":
      return 403;
    case "tenant_missing":
      return 404;
    case "not_found":
      return 404;
    case "rate_limited":
      return 429;
    case "conflict":
      return 409;
    case "db_error":
      return 500;
    default:
      return 500;
  }
}

export function toPublicError(
  error: unknown,
  fallbackMessage = "Request failed.",
): {
  code: AppErrorCode;
  message: string;
  status: number;
  details?: unknown;
} {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details: process.env.NODE_ENV !== "production" ? error.details : undefined,
    };
  }

  if (error instanceof Error) {
    const message = error.message || fallbackMessage;
    const lower = message.toLowerCase();

    if (lower.includes("permission") || lower.includes("forbidden")) {
      return { code: "forbidden", message, status: 403 };
    }
    if (lower.includes("tenant") || lower.includes("community")) {
      return { code: "tenant_missing", message, status: 404 };
    }
    if (lower.includes("not found")) {
      return { code: "not_found", message, status: 404 };
    }
    if (lower.includes("invalid") || lower.includes("required") || lower.includes("must")) {
      return { code: "invalid_input", message, status: 400 };
    }
    if (lower.includes("limit") || lower.includes("too many")) {
      return { code: "rate_limited", message, status: 429 };
    }

    return {
      code: "unknown",
      message: process.env.NODE_ENV === "production" ? fallbackMessage : message,
      status: 500,
      details: process.env.NODE_ENV !== "production" ? { stack: error.stack } : undefined,
    };
  }

  return { code: "unknown", message: fallbackMessage, status: 500 };
}

export function actionErrorResult(error: unknown, fallbackMessage = "Request failed.") {
  const normalized = toPublicError(error, fallbackMessage);
  return {
    ok: false as const,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details !== undefined ? { details: normalized.details } : {}),
    },
  };
}
