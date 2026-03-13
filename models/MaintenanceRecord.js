import mongoose from "mongoose";

const maintenanceRecordSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: [true, "Asset ID is required"],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID is required"],
    },
    issueDescription: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
    },
    maintenanceType: {
      type: String,
      required: [true, "Maintenance type is required"],
      enum: {
        values: ["Repair", "Preventive", "Upgrade", "Inspection"],
        message: "{VALUE} is not a valid maintenance type",
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported by user ID is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // End date should be after start date if provided
          if (value && this.startDate) {
            return value >= this.startDate;
          }
          return true;
        },
        message: "End date must be after start date",
      },
    },
    downtimeHours: {
      type: Number,
      default: 0,
      min: [0, "Downtime hours cannot be negative"],
    },
    serviceCost: {
      type: Number,
      required: [true, "Service cost is required"],
      min: [0, "Service cost cannot be negative"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["Pending", "In Progress", "Completed"],
        message: "{VALUE} is not a valid status",
      },
      default: "Pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "maintenance_records",
  }
);

// Indexes for better query performance
maintenanceRecordSchema.index({ assetId: 1 });
maintenanceRecordSchema.index({ vendorId: 1 });
maintenanceRecordSchema.index({ status: 1 });
maintenanceRecordSchema.index({ startDate: 1 });
maintenanceRecordSchema.index({ userId: 1 });

export default mongoose.model("MaintenanceRecord", maintenanceRecordSchema);
