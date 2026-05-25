import { Router } from "express";
import { saveProfile, getProfiles, getProfileById, deleteProfile, toggleLike } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", saveProfile);
router.get("/", getProfiles);
router.get("/:id", getProfileById);
router.delete("/:id", deleteProfile);
router.post("/:id/like", toggleLike);

export default router;
