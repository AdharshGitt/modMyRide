import { Router } from "express";
import { generateAIRecommendation } from "../controllers/aiController.js";

const router = Router();

router.post("/recommend", generateAIRecommendation);

export default router;
