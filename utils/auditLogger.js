import AuditLog from "../models/AuditLog.js";

/**
 * Centrally log an audit entry to the database.
 * 
 * @param {Object} params
 * @param {string} [params.userId] - The ID of the user performing the action.
 * @param {string} params.action - The action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT).
 * @param {string} params.resourceType - The entity type affected (Asset, Employee, etc.).
 * @param {string} [params.resourceId] - The ID of the affected entity.
 * @param {Object} [params.oldValues] - Snapshot of the data before the operation.
 * @param {Object} [params.newValues] - Snapshot of the data after the operation.
 * @param {Object} [params.req] - The Express request object to extract context (IP, UA).
 * @param {string} [params.status] - SUCCESS or FAILURE.
 * @param {string} [params.errorMessage] - Error message if status is FAILURE.
 */
export const logAudit = async ({ 
    userId, 
    action, 
    resourceType, 
    resourceId, 
    oldValues = null, 
    newValues = null, 
    req, 
    status = 'SUCCESS',
    errorMessage = null
}) => {
    try {
        const auditData = {
            action,
            resourceType,
            resourceId,
            oldValues,
            newValues,
            status,
            errorMessage
        };

        // Extract user from request if not provided
        if (!userId && req && req.user) {
            auditData.user = req.user._id;
        } else if (userId) {
            auditData.user = userId;
        }

        // Extract context from request
        if (req) {
            auditData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            auditData.userAgent = req.headers['user-agent'];
        }

        // Calculate specific changes for UPDATE actions
        if (action === 'UPDATE' && oldValues && newValues) {
            const changes = {};
            const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
            
            for (const key of keys) {
                // Skip internal Mongoose fields or complex objects for simplicity in top-level changes
                if (key.startsWith('_') || key === 'updatedAt' || key === 'createdAt') continue;
                
                const oldVal = JSON.stringify(oldValues[key]);
                const newVal = JSON.stringify(newValues[key]);
                
                if (oldVal !== newVal) {
                    changes[key] = {
                        from: oldValues[key],
                        to: newValues[key]
                    };
                }
            }
            auditData.changes = changes;
        }

        const logEntry = new AuditLog(auditData);
        await logEntry.save();
    } catch (error) {
        console.error("Failed to log audit:", error);
        // Logging should not break the main application flow
    }
};

/**
 * Utility to compare two objects and return only the changed fields.
 * Useful for prepopulating newValues in logAudit.
 */
export const getChangedFields = (oldObj, newObj) => {
    const changes = {};
    for (const key in newObj) {
        if (newObj[key] !== oldObj[key]) {
            changes[key] = newObj[key];
        }
    }
    return changes;
};
