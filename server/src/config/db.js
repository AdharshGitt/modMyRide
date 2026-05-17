import mongoose from "mongoose";
import Vehicle from "../models/Vehicle.js";

const syncVehicleVariants = async () => {
  try {
    const vehicles = await Vehicle.find();
    const groups = {};
    vehicles.forEach(v => {
      const key = `${v.type}-${v.make}-${v.model}-${v.year}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(v);
    });

    let syncCount = 0;
    for (const key of Object.keys(groups)) {
      const variants = groups[key];
      const source = variants.find(v => v.image && v.image.trim() !== "");
      if (source) {
        for (const variant of variants) {
          if (
            variant.image !== source.image || 
            variant.brandLogo !== source.brandLogo || 
            variant.description !== source.description || 
            variant.category !== source.category
          ) {
            await Vehicle.findByIdAndUpdate(variant._id, {
              $set: {
                image: source.image,
                brandLogo: source.brandLogo || "",
                description: source.description || "",
                category: source.category || ""
              }
            });
            syncCount++;
          }
        }
      }
    }
    if (syncCount > 0) {
      console.log(`Synced visual properties across ${syncCount} vehicle variants successfully.`);
    }
  } catch (err) {
    console.error("Failed to sync vehicle variants:", err.message);
  }
};

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
    await syncVehicleVariants();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
