import { Request, Response } from "express";
import { addBookmark, listBookmarksByUser, removeBookmark } from "../models/bookmarkModel";
import { asyncHandler, sendSuccess, AppError } from "../utils/http";

function parsePostId(raw: string): number {
  const postId = Number(raw);
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new AppError(400, "Invalid post id");
  }
  return postId;
}

export const listBookmarksController = asyncHandler(async (request: Request, response: Response) => {
  const rows = await listBookmarksByUser(request.user!.id);
  const bookmarks = rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    createdAt: row.created_at
  }));

  sendSuccess(response, "Fetched bookmarks", bookmarks);
});

export const addBookmarkController = asyncHandler(async (request: Request, response: Response) => {
  const postId = parsePostId(request.params.postId);
  await addBookmark(request.user!.id, postId);
  sendSuccess(response, "Post bookmarked", { postId }, 201);
});

export const removeBookmarkController = asyncHandler(async (request: Request, response: Response) => {
  const postId = parsePostId(request.params.postId);
  await removeBookmark(request.user!.id, postId);
  sendSuccess(response, "Bookmark removed", { postId });
});
