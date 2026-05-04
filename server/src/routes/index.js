import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

export default router;
