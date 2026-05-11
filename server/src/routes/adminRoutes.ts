import { Router } from "express";
import {
  adminCreateItemController,
  adminCreateTagController,
  adminCreateUserController,
  adminDeleteItemController,
  adminDeleteTagController,
  adminDeletePostController,
  adminListItemsController,
  adminListReportsController,
  adminListTagsController,
  adminResolveReportController,
  adminUpdateTagController,
  adminUpdateItemController,
  adminUpdateItemStatusController,
  approvePostController,
  listUsersController,
  lockUserController
} from "../controllers/adminController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { validateBody } from "../middleware/validate";
import {
  approvePostSchema,
  createTagByAdminSchema,
  createUserByAdminSchema,
  lockUserSchema,
  updateTagByAdminSchema
} from "../validators/adminValidators";
import {
  createStoredItemSchema,
  updateStoredItemSchema,
  updateStoredItemStatusSchema
} from "../validators/itemValidators";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.post("/approve-post", validateBody(approvePostSchema), approvePostController);
router.post("/lock-user", validateBody(lockUserSchema), lockUserController);
router.post("/users", validateBody(createUserByAdminSchema), adminCreateUserController);
router.get("/users", listUsersController);
router.delete("/posts/:id", adminDeletePostController);
router.get("/reports", adminListReportsController);
router.patch("/reports/:id/resolve", adminResolveReportController);
router.get("/items", adminListItemsController);
router.post("/items", validateBody(createStoredItemSchema), adminCreateItemController);
router.put("/items/:id", validateBody(updateStoredItemSchema), adminUpdateItemController);
router.patch("/items/:id/status", validateBody(updateStoredItemStatusSchema), adminUpdateItemStatusController);
router.delete("/items/:id", adminDeleteItemController);
router.get("/tags", adminListTagsController);
router.post("/tags", validateBody(createTagByAdminSchema), adminCreateTagController);
router.put("/tags/:id", validateBody(updateTagByAdminSchema), adminUpdateTagController);
router.delete("/tags/:id", adminDeleteTagController);

export default router;
