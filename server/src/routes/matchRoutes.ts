import { Router } from "express";
import { listMatchesController, verifyMatchController } from "../controllers/matchController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { verifyMatchSchema } from "../validators/matchValidators";

const router = Router();

router.get("/", requireAuth, listMatchesController);
router.post("/:matchId/verify", requireAuth, validateBody(verifyMatchSchema), verifyMatchController);

export default router;
