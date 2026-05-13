import Upgrade from "../models/Upgrade.js";

import Vehicle from "../models/Vehicle.js";

// @desc    Get all upgrades
// @route   GET /api/admin/upgrades
// @access  Private/Admin
export const getUpgrades = async (req, res) => {
  try {
    const upgrades = await Upgrade.find().populate("compatibleVehicles").sort({ createdAt: -1 });
    res.json({ upgrades });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch upgrades", error: err.message });
  }
};

// @desc    Create an upgrade
// @route   POST /api/admin/upgrades
// @access  Private/Admin
export const createUpgrade = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.compatibleVehicles || payload.compatibleVehicles.length === 0) {
      const vehicles = await Vehicle.find({ type: payload.type }).select("_id");
      payload.compatibleVehicles = vehicles.map(v => v._id);
    }
    const upgrade = await Upgrade.create(payload);
    const populated = await Upgrade.findById(upgrade._id).populate("compatibleVehicles");
    res.status(201).json({ upgrade: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create upgrade", error: err.message });
  }
};

// @desc    Update an upgrade
// @route   PUT /api/admin/upgrades/:id
// @access  Private/Admin
export const updateUpgrade = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.compatibleVehicles || payload.compatibleVehicles.length === 0) {
      const vehicles = await Vehicle.find({ type: payload.type }).select("_id");
      payload.compatibleVehicles = vehicles.map(v => v._id);
    }
    const upgrade = await Upgrade.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate("compatibleVehicles");
    if (!upgrade) {
      return res.status(404).json({ message: "Upgrade not found" });
    }
    res.json({ upgrade });
  } catch (err) {
    res.status(500).json({ message: "Failed to update upgrade", error: err.message });
  }
};

// @desc    Delete an upgrade
// @route   DELETE /api/admin/upgrades/:id
// @access  Private/Admin
export const deleteUpgrade = async (req, res) => {
  try {
    const upgrade = await Upgrade.findByIdAndDelete(req.params.id);
    if (!upgrade) {
      return res.status(404).json({ message: "Upgrade not found" });
    }
    res.json({ message: "Upgrade deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete upgrade", error: err.message });
  }
};
