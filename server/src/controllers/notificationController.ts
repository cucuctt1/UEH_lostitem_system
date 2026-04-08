import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import {
  listNotificationsForUser,
  markNotificationRead
} from "../models/notificationModel";
import { Notification } from "../domain/entities";

export const listNotificationsController = asyncHandler(async (request: Request, response: Response) => {
  const rows = await listNotificationsForUser(request.user!.id);
  const notifications = rows.map((row) => Notification.fromDb(row).toApiView());
  sendSuccess(response, "Fetched notifications", notifications);
});

export const readNotificationController = asyncHandler(async (request: Request, response: Response) => {
  await markNotificationRead(Number(request.params.id), request.user!.id);
  sendSuccess(response, "Notification marked as read");
});
