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
    required: false
  },
  customVehicle: {
    make: String,
    model: String,
    type: { type: String }
  },
  upgrades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upgrade'
  }],
  customUpgrades: [{
    name: String,
    category: String,
    price: Number,
    reasoning: String
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
  isAiBuild: {
    type: Boolean,
    default: false
  },
  aiResult: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  image: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SavedProfile = mongoose.model("SavedProfile", savedProfileSchema);
export default SavedProfile;
