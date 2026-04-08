import { Router } from "express";
import { createReportController, listReportsController } from "../controllers/reportController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createReportSchema } from "../validators/reportValidators";

const router = Router();

router.post("/", requireAuth, validateBody(createReportSchema), createReportController);
router.get("/", requireAuth, listReportsController);

export default router;
