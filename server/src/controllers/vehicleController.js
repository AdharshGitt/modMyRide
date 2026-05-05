import Vehicle from "../models/Vehicle.js";

// @desc    Get all vehicles
// @route   GET /api/admin/vehicles
// @access  Private/Admin
export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};

// @desc    Create a vehicle
// @route   POST /api/admin/vehicles
// @access  Private/Admin
export const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: "Failed to create vehicle", error: err.message });
  }
};

// @desc    Update a vehicle
// @route   PUT /api/admin/vehicles/:id
// @access  Private/Admin
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: "Failed to update vehicle", error: err.message });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/admin/vehicles/:id
// @access  Private/Admin
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete vehicle", error: err.message });
  }
};
