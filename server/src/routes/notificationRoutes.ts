import { Router } from "express";
import {
  listNotificationsController,
  readNotificationController
} from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, listNotificationsController);
router.patch("/:id/read", requireAuth, readNotificationController);

export default router;
