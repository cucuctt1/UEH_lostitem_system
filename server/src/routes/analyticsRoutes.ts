import { Router } from "express";
import { analyticsSummaryController } from "../controllers/analyticsController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), analyticsSummaryController);

export default router;
