// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Clean up legacy username index if it exists
        try {
            const collections = await conn.connection.db.listCollections({ name: 'users' }).toArray();
            if (collections.length > 0) {
                const indexes = await conn.connection.db.collection('users').indexes();
                if (indexes.some(index => index.name === 'username_1')) {
                    await conn.connection.db.collection('users').dropIndex('username_1');
                    console.log("Dropped legacy 'username_1' index from users collection.");
                }
            }
        } catch (indexError) {
            console.warn("Could not drop legacy index (it might not exist or already be gone):", indexError.message);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
