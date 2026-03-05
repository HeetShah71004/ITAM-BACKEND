import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/itam';

async function checkUsers() {
    try {
        await mongoose.connect(uri);
        const users = await User.find({}, 'email role fullName');
        console.log('--- USERS ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('--------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
