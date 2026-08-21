import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { loginLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), login);

router.post("/logout", logout);

router.get("/me", authenticate, me);

export default router;
