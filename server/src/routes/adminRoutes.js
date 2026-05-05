import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import User from "../models/User.js";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "../controllers/vehicleController.js";
import { getUpgrades, createUpgrade, updateUpgrade, deleteUpgrade } from "../controllers/upgradeController.js";

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireAdmin);

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });
    res.json({
      totalUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// =======================
// Vehicle Routes
// =======================

router.get("/vehicles", getVehicles);
router.post("/vehicles", createVehicle);
router.put("/vehicles/:id", updateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

// =======================
// Upgrade Routes
// =======================

router.get("/upgrades", getUpgrades);
router.post("/upgrades", createUpgrade);
router.put("/upgrades/:id", updateUpgrade);
router.delete("/upgrades/:id", deleteUpgrade);

export default router;
