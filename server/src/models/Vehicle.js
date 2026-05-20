import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["car", "bike"] },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
    engine: { type: String, default: "" },
    fuelType: { 
      type: String, 
      enum: ["Petrol", "Diesel"], 
      required: function() { return this.type === 'car'; } 
    },
    transmission: { 
      type: String, 
      enum: ["Manual", "Automatic", "Both"], 
      required: function() { return this.type === 'car'; } 
    },
    stockPower: { type: Number, default: 0 },
    mileage: { type: String, default: "" },
    torque: { type: String, default: "" },
    torqueNM: { type: Number, default: 0 },
    displacement: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
