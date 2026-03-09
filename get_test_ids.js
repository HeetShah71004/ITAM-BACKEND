import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from './models/Asset.js';
import Vendor from './models/Vendor.js';
import User from './models/User.js';

dotenv.config();

async function getIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const asset = await Asset.findOne({});
    const vendor = await Vendor.findOne({});
    const user = await User.findOne({ role: 'Admin' }) || await User.findOne({});
    
    console.log('--- TEST IDS ---');
    console.log(`Asset ID: ${asset ? asset._id : 'None found'}`);
    console.log(`Vendor ID: ${vendor ? vendor._id : 'None found'}`);
    console.log(`User ID (Admin): ${user ? user._id : 'None found'}`);
    console.log('--- END ---');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getIds();
