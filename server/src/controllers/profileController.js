import SavedProfile from "../models/SavedProfile.js";
import Vehicle from "../models/Vehicle.js";
import Upgrade from "../models/Upgrade.js";

export const saveProfile = async (req, res) => {
  try {
    const { name, vehicleId, upgradeIds, goal, totalBudget, totalCost } = req.body;
    
    const profile = new SavedProfile({
      user: req.user.id,
      name,
      vehicle: vehicleId,
      upgrades: upgradeIds,
      goal,
      totalBudget,
      totalCost
    });

    await profile.save();
    res.status(201).json({ message: "Profile saved successfully", profile });
  } catch (err) {
    console.error("Save Profile Error:", err);
    res.status(500).json({ message: "Error saving profile" });
  }
};

export const getProfiles = async (req, res) => {
  try {
    const profiles = await SavedProfile.find({ user: req.user.id })
      .populate('vehicle')
      .populate('upgrades')
      .sort({ createdAt: -1 });
    
    res.json({ profiles });
  } catch (err) {
    console.error("Get Profiles Error:", err);
    res.status(500).json({ message: "Error fetching profiles" });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const profile = await SavedProfile.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    })
    .populate('vehicle')
    .populate('upgrades');

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ profile });
  } catch (err) {
    console.error("Get Profile By ID Error:", err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const profile = await SavedProfile.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Delete Profile Error:", err);
    res.status(500).json({ message: "Error deleting profile" });
  }
};
