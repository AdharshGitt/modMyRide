import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ModMyRide';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Remove image and description from upgrades
    const upgradeResult = await mongoose.connection.collection('upgrades').updateMany(
      {}, 
      { $unset: { image: 1, description: 1 } }
    );
    console.log(`Updated ${upgradeResult.modifiedCount} upgrades, unsetting image and description.`);
    
    // Remove brandLogo and category from vehicles
    const vehicleResult = await mongoose.connection.collection('vehicles').updateMany(
      {},
      { $unset: { brandLogo: 1, category: 1 } }
    );
    console.log(`Updated ${vehicleResult.modifiedCount} vehicles, unsetting brandLogo and category.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
