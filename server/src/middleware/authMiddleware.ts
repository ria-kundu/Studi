import type { NextFunction, Request, Response } from "express";

import { auth } from "../config/firebaseAdmin.js";
import { HttpError } from "./errorHandler.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader) {
      throw new HttpError(401, "Missing Authorization header.");
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new HttpError(401, "Authorization header must use Bearer token format.");
    }

    const decodedToken = await auth.verifyIdToken(token);

    // Never trust identity values from req.body, req.params, or req.query.
    // The authenticated UID always comes from the verified Firebase ID token.
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: typeof decodedToken.name === "string" ? decodedToken.name : undefined,
      picture: typeof decodedToken.picture === "string" ? decodedToken.picture : null
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    next(new HttpError(401, "Invalid or expired Firebase ID token."));
  }
}
