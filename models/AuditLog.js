import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'UPLOAD']
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['Asset', 'Employee', 'SoftwareLicense', 'User', 'Vendor', 'MaintenanceRecord', 'AssignmentHistory']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    oldValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    newValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for faster lookups
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
