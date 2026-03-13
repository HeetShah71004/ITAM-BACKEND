import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    vendorName: {
        type: String,
        required: [true, "Vendor name is required"],
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return !v || /^[\d\s\-+()]{7,20}$/.test(v);
            },
            message: "Please provide a valid phone number"
        }
    },
    address: {
        type: String,
        trim: true
    },
    servicesProvided: [{
        type: String,
        trim: true
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

// Indexes
vendorSchema.index({ vendorName: "text" });
vendorSchema.index({ userId: 1 });

export default mongoose.model("Vendor", vendorSchema);
