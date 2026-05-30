import type { Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function configureSecurityMiddleware(app: Express): void {
  // Helmet sets security-related HTTP headers that help mitigate common browser attacks.
  app.use(helmet());

  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

  app.use(
    cors({
      origin: frontendOrigin,
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
      // This API uses Authorization bearer tokens, not cookies, so credentials are not enabled.
      // Restricting CORS to FRONTEND_ORIGIN avoids wildcard cross-origin access.
    })
  );

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  }
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envNumber("RATE_LIMIT_MAX", 100),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests, please try again later.",
      status: 429
    }
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envNumber("AUTH_RATE_LIMIT_MAX", 30),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many authentication requests, please try again later.",
      status: 429
    }
  }
});
