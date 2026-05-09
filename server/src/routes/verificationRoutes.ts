import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { markFoundController, finderHandedController, adminResolveController } from "../controllers/verificationController";
import { upload } from "../config/multer";

const router = Router();

router.post("/posts/:id/mark-found", requireAuth, upload.single("image"), markFoundController);
router.post("/conversations/:conversationId/handed", requireAuth, upload.single("image"), finderHandedController);
router.post("/requests/:requestId/resolve", requireAuth, requireAdmin, adminResolveController);

export default router;
