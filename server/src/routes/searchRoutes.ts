import { Router } from "express";
import { searchController } from "../controllers/searchController";
import { requireAuth } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { postSearchSchema } from "../validators/postValidators";

const router = Router();

router.get("/", requireAuth, validateQuery(postSearchSchema), searchController);

export default router;
