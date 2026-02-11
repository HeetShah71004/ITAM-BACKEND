// server/server.js
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import app from "./app.js";

// Load Environment Variables
dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
