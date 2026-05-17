import mongoose from "mongoose";

const upgradeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ["car", "bike"] },
    category: { 
      type: String, 
      required: true,
      enum: [
        "Air Intake", 
        "Exhaust Systems", 
        "ECU & Tuning", 
        "Suspension", 
        "Brakes", 
        "Wheels & Tyres", 
        "Lighting"
      ]
    },
    price: { type: Number, required: true },
    performanceGain: { type: String, default: "" },
    performanceGainHP: { type: Number, default: 0 },
    torque: { type: String, default: "" },
    torqueGainNM: { type: Number, default: 0 },
    mileage: { type: String, default: "" },
    mileageImpact: { type: Number, default: 0 },
    handlingScore: { type: Number, default: 0 },
    brakingScore: { type: Number, default: 0 },
    compatibleVehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
    goals: [{ type: String }],
    stage: { type: String, enum: ["Stage 1", "Stage 2", "Stage 3", "Universal"], default: "Universal" },
    image: { type: String, default: "" },
    description: { type: String, default: "" },

  },
  { timestamps: true }
);

const Upgrade = mongoose.model("Upgrade", upgradeSchema);

export default Upgrade;
