import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/itam';

async function normalizeRoles() {
    try {
        await mongoose.connect(uri);
        const users = await User.find({});
        for (const user of users) {
            if (user.role) {
                const normalized = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
                if (user.role !== normalized) {
                    console.log(`Updating ${user.email}: ${user.role} -> ${normalized}`);
                    user.role = normalized;
                    await user.save();
                }
            }
        }
        console.log('Role normalization complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

normalizeRoles();
