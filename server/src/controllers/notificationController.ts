import type { Request, Response } from "express";

import { auth } from "../config/firebaseAdmin.js";
import { HttpError } from "../middleware/errorHandler.js";
import { addNotificationClient } from "../services/notificationService.js";

export async function streamNotifications(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    throw new HttpError(401, "Missing notification stream token.");
  }

  const decodedToken = await auth.verifyIdToken(token);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  res.flushHeaders?.();

  addNotificationClient(decodedToken.uid, res);
}
