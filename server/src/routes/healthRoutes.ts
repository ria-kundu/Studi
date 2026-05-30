import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString()
  });
});

export default router;
