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
        "Off-Road Accessories", 
        "Wheels & Tyres", 
        "Lighting"
      ]
    },
    price: { type: Number, required: true },
    performanceGain: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    compatibleVehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
    compatibleFuels: [{ type: String, enum: ["Petrol", "Diesel"] }],
    compatibleTransmissions: [{ type: String, enum: ["Manual", "Automatic"] }],
    goals: [{ type: String }],
    stage: { type: String, enum: ["Stage 1", "Stage 2", "Stage 3", "Universal"], default: "Universal" }
  },
  { timestamps: true }
);

const Upgrade = mongoose.model("Upgrade", upgradeSchema);

export default Upgrade;
