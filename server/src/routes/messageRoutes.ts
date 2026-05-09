import { Router } from "express";
import {
  confirmReturnController,
  getMessagesController,
  listConversationsController,
  sendMessageController
} from "../controllers/messageController";
import { createConversationController, requestVerificationController } from "../controllers/messageController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { confirmReturnSchema, sendMessageSchema } from "../validators/messageValidators";
import { upload } from "../config/multer";

const router = Router();

router.get("/conversations", requireAuth, listConversationsController);
router.post("/conversations", requireAuth, createConversationController);
router.get("/:conversationId", requireAuth, getMessagesController);
router.post("/", requireAuth, upload.single("image"), validateBody(sendMessageSchema), sendMessageController);
router.post("/:conversationId/confirm-return", requireAuth, validateBody(confirmReturnSchema), confirmReturnController);
router.post("/:conversationId/request-verification", requireAuth, upload.single("image"), requestVerificationController);

export default router;
