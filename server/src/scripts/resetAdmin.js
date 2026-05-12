import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const email = "admin1@modmyride.com";
    const password = await bcrypt.hash("adminpassword123", 10);

    const user = await User.findOneAndUpdate(
      { email },
      { password, role: "admin" },
      { upsert: true, new: true }
    );

    console.log(`Admin user reset: ${user.email} with password adminpassword123`);
    process.exit(0);
  } catch (err) {
    console.error("Error resetting admin user:", err);
    process.exit(1);
  }
};

resetAdmin();
