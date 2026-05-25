import SavedProfile from "../models/SavedProfile.js";
import Vehicle from "../models/Vehicle.js";
import Upgrade from "../models/Upgrade.js";

export const saveProfile = async (req, res) => {
  try {
    const { name, vehicleId, customVehicle, upgradeIds, customUpgrades, goal, totalBudget, totalCost, isAiBuild, aiResult } = req.body;
    
    const profile = new SavedProfile({
      user: req.user.id,
      name,
      vehicle: (vehicleId === "ai-synthetic" || !vehicleId) ? undefined : vehicleId,
      customVehicle: (vehicleId === "ai-synthetic" || !vehicleId) ? customVehicle : undefined,
      upgrades: upgradeIds || [],
      customUpgrades: customUpgrades || [],
      goal,
      totalBudget,
      totalCost,
      isAiBuild: !!isAiBuild,
      aiResult: aiResult || undefined
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
    const profile = await SavedProfile.findById(req.params.id)
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

export const getTopRankedBuilds = async (req, res) => {
  try {
    const profiles = await SavedProfile.find()
      .populate('vehicle')
      .populate('user', 'username')
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(5)
      .select('-aiResult');

    res.json({ profiles });
  } catch (err) {
    console.error("Get Top Ranked Builds Error:", err);
    res.status(500).json({ message: "Error fetching top builds" });
  }
};

export const getCommunityBuilds = async (req, res) => {
  try {
    const profiles = await SavedProfile.find()
      .populate('vehicle')
      .populate('user', 'username')
      .sort({ likeCount: -1, createdAt: -1 })
      .select('-aiResult');

    res.json({ profiles });
  } catch (err) {
    console.error("Get Community Builds Error:", err);
    res.status(500).json({ message: "Error fetching community builds" });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const profile = await SavedProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Build not found" });
    }

    const userId = req.user.id;
    const hasLiked = profile.likes.some(id => id.toString() === userId);

    if (hasLiked) {
      // Unlike
      profile.likes = profile.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      profile.likes.push(userId);
    }

    profile.likeCount = profile.likes.length;
    await profile.save();

    res.json({ 
      liked: !hasLiked, 
      likeCount: profile.likeCount 
    });
  } catch (err) {
    console.error("Toggle Like Error:", err);
    res.status(500).json({ message: "Error toggling like" });
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

// =======================
// Admin Functions
// =======================

export const getAdminProfiles = async (req, res) => {
  try {
    // Auto-fix any previous users who don't have a username saved
    const User = (await import('../models/User.js')).default;
    const missingUsers = await User.find({ 
      $or: [{ username: { $exists: false } }, { username: null }, { username: "" }] 
    });
    for (const u of missingUsers) {
      if (u.email) {
        u.username = u.email.split('@')[0];
        await u.save();
      }
    }

    const profiles = await SavedProfile.find()
      .populate('user', 'username email')
      .populate('vehicle')
      .sort({ createdAt: -1 });
    
    res.json({ profiles });
  } catch (err) {
    console.error("Get Admin Profiles Error:", err);
    res.status(500).json({ message: "Error fetching admin profiles" });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name, goal, description } = req.body;
    const profile = await SavedProfile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (name) profile.name = name;
    if (goal) profile.goal = goal;
    if (description !== undefined) profile.description = description;

    await profile.save();
    
    // Repopulate user and vehicle for the frontend
    await profile.populate('user', 'username email');
    await profile.populate('vehicle');

    res.json({ message: "Profile updated successfully", profile });
  } catch (err) {
    console.error("Update Admin Profile Error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};

export const deleteAdminProfile = async (req, res) => {
  try {
    const profile = await SavedProfile.findByIdAndDelete(req.params.id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("Delete Admin Profile Error:", err);
    res.status(500).json({ message: "Error deleting profile" });
  }
};
