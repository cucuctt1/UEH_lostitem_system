import { Router } from "express";
import {
  meController,
  myHistoryController,
  updateMeController
} from "../controllers/userController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { updateProfileSchema } from "../validators/userValidators";

const router = Router();

router.get("/me", requireAuth, meController);
router.put("/me", requireAuth, validateBody(updateProfileSchema), updateMeController);
router.get("/me/history", requireAuth, myHistoryController);

export default router;
