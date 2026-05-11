import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["car", "bike"] },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
    engine: { type: String, default: "" },
    fuelType: { type: String, enum: ["Petrol", "Diesel"], required: true },
    transmission: { type: String, enum: ["Manual", "Automatic"], required: true },
    stockPower: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
