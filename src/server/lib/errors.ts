// errors.ts — domain errors mapped 1:1 to HTTP status codes.

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) { super(400, message, details); }
}
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") { super(401, message); }
}
export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") { super(403, message); }
}
export class NotFoundError extends HttpError {
  constructor(message = "Not found") { super(404, message); }
}
export class ConflictError extends HttpError {
  constructor(message: string) { super(409, message); }
}

/** Wrap an async route handler so domain errors become proper Response objects. */
export function withErrorHandling<Args extends unknown[], R>(
  handler: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R | Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json(
          { error: err.message, details: err.details ?? null },
          { status: err.status },
        );
      }
      console.error("[unhandled]", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
