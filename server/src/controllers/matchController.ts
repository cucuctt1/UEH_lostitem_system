import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { listMatchesForUser } from "../models/matchModel";
import { Match } from "../domain/entities";
import { verifyMatchWorkflow } from "../services/matchService";

export const listMatchesController = asyncHandler(async (request: Request, response: Response) => {
  const rows = await listMatchesForUser(request.user!.id);
  const result = rows.map((row) => Match.fromDb(row).toApiView());

  sendSuccess(response, "Fetched matches", result);
});

export const verifyMatchController = asyncHandler(async (request: Request, response: Response) => {
  const matchId = Number(request.params.matchId);
  await verifyMatchWorkflow(matchId, request.user!.id, request.body.status);
  sendSuccess(response, "Match verified successfully");
});
