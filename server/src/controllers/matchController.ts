import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { listMatchesForUser } from "../models/matchModel";
import { Match } from "../domain/entities";

export const listMatchesController = asyncHandler(async (request: Request, response: Response) => {
  const rows = await listMatchesForUser(request.user!.id);
  const result = rows.map((row) => Match.fromDb(row).toApiView());

  sendSuccess(response, "Fetched matches", result);
});
