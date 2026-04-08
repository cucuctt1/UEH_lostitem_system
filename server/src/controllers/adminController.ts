import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import {
  approvePost,
  createStoredItemAsAdmin,
  deletePostAsAdmin,
  getReports,
  getStoredItems,
  getUsers,
  lockUser,
  resolveReportAsAdmin,
  updateStoredItemStatusAsAdmin
} from "../services/adminService";

export const approvePostController = asyncHandler(async (request: Request, response: Response) => {
  await approvePost(request.body.postId, request.user!.id, request.body.approved);
  sendSuccess(response, request.body.approved ? "Post approved" : "Post rejected");
});

export const lockUserController = asyncHandler(async (request: Request, response: Response) => {
  await lockUser(request.body.userId, request.body.locked);
  sendSuccess(response, request.body.locked ? "User locked" : "User unlocked");
});

export const listUsersController = asyncHandler(async (_request: Request, response: Response) => {
  const users = await getUsers();
  sendSuccess(response, "Fetched users", users);
});

export const adminDeletePostController = asyncHandler(async (request: Request, response: Response) => {
  await deletePostAsAdmin(Number(request.params.id));
  sendSuccess(response, "Post deleted by admin");
});

export const adminListReportsController = asyncHandler(async (request: Request, response: Response) => {
  const reports = await getReports(request.query.status as "open" | "resolved" | undefined);
  sendSuccess(response, "Fetched reports", reports);
});

export const adminResolveReportController = asyncHandler(async (request: Request, response: Response) => {
  await resolveReportAsAdmin(Number(request.params.id), request.user!.id);
  sendSuccess(response, "Report resolved");
});

export const adminListItemsController = asyncHandler(async (_request: Request, response: Response) => {
  const items = await getStoredItems();
  sendSuccess(response, "Fetched stored items", items);
});

export const adminCreateItemController = asyncHandler(async (request: Request, response: Response) => {
  const itemId = await createStoredItemAsAdmin({
    name: request.body.name,
    description: request.body.description,
    categoryId: request.body.categoryId,
    locationId: request.body.locationId,
    quantity: request.body.quantity,
    status: request.body.status,
    postId: request.body.postId,
    managedBy: request.user!.id
  });

  sendSuccess(response, "Stored item created", { itemId }, 201);
});

export const adminUpdateItemStatusController = asyncHandler(async (request: Request, response: Response) => {
  await updateStoredItemStatusAsAdmin(Number(request.params.id), request.body.status);
  sendSuccess(response, "Stored item status updated");
});
