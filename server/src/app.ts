import express from "express";

import { errorHandler, HttpError } from "./middleware/errorHandler.js";
import { configureSecurityMiddleware, apiRateLimiter } from "./middleware/securityMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import rankingRoutes from "./routes/rankingRoutes.js";
import spotRoutes from "./routes/spotRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

configureSecurityMiddleware(app);

app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRateLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rankings", rankingRoutes);
app.use("/api/spots", spotRoutes);
app.use("/api/users", userRoutes);

app.use((req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

export default app;
