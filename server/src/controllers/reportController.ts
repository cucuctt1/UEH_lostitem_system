import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { createReport, listReports } from "../models/reportModel";
import { Report } from "../domain/entities";

export const createReportController = asyncHandler(async (request: Request, response: Response) => {
  const reportId = await createReport({
    reporterId: request.user!.id,
    targetPostId: request.body.targetPostId,
    targetUserId: request.body.targetUserId,
    reason: request.body.reason,
    details: request.body.details
  });

  sendSuccess(response, "Report submitted", { reportId }, 201);
});

export const listReportsController = asyncHandler(async (request: Request, response: Response) => {
  const rows = await listReports(
    request.query.status as "open" | "resolved" | undefined,
    request.user?.role === "admin" ? undefined : request.user!.id
  );
  const reports = rows.map((row) => Report.fromDb(row).toApiView());
  sendSuccess(response, "Fetched reports", reports);
});
