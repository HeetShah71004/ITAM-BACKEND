import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    action: {
        type: String,
        required: true,
        enum: [
            'CREATE_ASSET', 'UPDATE_ASSET', 'DELETE_ASSET',
            'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DELETE_EMPLOYEE',
            'CREATE_LICENSE', 'UPDATE_LICENSE', 'DELETE_LICENSE',
            'USER_LOGIN', 'USER_LOGOUT', 'EXPORT_DATA',
            'CREATE_VENDOR', 'UPDATE_VENDOR', 'DELETE_VENDOR'
        ]
    },
    targetType: {
        type: String,
        required: true,
        enum: ['Asset', 'Employee', 'SoftwareLicense', 'User', 'System', 'Vendor']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for faster lookups
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ action: 1 });

export default mongoose.model('ActivityLog', activityLogSchema);
