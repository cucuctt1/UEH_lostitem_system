import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  addBookmarkController,
  listBookmarksController,
  removeBookmarkController
} from "../controllers/bookmarkController";

const router = Router();

router.get("/", requireAuth, listBookmarksController);
router.post("/:postId", requireAuth, addBookmarkController);
router.delete("/:postId", requireAuth, removeBookmarkController);

export default router;
