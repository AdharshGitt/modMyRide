import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const email = "admin1@modmyride.com";
    const password = await bcrypt.hash("adminpassword123", 10);

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    await User.create({ email, password, role: "admin" });
    console.log("Admin user created successfully (admin@modmyride.com / adminpassword123)");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin user:", err);
    process.exit(1);
  }
};

seedAdmin();
