import { Router } from "express";
import { saveProfile, getProfiles, getProfileById, deleteProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", saveProfile);
router.get("/", getProfiles);
router.get("/:id", getProfileById);
router.delete("/:id", deleteProfile);

export default router;
