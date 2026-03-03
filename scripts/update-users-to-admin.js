import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables from .env file
dotenv.config();

const updateUsersToAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env file');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.updateMany({}, { $set: { role: 'admin' } });
        console.log(`Successfully updated ${result.modifiedCount} users to 'admin' role.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
};

updateUsersToAdmin();
