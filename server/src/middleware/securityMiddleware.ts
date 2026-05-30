import type { Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function configureSecurityMiddleware(app: Express): void {
  // Helmet sets security-related HTTP headers that help mitigate common browser attacks.
  app.use(helmet());

  const developmentFrontendOrigins =
    process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5174"
        ];
  const frontendOrigins = [
    ...envList("FRONTEND_ORIGINS"),
    ...envList("FRONTEND_ORIGIN"),
    ...developmentFrontendOrigins
  ];
  const allowedFrontendOrigins =
    frontendOrigins.length > 0 ? Array.from(new Set(frontendOrigins)) : ["http://localhost:5173"];

  app.use(
    cors({
      origin: allowedFrontendOrigins,
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
      // This API uses Authorization bearer tokens, not cookies, so credentials are not enabled.
      // Restricting CORS to configured frontend origins avoids wildcard cross-origin access.
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
