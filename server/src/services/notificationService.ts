import type { Response } from "express";

type NotificationPayload = {
  title: string;
  message: string;
  spotId?: string;
  spotName?: string;
  rankingId?: string;
};

const clients = new Map<string, Set<Response>>();

function writeEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addNotificationClient(uid: string, res: Response): void {
  const userClients = clients.get(uid) ?? new Set<Response>();
  userClients.add(res);
  clients.set(uid, userClients);

  writeEvent(res, "connected", {
    message: "Notification stream connected."
  });

  res.on("close", () => {
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(uid);
    }
  });
}

export function notifyUser(uid: string, payload: NotificationPayload): void {
  const userClients = clients.get(uid);
  if (!userClients) {
    return;
  }

  for (const client of userClients) {
    writeEvent(client, "notification", payload);
  }
}

export function notifyUsers(uids: string[], payload: NotificationPayload): void {
  for (const uid of new Set(uids)) {
    notifyUser(uid, payload);
  }
}
