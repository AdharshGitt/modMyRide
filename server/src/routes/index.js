import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import publicRoutes from "./publicRoutes.js";
import profileRoutes from "./profileRoutes.js";

const router = Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/public", publicRoutes);
router.use("/profiles", profileRoutes);

export default router;
