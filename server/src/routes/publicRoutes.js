import { Router } from "express";
import { getVehicles } from "../controllers/vehicleController.js";
import { getUpgrades } from "../controllers/upgradeController.js";
import { getTopRankedBuilds, getCommunityBuilds } from "../controllers/profileController.js";

const router = Router();

router.get("/vehicles", getVehicles);
router.get("/upgrades", getUpgrades);
router.get("/top-builds", getTopRankedBuilds);
router.get("/community-builds", getCommunityBuilds);

export default router;
