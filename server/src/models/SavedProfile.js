import mongoose from "mongoose";

const savedProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  upgrades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upgrade'
  }],
  goal: {
    type: String,
    required: true
  },
  totalBudget: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SavedProfile = mongoose.model("SavedProfile", savedProfileSchema);
export default SavedProfile;
