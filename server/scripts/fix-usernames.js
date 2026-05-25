import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixUsernames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const users = await User.find();
    let updatedCount = 0;

    for (const user of users) {
      if (!user.username) {
        const generatedUsername = user.email.split('@')[0];
        user.username = generatedUsername;
        await user.save();
        console.log(`Updated user ${user.email} with username: ${generatedUsername}`);
        updatedCount++;
      }
    }

    console.log(`Update complete. Fixed ${updatedCount} users.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

fixUsernames();
