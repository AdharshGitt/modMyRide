import mongoose from 'mongoose';
import SavedProfile from './server/src/models/SavedProfile.js';
import User from './server/src/models/User.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const profiles = await SavedProfile.find().populate('user', 'email username');
  for (const p of profiles) {
    if (!p.user) {
      console.log(`Profile ${p.name} is ORPHANED. User ID: ${p._doc.user}`);
    } else {
      console.log(`Profile ${p.name} belongs to User: ${p.user.username} (${p.user.email})`);
    }
  }
  process.exit(0);
}
check();
