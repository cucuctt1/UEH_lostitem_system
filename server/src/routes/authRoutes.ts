import { Router } from "express";
import { loginController, registerController } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/authValidators";

const router = Router();

router.post("/login", validateBody(loginSchema), loginController);
router.post("/register", validateBody(registerSchema), registerController);

export default router;
