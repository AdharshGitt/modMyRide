import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import User from "../models/User.js";
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

router.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

router.post("/vehicles", async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: "Failed to create vehicle", error: err.message });
  }
});

router.put("/vehicles/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: "Failed to update vehicle", error: err.message });
  }
});

router.delete("/vehicles/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete vehicle", error: err.message });
  }
});

// =======================
// Upgrade Routes
// =======================

router.get("/upgrades", async (req, res) => {
  try {
    const upgrades = await Upgrade.find().populate("compatibleVehicles").sort({ createdAt: -1 });
    res.json({ upgrades });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch upgrades", error: err.message });
  }
});

router.post("/upgrades", async (req, res) => {
  try {
    const upgrade = await Upgrade.create(req.body);
    const populated = await Upgrade.findById(upgrade._id).populate("compatibleVehicles");
    res.status(201).json({ upgrade: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create upgrade", error: err.message });
  }
});

router.put("/upgrades/:id", async (req, res) => {
  try {
    const upgrade = await Upgrade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("compatibleVehicles");
    if (!upgrade) {
      return res.status(404).json({ message: "Upgrade not found" });
    }
    res.json({ upgrade });
  } catch (err) {
    res.status(500).json({ message: "Failed to update upgrade", error: err.message });
  }
});

router.delete("/upgrades/:id", async (req, res) => {
  try {
    const upgrade = await Upgrade.findByIdAndDelete(req.params.id);
    if (!upgrade) {
      return res.status(404).json({ message: "Upgrade not found" });
    }
    res.json({ message: "Upgrade deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete upgrade", error: err.message });
  }
});

export default router;
