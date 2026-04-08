import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { getAnalyticsSummary } from "../services/analyticsService";

export const analyticsSummaryController = asyncHandler(async (_request: Request, response: Response) => {
  const summary = await getAnalyticsSummary();
  sendSuccess(response, "Fetched analytics summary", summary);
});
