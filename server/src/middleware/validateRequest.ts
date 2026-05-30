import type { RequestHandler } from "express";
import type { ZodType } from "zod";

import { HttpError } from "./errorHandler.js";

export function validateRequest(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => {
        const path = issue.path.join(".") || "body";
        return `${path}: ${issue.message}`;
      });

      next(new HttpError(400, `Invalid request body. ${details.join("; ")}`));
      return;
    }

    req.body = result.data;
    next();
  };
}
