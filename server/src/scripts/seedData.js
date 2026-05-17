import mongoose from "mongoose";
import dotenv from "dotenv";
import Vehicle from "../models/Vehicle.js";
import Upgrade from "../models/Upgrade.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Vehicle.deleteMany({});
    await Upgrade.deleteMany({});

    // 1. Create Vehicles with Variants
    const fortunerDieselAT = await Vehicle.create({
      make: "Toyota",
      model: "Fortuner",
      year: 2023,
      type: "car",
      fuelType: "Diesel",
      transmission: "Automatic",
      stockPower: 201,
      engine: "2.8L Turbo Diesel",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"
    });

    const fortunerPetrolMT = await Vehicle.create({
      make: "Toyota",
      model: "Fortuner",
      year: 2023,
      type: "car",
      fuelType: "Petrol",
      transmission: "Manual",
      stockPower: 164,
      engine: "2.7L VVTi Petrol",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"
    });

    const tharDieselMT = await Vehicle.create({
      make: "Mahindra",
      model: "Thar",
      year: 2023,
      type: "car",
      fuelType: "Diesel",
      transmission: "Manual",
      stockPower: 130,
      engine: "2.2L mHawk Diesel",
      image: "https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?auto=format&fit=crop&q=80&w=800"
    });

    const tharPetrolAT = await Vehicle.create({
      make: "Mahindra",
      model: "Thar",
      year: 2023,
      type: "car",
      fuelType: "Petrol",
      transmission: "Automatic",
      stockPower: 150,
      engine: "2.0L mStallion Petrol",
      image: "https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?auto=format&fit=crop&q=80&w=800"
    });

    console.log("Vehicles created with variants");

    // 2. Create Upgrades with Compatibility
    await Upgrade.create([
      {
        name: "K&N Cold Air Intake",
        type: "car",
        category: "Air Intake",
        price: 15000,
        goals: ["Performance", "Better Mileage"],
        compatibleVehicles: [fortunerDieselAT._id, tharPetrolAT._id],
        compatibleFuels: ["Petrol"]
      },
      {
        name: "Diesel Performance Box (Stage 1)",
        type: "car",
        category: "ECU & Tuning",
        price: 35000,
        goals: ["Performance"],
        compatibleVehicles: [fortunerDieselAT._id, tharDieselMT._id],
        compatibleFuels: ["Diesel"]
      },
      {
        name: "TCU Tune (Automatic Gearbox)",
        type: "car",
        category: "ECU & Tuning",
        price: 45000,
        goals: ["Performance", "Handling"],
        compatibleVehicles: [fortunerDieselAT._id, tharPetrolAT._id],
        compatibleTransmissions: ["Automatic"]
      },
      {
        name: "Bilstein B6 Performance Suspension",
        type: "car",
        category: "Suspension",
        price: 85000,
        goals: ["Handling"],
        compatibleVehicles: [fortunerDieselAT._id, fortunerPetrolMT._id]
      },
      {
        name: "Old Man Emu Off-Road Kit",
        type: "car",
        category: "Off-Road Accessories",
        price: 120000,
        goals: ["Off-Road"],
        compatibleVehicles: [tharDieselMT._id, tharPetrolAT._id]
      },
      {
        name: "Philips CrystalVision Ultra LED",
        type: "car",
        category: "Lighting",
        price: 8000,
        goals: ["Lighting Improvements"],
        compatibleVehicles: [fortunerDieselAT._id, tharDieselMT._id, tharPetrolAT._id]
      }
    ]);

    console.log("Upgrades created with compatibility filters");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
};

seedData();
