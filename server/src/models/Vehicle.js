import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["car", "bike"] },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    trim: { type: String, default: "" },
    engine: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
