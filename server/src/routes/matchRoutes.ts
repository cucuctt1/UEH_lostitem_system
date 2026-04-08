import { Router } from "express";
import { listMatchesController } from "../controllers/matchController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, listMatchesController);

export default router;
