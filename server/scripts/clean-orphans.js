import mongoose from 'mongoose';
import SavedProfile from '../src/models/SavedProfile.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function cleanOrphans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const profiles = await SavedProfile.find();
    
    for (const profile of profiles) {
      const userObj = await User.findById(profile.user);
      console.log(`Profile: ${profile.name}`);
      if (userObj) {
         console.log(`User ID: ${userObj._id}, Username: ${userObj.username}, Email: ${userObj.email}`);
      } else {
         console.log('ORPHAN');
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

cleanOrphans();
