// models/Asset.js
import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, "Asset tag is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Asset tag must be at least 3 characters long"],
      maxlength: [20, "Asset tag cannot exceed 20 characters"],
    },
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
      minlength: [2, "Asset name must be at least 2 characters long"],
      maxlength: [100, "Asset name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Asset category is required"],
      enum: {
        values: [
          "Laptop",
          "Desktop",
          "Monitor",
          "Printer",
          "Scanner",
          "Phone",
          "Tablet",
          "Server",
          "Network Equipment",
          "Accessories",
          "Software",
          "Other",
        ],
        message: "{VALUE} is not a valid asset category",
      },
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, "Brand name cannot exceed 50 characters"],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [50, "Model name cannot exceed 50 characters"],
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      maxlength: [50, "Serial number cannot exceed 50 characters"],
    },
    purchaseDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Purchase date should not be in the future
          return !value || value <= new Date();
        },
        message: "Purchase date cannot be in the future",
      },
    },
    purchaseCost: {
      type: Number,
      min: [0, "Purchase cost cannot be negative"],
      validate: {
        validator: function (value) {
          // If provided, must be a valid number with max 2 decimal places
          return !value || /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: "Purchase cost must have at most 2 decimal places",
      },
    },
    warrantyExpiry: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          // Warranty expiry should be after purchase date if both are provided
          if (value && this.purchaseDate) {
            return value >= this.purchaseDate;
          }
          return true;
        },
        message: "Warranty expiry date must be after purchase date",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["Available", "Assigned", "Under Repair", "Retired"],
        message: "{VALUE} is not a valid status",
      },
      default: "Available",
    },
    currentAssignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      validate: {
        validator: function (value) {
          // If assigned, status should be "Assigned"
          if (value && this.status !== "Assigned") {
            return false;
          }
          // If not assigned, status should not be "Assigned"
          if (!value && this.status === "Assigned") {
            return false;
          }
          return true;
        },
        message: "Asset assignment status mismatch",
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ currentAssignedTo: 1 });
assetSchema.index({ userId: 1 });
// Note: assetTag unique index is already created via schema field definition

// Virtual field for warranty status
assetSchema.virtual("isUnderWarranty").get(function () {
  if (!this.warrantyExpiry) return false;
  return this.warrantyExpiry > new Date();
});

// Ensure virtuals are included in JSON output
assetSchema.set("toJSON", { virtuals: true });
assetSchema.set("toObject", { virtuals: true });

export default mongoose.model("Asset", assetSchema);