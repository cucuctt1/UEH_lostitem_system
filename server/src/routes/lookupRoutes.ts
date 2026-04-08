import { Router } from "express";
import {
	listCategoriesController,
	listLocationsController,
	listTagRecommendationsController
} from "../controllers/lookupController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/categories", requireAuth, listCategoriesController);
router.get("/locations", requireAuth, listLocationsController);
router.get("/tags/recommendations", requireAuth, listTagRecommendationsController);

export default router;
