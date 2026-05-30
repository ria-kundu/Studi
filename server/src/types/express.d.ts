export {};

declare global {
  namespace Express {
    interface AuthenticatedUser {
      uid: string;
      email?: string;
      name?: string;
      picture?: string | null;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
