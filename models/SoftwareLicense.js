// models/SoftwareLicense.js
import mongoose from "mongoose";

// Sub-schema for individual seat assignments
const licenseAssignmentSchema = new mongoose.Schema(
    {
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
        },
        assignedBy: {
            type: String,
            trim: true,
            maxlength: [100, "Assigned by field cannot exceed 100 characters"],
            default: "System",
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [300, "Notes cannot exceed 300 characters"],
        },
    },
    { _id: true }
);

const softwareLicenseSchema = new mongoose.Schema(
    {
        licenseKey: {
            type: String,
            required: [true, "License key is required"],
            unique: true,
            trim: true,
            uppercase: true,
            minlength: [5, "License key must be at least 5 characters"],
            maxlength: [100, "License key cannot exceed 100 characters"],
        },
        softwareName: {
            type: String,
            required: [true, "Software name is required"],
            trim: true,
            minlength: [2, "Software name must be at least 2 characters"],
            maxlength: [100, "Software name cannot exceed 100 characters"],
        },
        vendor: {
            type: String,
            trim: true,
            maxlength: [100, "Vendor name cannot exceed 100 characters"],
        },
        version: {
            type: String,
            trim: true,
            maxlength: [50, "Version cannot exceed 50 characters"],
        },
        licenseType: {
            type: String,
            required: [true, "License type is required"],
            enum: {
                values: ["Perpetual", "Subscription", "Trial", "OEM", "Open Source"],
                message: "{VALUE} is not a valid license type",
            },
        },
        totalSeats: {
            type: Number,
            required: [true, "Total seats is required"],
            min: [1, "Total seats must be at least 1"],
            validate: {
                validator: Number.isInteger,
                message: "Total seats must be a whole number",
            },
        },
        usedSeats: {
            type: Number,
            default: 0,
            min: [0, "Used seats cannot be negative"],
            validate: [
                {
                    validator: Number.isInteger,
                    message: "Used seats must be a whole number",
                },
                {
                    validator: function (value) {
                        return value <= this.totalSeats;
                    },
                    message: "Used seats cannot exceed total seats",
                },
            ],
        },
        purchaseDate: {
            type: Date,
            validate: {
                validator: function (value) {
                    return !value || value <= new Date();
                },
                message: "Purchase date cannot be in the future",
            },
        },
        expiryDate: {
            type: Date,
            validate: {
                validator: function (value) {
                    if (value && this.purchaseDate) {
                        return value > this.purchaseDate;
                    }
                    return true;
                },
                message: "Expiry date must be after purchase date",
            },
        },
        supportEndDate: {
            type: Date,
        },
        cost: {
            type: Number,
            min: [0, "Cost cannot be negative"],
            validate: {
                validator: function (value) {
                    return !value || /^\d+(\.\d{1,2})?$/.test(value.toString());
                },
                message: "Cost must have at most 2 decimal places",
            },
        },
        status: {
            type: String,
            enum: {
                values: ["Active", "Expired", "Suspended"],
                message: "{VALUE} is not a valid license status",
            },
            default: "Active",
        },
        platform: {
            type: String,
            trim: true,
            enum: {
                values: ["Windows", "macOS", "Linux", "Web", "Cross-Platform", "Other"],
                message: "{VALUE} is not a valid platform",
            },
        },
        category: {
            type: String,
            trim: true,
            enum: {
                values: [
                    "Productivity",
                    "Security",
                    "Development",
                    "Design",
                    "Communication",
                    "Database",
                    "Analytics",
                    "Other",
                ],
                message: "{VALUE} is not a valid category",
            },
        },
        // Embedded array of per-seat assignments
        assignedTo: {
            type: [licenseAssignmentSchema],
            default: [],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters"],
        },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
softwareLicenseSchema.index({ softwareName: 1 });
softwareLicenseSchema.index({ status: 1 });
softwareLicenseSchema.index({ expiryDate: 1 });
softwareLicenseSchema.index({ licenseType: 1 });
softwareLicenseSchema.index({ "assignedTo.employee": 1 });

// ── Virtuals ─────────────────────────────────────────────────────────────────

// Seats still available
softwareLicenseSchema.virtual("availableSeats").get(function () {
    return this.totalSeats - this.usedSeats;
});

// True if expiry date is in the past
softwareLicenseSchema.virtual("isExpired").get(function () {
    if (!this.expiryDate) return false;
    return this.expiryDate < new Date();
});

// Days until expiry (negative means already expired)
softwareLicenseSchema.virtual("daysUntilExpiry").get(function () {
    if (!this.expiryDate) return null;
    const diff = this.expiryDate - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

softwareLicenseSchema.set("toJSON", { virtuals: true });
softwareLicenseSchema.set("toObject", { virtuals: true });

export default mongoose.model("SoftwareLicense", softwareLicenseSchema);
