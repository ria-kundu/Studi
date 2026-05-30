import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  public readonly status: number;

  public readonly expose: boolean;

  public constructor(status: number, message: string, expose = true) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.expose = expose;
  }
}

function hasNumericStatus(error: unknown): error is { status: number } {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number";
}

function hasFirebaseCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";

  let status = hasNumericStatus(error) ? error.status : 500;
  let message = error instanceof Error ? error.message : "Internal server error.";

  if (error instanceof ZodError) {
    status = 400;
    message = "Invalid request body.";
  }

  if (hasFirebaseCode(error) && error.code.startsWith("auth/")) {
    status = 401;
    message = "Firebase authentication failed.";
  }

  if (isProduction && status >= 500) {
    message = "Internal server error.";
  }

  const responseBody: {
    error: {
      message: string;
      status: number;
      stack?: string;
    };
  } = {
    error: {
      message,
      status
    }
  };

  if (!isProduction && error instanceof Error && error.stack) {
    responseBody.error.stack = error.stack;
  }

  res.status(status).json(responseBody);
};
