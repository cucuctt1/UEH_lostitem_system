import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { searchPosts } from "../services/searchService";

export const searchController = asyncHandler(async (request: Request, response: Response) => {
  const result = await searchPosts(request.query as any, request.user?.id, request.user?.role);
  sendSuccess(response, "Search results", result);
});
