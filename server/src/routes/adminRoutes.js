import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import User from "../models/User.js";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "../controllers/vehicleController.js";
import { getUpgrades, createUpgrade, updateUpgrade, deleteUpgrade } from "../controllers/upgradeController.js";
import Vehicle from "../models/Vehicle.js";
import Upgrade from "../models/Upgrade.js";

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
    const regularUsers = totalUsers - adminUsers;

    // Vehicle Distribution
    const carsCount = await Vehicle.countDocuments({ type: "car" });
    const bikesCount = await Vehicle.countDocuments({ type: "bike" });

    // Parts Activity by Category
    const categories = ["Engine", "Exhaust", "Suspension", "Brakes", "Wheels", "Aesthetics", "Lights"];
    const partsActivity = await Promise.all(
      categories.map(async (cat) => ({
        category: cat,
        count: await Upgrade.countDocuments({ category: cat })
      }))
    );

    // Active Users Today (joined in last 24h)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeUsersToday = await User.countDocuments({ createdAt: { $gte: today } });

    // User Growth (last 6 months)
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - i);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const count = await User.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      });

      const monthName = startOfMonth.toLocaleString('default', { month: 'short' });
      userGrowth.push({ month: monthName, count });
    }

    res.json({
      totalUsers,
      adminUsers,
      regularUsers,
      vehicleDistribution: {
        cars: carsCount,
        bikes: bikesCount
      },
      partsActivity,
      activeUsersToday,
      userGrowth
    });
  } catch (err) {
    console.error("Stats Error:", err);
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

router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { email, role } = req.body;
    
    // Prevent changing role of admin users
    if (user.role === "admin" && role !== "admin") {
      return res.status(403).json({ message: "Cannot change role of admin user" });
    }
    
    // Prevent making new admin users
    if (user.role !== "admin" && role === "admin") {
      return res.status(403).json({ message: "Cannot promote users to admin" });
    }
    
    user.email = email || user.email;
    user.role = role || user.role;
    
    await user.save();
    res.json({ user: user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
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
