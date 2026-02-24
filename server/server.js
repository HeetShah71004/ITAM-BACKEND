// server/server.js
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import app from "./app.js";
import { initScheduledJobs } from "../jobs/scheduledJobs.js";

// Load Environment Variables
dotenv.config();

// Connect to Database
connectDB();

// Start scheduled cron jobs (license & warranty expiry checks)
initScheduledJobs();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
