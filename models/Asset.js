// models/Asset.js
import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String, // Laptop, Desktop, Monitor, Printer, etc.
      required: true,
    },
    brand: {
      type: String,
    },
    model: {
      type: String,
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchaseCost: {
      type: Number,
    },
    warrantyExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Available", "Assigned", "Under Repair", "Retired"],
      default: "Available",
    },
    currentAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    location: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Asset", assetSchema);