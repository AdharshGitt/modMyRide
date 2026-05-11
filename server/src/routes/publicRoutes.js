import { Router } from "express";
import { getVehicles } from "../controllers/vehicleController.js";
import { getUpgrades } from "../controllers/upgradeController.js";

const router = Router();

router.get("/vehicles", getVehicles);
router.get("/upgrades", getUpgrades);

export default router;
