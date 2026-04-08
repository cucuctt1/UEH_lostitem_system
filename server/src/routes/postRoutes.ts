import { Router } from "express";
import {
  createPostCommentController,
  createPostController,
  deletePostController,
  getPostController,
  listPostCommentsController,
  listPostsController,
  recommendedPostsController,
  updatePostController
} from "../controllers/postController";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  createPostCommentSchema,
  createPostSchema,
  postSearchSchema,
  updatePostSchema
} from "../validators/postValidators";
import { upload } from "../config/multer";

const router = Router();

router.get("/", requireAuth, validateQuery(postSearchSchema), listPostsController);
router.get("/recommendations", requireAuth, recommendedPostsController);
router.get("/:id/comments", requireAuth, listPostCommentsController);
router.post("/:id/comments", requireAuth, validateBody(createPostCommentSchema), createPostCommentController);
router.get("/:id", requireAuth, getPostController);
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "images", maxCount: 4 },
    { name: "image", maxCount: 1 }
  ]),
  validateBody(createPostSchema),
  createPostController
);
router.put(
  "/:id",
  requireAuth,
  upload.fields([
    { name: "images", maxCount: 4 },
    { name: "image", maxCount: 1 }
  ]),
  validateBody(updatePostSchema),
  updatePostController
);
router.delete("/:id", requireAuth, deletePostController);

export default router;
