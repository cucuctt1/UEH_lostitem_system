import { Router } from "express";
import { loginController } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../validators/authValidators";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);

export default router;
