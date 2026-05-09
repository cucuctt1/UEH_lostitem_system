import { Router } from "express";
import {
  changePasswordController,
  meController,
  myHistoryController,
  publicProfileController,
  updateMeController
} from "../controllers/userController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { changePasswordSchema, updateProfileSchema } from "../validators/userValidators";

const router = Router();

router.get("/me", requireAuth, meController);
router.put("/me", requireAuth, validateBody(updateProfileSchema), updateMeController);
router.patch("/me/password", requireAuth, validateBody(changePasswordSchema), changePasswordController);
router.get("/me/history", requireAuth, myHistoryController);
router.get("/:userId", requireAuth, publicProfileController);

export default router;
