// models/AssignmentHistory.js
import mongoose from "mongoose";

const assignmentHistorySchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: [true, "Asset reference is required"],
      validate: {
        validator: function (value) {
          return mongoose.Types.ObjectId.isValid(value);
        },
        message: "Invalid asset ID",
      },
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee reference is required"],
      validate: {
        validator: function (value) {
          return mongoose.Types.ObjectId.isValid(value);
        },
        message: "Invalid employee ID",
      },
    },
    assignedDate: {
      type: Date,
      default: Date.now,
      required: [true, "Assigned date is required"],
      validate: {
        validator: function (value) {
          // Assigned date should not be in the future
          return value <= new Date();
        },
        message: "Assigned date cannot be in the future",
      },
    },
    returnedDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          // If returned date is provided, it must be after assigned date
          if (value && this.assignedDate) {
            return value >= this.assignedDate;
          }
          return true;
        },
        message: "Returned date must be after assigned date",
      },
    },
    assignedBy: {
      type: String,
      trim: true,
      maxlength: [100, "Assigned by field cannot exceed 100 characters"],
      // Future: can be changed to ObjectId reference to User/Admin model
    },
    returnCondition: {
      type: String,
      trim: true,
      enum: {
        values: ["Good", "Fair", "Damaged", "Lost", ""],
        message: "{VALUE} is not a valid return condition",
      },
      validate: {
        validator: function (value) {
          // Return condition should only be set if asset is returned
          if (value && !this.returnedDate) {
            return false;
          }
          return true;
        },
        message: "Return condition can only be set when asset is returned",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
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
assignmentHistorySchema.index({ asset: 1 });
assignmentHistorySchema.index({ employee: 1 });
assignmentHistorySchema.index({ assignedDate: -1 });
assignmentHistorySchema.index({ returnedDate: 1 });
assignmentHistorySchema.index({ asset: 1, employee: 1 });
assignmentHistorySchema.index({ userId: 1 });

// Virtual field to check if assignment is active
assignmentHistorySchema.virtual("isActive").get(function () {
  return !this.returnedDate;
});

// Virtual field to calculate assignment duration
assignmentHistorySchema.virtual("assignmentDuration").get(function () {
  const endDate = this.returnedDate || new Date();
  const startDate = this.assignedDate;
  const durationMs = endDate - startDate;
  return Math.floor(durationMs / (1000 * 60 * 60 * 24)); // Duration in days
});

// Ensure virtuals are included in JSON output
assignmentHistorySchema.set("toJSON", { virtuals: true });
assignmentHistorySchema.set("toObject", { virtuals: true });

export default mongoose.model("AssignmentHistory", assignmentHistorySchema);