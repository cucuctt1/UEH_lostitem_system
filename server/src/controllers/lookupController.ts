import { Request, Response } from "express";
import { asyncHandler, sendSuccess } from "../utils/http";
import { listCategories, listLocations } from "../models/lookupModel";
import { Category, Location } from "../domain/entities";
import { getTagRecommendationList } from "../services/tagService";

export const listCategoriesController = asyncHandler(async (_request: Request, response: Response) => {
  const rows = await listCategories();
  const categories = rows.map((row) => Category.fromDb(row).toApiView());
  sendSuccess(response, "Fetched categories", categories);
});

export const listLocationsController = asyncHandler(async (_request: Request, response: Response) => {
  const rows = await listLocations();
  const locations = rows.map((row) => Location.fromDb(row).toApiView());
  sendSuccess(response, "Fetched locations", locations);
});

export const listTagRecommendationsController = asyncHandler(async (request: Request, response: Response) => {
  const parsedLimit = Number(request.query.limit ?? 20);
  const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
  const tags = await getTagRecommendationList(request.query.keyword as string | undefined, safeLimit);
  sendSuccess(response, "Fetched tag recommendations", tags);
});
