// models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, "Employee ID must be at least 3 characters long"],
      maxlength: [20, "Employee ID cannot exceed 20 characters"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"],
      validate: {
        validator: function (value) {
          // Only letters, spaces, hyphens, and apostrophes
          return /^[a-zA-Z\s'-]+$/.test(value);
        },
        message: "First name can only contain letters, spaces, hyphens, and apostrophes",
      },
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
      validate: {
        validator: function (value) {
          // Only letters, spaces, hyphens, and apostrophes (if provided)
          return !value || /^[a-zA-Z\s'-]+$/.test(value);
        },
        message: "Last name can only contain letters, spaces, hyphens, and apostrophes",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          // Standard email regex pattern
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Please provide a valid email address",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          // Optional field, but if provided, must be valid (10-15 digits, optional +, spaces, hyphens)
          return !value || /^[\d\s\-+()]{10,20}$/.test(value);
        },
        message: "Please provide a valid phone number",
      },
    },
    department: {
      type: String,
      trim: true,
      enum: {
        values: [
          "IT",
          "HR",
          "Finance",
          "Marketing",
          "Sales",
          "Operations",
          "Engineering",
          "Design",
          "Customer Support",
          "Administration",
          "Other",
        ],
        message: "{VALUE} is not a valid department",
      },
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },
    joiningDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Joining date should not be in the future
          return !value || value <= new Date();
        },
        message: "Joining date cannot be in the future",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
    },
    profileImage: {
      type: String,
      trim: true,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
// Note: employeeId and email unique indexes are already created via schema field definitions
employeeSchema.index({ status: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ userId: 1 });

// Virtual field for full name
employeeSchema.virtual("fullName").get(function () {
  return this.lastName
    ? `${this.firstName} ${this.lastName}`
    : this.firstName;
});

// Ensure virtuals are included in JSON output
employeeSchema.set("toJSON", { virtuals: true });
employeeSchema.set("toObject", { virtuals: true });

export default mongoose.model("Employee", employeeSchema);
